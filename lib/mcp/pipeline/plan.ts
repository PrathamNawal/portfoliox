// Structure planning and asset mapping. Deterministic: the same facts and screens always give the same
// structure, so re-runs are stable and the rules are testable.
import { DISCIPLINE_TEMPLATES, SECTION_DEFS } from '@/lib/case-study-templates'
import type { Block, CaseDiscipline, CaseSection, CaseSectionType, OverviewData } from '@/types'
import type { BuildInput, FactSheet, PlannedSection, Screen, ScreenKind } from '../types'

export const MAX_IMAGES_PER_SECTION = 12
const GALLERY_CHUNK = 6
export const MORE_SCREENS_TITLE = 'More screens'

export function sectionId(type: CaseSectionType, title?: string): string {
  return type === 'custom' ? `mcp-custom-${(title ?? 'more').toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : `mcp-${type}`
}

export function inferDiscipline(given: CaseDiscipline | undefined, facts: FactSheet, screens: Screen[], input: BuildInput): CaseDiscipline {
  if (given) return given
  if (facts.discipline) return facts.discipline
  const text = `${input.brief} ${input.process_notes ?? ''}`.toLowerCase()
  if (/\b(animation|motion|storyboard|after effects|lottie|rive)\b/.test(text) || screens.some(s => s.kind === 'storyboard' || s.source === 'video')) return 'motion'
  if (/\b(illustration|illustrated|sketchbook|character design)\b/.test(text)) return 'illustration'
  if (/\b(brand|identity|logo|visual identity|guidelines|typeface)\b/.test(text) || screens.some(s => s.kind === 'moodboard')) return 'brand'
  return 'ux'
}

const HOME: Record<ScreenKind, CaseSectionType> = {
  research: 'research', audit: 'research',
  flow: 'process', wireframe: 'process', moodboard: 'process', storyboard: 'process', other: 'process',
  hifi: 'solution', final: 'solution', before: 'solution', after: 'solution', prototype: 'solution',
}
const FALLBACK: Partial<Record<CaseSectionType, CaseSectionType[]>> = {
  research: ['process', 'challenge', 'solution'],
  process: ['solution', 'research'],
  solution: ['process'],
}

export function planStructure(discipline: CaseDiscipline, facts: FactSheet, screens: Screen[], input: BuildInput): PlannedSection[] {
  const base = discipline === 'custom' ? DISCIPLINE_TEMPLATES.ux.sections : DISCIPLINE_TEMPLATES[discipline].sections
  const hasResearch = facts.methods.length + facts.findings.length > 0 || screens.some(s => s.kind === 'research' || s.kind === 'audit')
  const hasNext = /\b(next steps?|future|roadmap|phase 2|v2|later we)\b/i.test(`${input.brief} ${input.process_notes ?? ''}`)
  const types = base.filter(t => (t !== 'research' || hasResearch) && (t !== 'whatsnext' || hasNext))
  // A motion or illustration brief with real research still gets the section.
  if (hasResearch && !types.includes('research')) types.splice(types.indexOf('challenge') + 1, 0, 'research')

  const plan: PlannedSection[] = types.map(type => ({ type, title: SECTION_DEFS[type].title, screenIds: [] }))
  const find = (t: CaseSectionType) => plan.find(p => p.type === t)
  const overflow: string[] = []
  const countImages = (p: PlannedSection) => p.screenIds.length

  for (const s of [...screens].sort((a, b) => a.order - b.order)) {
    const home = s.source === 'video' || s.source === 'figma-embed' ? 'solution' : HOME[s.kind]
    const target = find(home) ?? (FALLBACK[home] ?? []).map(find).find(Boolean) ?? plan[plan.length - 1]
    if (countImages(target) >= MAX_IMAGES_PER_SECTION && s.source !== 'figma-embed' && s.source !== 'video') overflow.push(s.id)
    else target.screenIds.push(s.id)
  }
  if (overflow.length) plan.push({ type: 'custom', title: MORE_SCREENS_TITLE, screenIds: overflow })
  return plan
}

/** Turns a section's screens into blocks: compare pairs, embeds, videos, then images and galleries by kind. */
export function blocksFor(section: PlannedSection, screens: Screen[]): Block[] {
  const byId = new Map(screens.map(s => [s.id, s]))
  const mine = section.screenIds.map(id => byId.get(id)).filter((s): s is Screen => !!s)
  const label = section.title
  const blocks: Block[] = []

  const before = mine.find(s => s.kind === 'before')
  const after = mine.find(s => s.kind === 'after')
  const used = new Set<string>()
  if (before && after) {
    blocks.push({ id: `mcp-cmp-${before.id}`, type: 'compare', sectionLabel: label, beforeUrl: before.url, afterUrl: after.url, caption: after.caption || 'Before and after' })
    used.add(before.id).add(after.id)
  }
  for (const s of mine) {
    if (s.source === 'figma-embed') { blocks.push({ id: `mcp-${s.id}`, type: 'figma', sectionLabel: label, figmaUrl: s.url, caption: s.caption || 'Interactive prototype' }); used.add(s.id) }
    else if (s.source === 'video') { blocks.push({ id: `mcp-${s.id}`, type: 'video', sectionLabel: label, videoUrl: s.url, caption: s.caption }); used.add(s.id) }
  }

  // Remaining images, grouped by kind in first-seen order; runs of 2+ become galleries.
  const groups: Screen[][] = []
  for (const s of mine.filter(x => !used.has(x.id))) {
    const g = groups.find(gr => gr[0].kind === s.kind)
    if (g) g.push(s); else groups.push([s])
  }
  for (const g of groups) {
    if (g.length === 1) {
      blocks.push({ id: `mcp-${g[0].id}`, type: 'image', sectionLabel: label, imageUrl: g[0].url, caption: g[0].caption })
      continue
    }
    for (let i = 0; i < g.length; i += GALLERY_CHUNK) {
      const chunk = g.slice(i, i + GALLERY_CHUNK)
      blocks.push({ id: `mcp-gal-${chunk[0].id}`, type: 'gallery', sectionLabel: label, images: chunk.map(s => ({ url: s.url, caption: s.caption ?? '' })) })
    }
  }
  return blocks
}

export function statBlocks(facts: FactSheet): Block[] {
  return facts.outcomes.filter(o => o.metric && o.source === 'provided').slice(0, 3).map((o, i) => ({
    id: `mcp-stat-${i}`, type: 'stat', sectionLabel: SECTION_DEFS.impact.title, statValue: o.metric!.value, statLabel: o.metric!.label,
  }))
}

export function buildSections(plan: PlannedSection[], narratives: Partial<Record<CaseSectionType, string>>, screens: Screen[], facts: FactSheet, moreText = ''): CaseSection[] {
  return plan.map(p => {
    const blocks = blocksFor(p, screens)
    if (p.type === 'impact') blocks.unshift(...statBlocks(facts))
    return {
      id: sectionId(p.type, p.title),
      type: p.type,
      title: p.title,
      narrative: p.type === 'custom' ? moreText : narratives[p.type] ?? '',
      blocks,
    }
  })
}

export function buildOverview(facts: FactSheet, summary: string): OverviewData {
  const provided = (f: { text: string; source: string } | null) => (f && f.source === 'provided' ? f.text : '')
  return {
    summary,
    role: provided(facts.role),
    timeline: provided(facts.timeline),
    team: provided(facts.team),
    metrics: facts.outcomes.filter(o => o.metric && o.source === 'provided').slice(0, 3).map(o => ({ label: o.metric!.label, value: o.metric!.value })),
  }
}

const COVER_ORDER: ScreenKind[] = ['final', 'hifi', 'after', 'prototype', 'moodboard', 'wireframe']
export function pickCover(screens: Screen[]): string | null {
  for (const k of COVER_ORDER) {
    const s = screens.find(x => x.kind === k && (x.source === 'figma' || x.source === 'image'))
    if (s) return s.url
  }
  return screens.find(s => s.source === 'figma' || s.source === 'image')?.url ?? null
}
