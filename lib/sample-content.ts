import { DISCIPLINE_SAMPLES } from './case-study-samples'
import type { Block, CaseSection, CaseStudy, OverviewData } from '@/types'

// A new case study can be pre-filled with sample content (Zomato checkout, Mamaearth brand refresh, ...) so the
// editor has something to react to. When the owner replaces some of it and leaves the rest, that leftover text,
// captions, metrics and placeholder images end up on the published page, telling the story of a different project.
// scrubSampleContent removes it at render time: nothing sample-derived is shown, and nothing else is touched.
// Matching is by text, tolerant of small edits (shared 4-word runs), so no data change or migration is needed.

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9%.+\s-]/g, ' ').replace(/\s+/g, ' ').trim()
const shingles = (t: string, n = 4): Set<string> => {
  const w = t.split(' ')
  const out = new Set<string>()
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '))
  return out
}

interface Entry { text: string; sh: Set<string> }
let corpus: { exact: Set<string>; entries: Entry[] } | null = null
const SAMPLE_BLOCK_URL = /^\/samples\//
const PLACEHOLDER_COVER = /^https:\/\/placehold\.co\//

function build() {
  const exact = new Set<string>()
  const entries: Entry[] = []
  const add = (raw: string | undefined) => {
    const t = norm(raw ?? '')
    if (t.length < 25 || exact.has(t)) return
    exact.add(t)
    entries.push({ text: t, sh: shingles(t) })
  }
  for (const sample of Object.values(DISCIPLINE_SAMPLES)) {
    add(sample.overviewData.summary)
    for (const sec of sample.sections) {
      for (const para of sec.narrative?.split(/\n\s*\n/) ?? []) {
        add(para)
        for (const line of para.split('\n')) add(line)
      }
      for (const b of sec.blocks ?? []) add(b.caption)
    }
  }
  corpus = { exact, entries }
}

/** True when the text is sample content: an exact match, or sharing most of its 4-word runs with a sample paragraph, line or caption. */
export function isSampleText(text: string | undefined | null): boolean {
  if (!text) return false
  const t = norm(text)
  if (t.length < 25) return false
  if (!corpus) build()
  if (corpus!.exact.has(t)) return true
  const sh = shingles(t)
  if (sh.size < 4) return false
  for (const e of corpus!.entries) {
    if (e.sh.size < 4) continue
    let hit = 0
    sh.forEach(x => { if (e.sh.has(x)) hit++ })
    if (hit / Math.min(sh.size, e.sh.size) >= 0.7) return true
  }
  return false
}

const isSampleMetric = (m: { label: string; value: string }) =>
  Object.values(DISCIPLINE_SAMPLES).some(s => s.overviewData.metrics.some(x => x.label && x.label === m.label && (x.value === m.value || !m.value)))

/** A narrative without its sample paragraphs and lines (blank-line structure and ordinary lines are kept). */
export function scrubNarrative(narrative: string): string {
  const paras = (narrative ?? '').split(/\n\s*\n/).map(p => {
    if (isSampleText(p)) return ''
    return p.split('\n').filter(l => !isSampleText(l)).join('\n')
  }).filter(p => p.trim())
  return paras.join('\n\n')
}

function scrubBlock(b: Block): Block | null {
  if (b.type === 'image' && b.imageUrl && SAMPLE_BLOCK_URL.test(b.imageUrl)) return null
  if (b.type === 'compare' && (SAMPLE_BLOCK_URL.test(b.beforeUrl ?? '') || SAMPLE_BLOCK_URL.test(b.afterUrl ?? ''))) return null
  if (b.type === 'gallery') {
    const images = (b.images ?? []).filter(i => !SAMPLE_BLOCK_URL.test(i.url)).map(i => ({ ...i, caption: isSampleText(i.caption) ? '' : i.caption }))
    return images.length ? { ...b, images } : null
  }
  return b.caption && isSampleText(b.caption) ? { ...b, caption: '' } : b
}

function scrubSection(s: CaseSection): CaseSection {
  return { ...s, narrative: scrubNarrative(s.narrative), blocks: (s.blocks ?? []).map(scrubBlock).filter((b): b is Block => !!b) }
}

function scrubOverview(o: OverviewData | null): OverviewData | null {
  if (!o) return o
  return { ...o, summary: isSampleText(o.summary) ? '' : o.summary, metrics: (o.metrics ?? []).filter(m => !isSampleMetric(m)) }
}

/** The case study as it should be published: no sample text, captions, metrics, placeholder images or placeholder cover. */
export function scrubSampleContent<T extends Pick<CaseStudy, 'sections' | 'overview_data' | 'cover_image_url'> & { blocks?: Block[] }>(cs: T): T {
  return {
    ...cs,
    // a section still flagged isSample was never edited: it is the template's text about another project
    sections: cs.sections ? cs.sections.filter(s => !(s.isSample && s.type !== 'overview')).map(scrubSection) : cs.sections,
    blocks: cs.blocks ? cs.blocks.map(scrubBlock).filter((b): b is Block => !!b) : cs.blocks,
    overview_data: scrubOverview(cs.overview_data),
    cover_image_url: cs.cover_image_url && PLACEHOLDER_COVER.test(cs.cover_image_url) ? null : cs.cover_image_url,
  }
}
