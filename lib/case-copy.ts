import type { CaseSection } from '@/types'

// Reading aids built from the case study's own text, so owners write nothing extra. Everything here is
// conservative: a line only becomes a step heading, label or stat when it matches the pattern exactly,
// and anything else stays an ordinary paragraph.

/** "01 — Establishing a recognisable brand presence" on its own line: a numbered step. */
export function asStep(line: string): { n: string; title: string } | null {
  const m = line.trim().match(/^(\d{1,2})\s*[—–-]\s*(\S.{0,88})$/)
  return m && !/[.!?]$/.test(m[2]) ? { n: m[1].padStart(2, '0'), title: m[2] } : null
}

/** "Key findings:" on its own line: a short label for what follows. */
export function asLabel(line: string): string | null {
  const t = line.trim()
  const m = t.match(/^(\S.{0,38}):$/)
  return m && m[1].split(/\s+/).length <= 4 ? m[1] : null
}

/** A list item that starts with a figure ("64% of test participants...") becomes a stat row. */
export function asStat(item: string): { value: string; text: string } | null {
  const m = item.trim().match(/^(\d[\d.,]*\s?(?:%|×|x\b|K\b|M\b))\s*(\S.*)$/)
  return m ? { value: m[1].replace(/\s+/g, ''), text: m[2] } : null
}

// Step headings ("01 — ...") and labels ("Key findings:") are structure, not sentences, so text extraction skips them.
const strip = (s: string) => s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/\s+/g, ' ').trim()
const BULLET = /^\s*(?:[-*•]|\d+\.)\s+/

/** The narrative's running paragraphs: no steps, labels or lists, and nothing that is only a short fragment. */
export function paragraphs(narrative: string): string[] {
  return (narrative ?? '').split(/\n\s*\n/).map(blk => blk.split('\n').map(l => l.trim()).filter(Boolean))
    .filter(lines => lines.length && !lines.some(l => asStep(l) || asLabel(l) || BULLET.test(l)))
    .map(lines => strip(lines.join(' ')))
    .filter(t => t.length >= 50 && /[.!?]/.test(t))
}

const sentencesOf = (t: string) => t.match(/[^.!?]+[.!?]+(?=\s|$)/g)?.map(x => x.trim()) ?? [t]

/** First sentence or two of a section's first running paragraph, for the skim cards (about 190 characters at most); '' if it has none. */
export function lead(narrative: string, max = 190): string {
  const first = paragraphs(narrative)[0] // a section with no running prose has no lead
  if (!first) return ''
  let out = ''
  for (const s of sentencesOf(first)) { if ((out + ' ' + s).length > max && out) break; out = out ? `${out} ${s}` : s }
  return out.length > max ? `${out.slice(0, max - 1).trimEnd()}…` : out
}

// ── Chapter stages ───────────────────────────────────────────────────────────
// Each chapter is given a layout and, at most, one band from its own content, so owners choose nothing:
//   split   text stays sticky beside the images (a short chapter with at least one image)
//   visual  no text, only images: wider frames
//   stack   text, then visuals (everything else)
//   band    stats (a list with figures) > finale (the outcome chapter) > quote (a sentence stating a decision or insight)

export interface Band { kind: 'stats' | 'quote' | 'finale'; label: string; text?: string; stats?: { value: string; text: string }[] }
export interface Stage { layout: 'split' | 'visual' | 'stack'; band: Band | null }

const DECISION = /\b(decision|decided|insight|finding|findings|learned|key (?:design )?consideration|goal was|aim was|strategic|realised|realized|turned out)\b/i
const LABEL_OF: [RegExp, string][] = [[/decision|decided|strategic/i, 'The decision'], [/insight|finding|learned|realis|turned out/i, 'The insight'], [/goal|aim/i, 'The aim'], [/consideration/i, 'The key call']]

/** A sentence from a later paragraph that states a decision or insight (not the lead, which is already large). */
export function decisionOf(narrative: string): { text: string; label: string } | null {
  const ps = paragraphs(narrative)
  for (const p of ps.length > 1 ? ps.slice(1) : ps) {
    for (const sent of sentencesOf(p)) {
      if (sent.length >= 50 && sent.length <= 230 && DECISION.test(sent) && !HEDGE.test(sent)) return { text: sent, label: (LABEL_OF.find(([re]) => re.test(sent)) ?? [0, 'Takeaway'])[1] }
    }
  }
  return null
}

