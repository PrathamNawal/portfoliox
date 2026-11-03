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

// Step headings ("01 — ...") and labels ("Key findings:") are structure, not sentences, so the skim text skips them.
const prose = (s: string) => s.split('\n').filter(l => !asStep(l) && !asLabel(l)).join('\n')
const plain = (s: string) => prose(s).replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/^[-*•]\s+|^\d+\.\s+/gm, '').replace(/\s+/g, ' ').trim()

/** First sentence or two of a section's narrative, for the skim cards (about 190 characters at most). */
export function lead(narrative: string, max = 190): string {
  const t = plain(narrative)
  const sentences = t.match(/[^.!?]+[.!?]+(\s|$)/g)
  if (!sentences) return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
  let out = ''
  for (const s of sentences) { if ((out + s).length > max && out) break; out += s }
  return out.trim().length > max ? `${out.trim().slice(0, max - 1).trimEnd()}…` : out.trim()
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
    const ok = (x: CaseSection) => !!lead(x.narrative) && !out.some(o => o.id === x.id)
    // the first listed type wins (a Solution over a Process), then any section whose title says so
    const s = q.type.map(t => sections.find(x => x.type === t && ok(x))).find(Boolean) ?? sections.find(x => q.title.test(x.title) && ok(x))
    if (s) out.push({ label: q.label, text: lead(s.narrative), id: s.id })
  }
  return out.length >= 2 ? out : []
}