// An outcome is a sentence that reports something that happened (a figure, a launch, an adoption). Hedges and
// next steps are not outcomes, and are never promoted to a headline.
const SIGNAL = /\d[\d,.]*\s?(?:%|\u00d7|x\b|[kKmM]\+?\b|\+)|\b(?:launched|shipped|adopted|onboarded|increased|reduced|grew|doubled|won|saved|improved|achieved|featured|reached)\b/
const HEDGE = /\b(?:rather than|attributable|not an outcome|still early|early in|natural next step|next step|would be to|will need to|context for|might|could have)\b/i

/** A sentence reporting a real outcome, from a paragraph after the lead (the lead is already printed large). */
export function outcomeOf(narrative: string): string | null {
  const ps = paragraphs(narrative)
  for (const p of ps.length > 1 ? ps.slice(1) : ps) {
    for (const raw of sentencesOf(p)) {
      const sent = raw.replace(/^[A-Z][^:.!?]{1,38}:\s+/, '') // drop a "Label: " lead-in
      if (sent.length >= 40 && sent.length <= 230 && SIGNAL.test(sent) && !HEDGE.test(sent)) return sent
    }
  }
  return null
}

/** Up to three list items that start with a figure, as big numbers. */
export function statsOf(narrative: string): { value: string; text: string }[] {
  const out: { value: string; text: string }[] = []
  for (const line of (narrative ?? '').split('\n')) {
    if (!BULLET.test(line)) continue
    const st = asStat(strip(line.replace(BULLET, '')))
    if (st) out.push(st)
  }
  return out.slice(0, 3)
}


export function stageOf(section: CaseSection): Stage {
  const text = (section.narrative ?? '').trim()
  const imageCount = (section.blocks ?? []).reduce((n, b) => n + (b.type === 'image' ? (b.imageUrl ? 1 : 0) : b.type === 'gallery' ? (b.images ?? []).filter(i => i.url).length : b.type === 'compare' ? 2 : 0), 0)
  // beside-the-text only fits a couple of images; a chapter with more gets the full column
  const layout: Stage['layout'] = !text ? 'visual' : imageCount > 0 && imageCount <= 2 && text.length <= 1800 ? 'split' : 'stack'
  let band: Band | null = null
  if (text.length >= 200) {
    const stats = statsOf(text)
    const d = decisionOf(text)
    if (stats.length) band = { kind: 'stats', label: 'By the numbers', stats }
    else if (section.type === 'impact' || /impact|outcome|result/i.test(section.title ?? '')) {
      // only when the chapter reports something that happened; otherwise no band at all
      const o = outcomeOf(text)
      band = o ? { kind: 'finale', label: 'The outcome', text: o } : null
    } else if (d) band = { kind: 'quote', label: d.label, text: d.text }
    if (band && band.kind !== 'stats' && !band.text) band = null
  }
  return { layout, band }
}

export interface Skim { label: string; text: string; id: string }

// Which section answers which skim question, by type first and then by words in the title.
const SKIM: { label: string; type: CaseSection['type'][]; title: RegExp }[] = [
  { label: 'The problem', type: ['challenge'], title: /problem|challenge/i },
  { label: 'The approach', type: ['solution', 'process'], title: /solution|approach|process|what i did/i },
  { label: 'The outcome', type: ['impact'], title: /impact|outcome|result|reflection/i },
]

/** Problem / approach / outcome pulled from the sections that carry them; needs at least two to be worth showing. */
export function skimOf(sections: CaseSection[]): Skim[] {
  const out: Skim[] = []
  for (const q of SKIM) {
    // a section whose lead is already on another card (the same text pasted into two sections) is skipped
    const ok = (x: CaseSection) => { const t = lead(x.narrative); return !!t && !out.some(o => o.id === x.id || o.text === t) }
    // the first listed type wins (a Solution over a Process), then any section whose title says so
    const s = q.type.map(t => sections.find(x => x.type === t && ok(x))).find(Boolean) ?? sections.find(x => q.title.test(x.title) && ok(x))
    if (s) out.push({ label: q.label, text: lead(s.narrative), id: s.id })
  }
  return out.length >= 2 ? out : []
}
