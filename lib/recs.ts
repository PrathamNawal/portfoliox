import type { Testimonial } from '@/types'

// Reading a recommendation the way a hiring manager does: what is it evidence of, which phrase carries it, and which
// role it belongs to. Everything is derived from the quote and the work experience, so no new data is needed.

const END = /[.!?…"”')]$/

/** A quote cut off mid-word at import ("...an eye for detail t") loses the dangling fragment and gets an ellipsis. */
export function cleanQuote(q: string): string {
  const t = (q ?? '').trim()
  if (!t || END.test(t)) return t
  const m = t.match(/^(.*\S)\s+(\S{1,3})$/)
  return `${(m ? m[1] : t).replace(/[,;:—–-]+$/, '')}…`
}

export interface Signal { id: string; label: string; re: RegExp }

// What a quote is evidence of, most specific first. Labels read as claims about the person.
export const SIGNALS: Signal[] = [
  { id: 'ownership', label: 'End-to-end ownership', re: /end[- ]to[- ]end|\bowned\b|ownership|jointly led|\bled\b|independent(ly)?/i },
  { id: 'needs', label: 'Translates user needs', re: /translating [^.,;]{0,32}needs|user needs|user[- ]cent(re|er)ed|empathy/i },
  { id: 'detail', label: 'Attention to detail', re: /(?:a |an )?(?:keen |strong |great |sharp )?eye for detail|detail[- ]oriented|meticulous|attention to detail|thorough/i },
  { id: 'creative', label: 'Creative thinking', re: /highly creative|creative|creativity|imaginative|innovative/i },
  { id: 'visual', label: 'Visual craft', re: /visually appealing|elegant|polished|aesthetic|beautiful|visual/i },
  { id: 'intuitive', label: 'Clear, intuitive design', re: /intuitive|easy to use|usab/i },
  { id: 'collab', label: 'Collaboration', re: /collaborat\w*|jointly|worked (?:closely )?with|partner(?:ed|ing)?/i },
  { id: 'pleasure', label: 'Great to work with', re: /a pleasure|great to work|easy to work|a joy/i },
  { id: 'reliable', label: 'Reliable delivery', re: /on time|deadline|reliab\w+|dependab\w+|fast\b|quick(ly)?\b/i },
]

export interface SignalCount { id: string; label: string; count: number; first: number }

/** The signals across all recommendations, most-mentioned first (ties keep the order above); at most six. */
export function signalCounts(testimonials: Pick<Testimonial, 'quote'>[]): SignalCount[] {
  const out: SignalCount[] = []
  for (const s of SIGNALS) {
    const hits = testimonials.map((t, i) => (s.re.test(cleanQuote(t.quote)) ? i : -1)).filter(i => i >= 0)
    if (hits.length) out.push({ id: s.id, label: s.label, count: hits.length, first: hits[0] })
  }
  return out.map((s, i) => ({ s, i })).sort((a, b) => b.s.count - a.s.count || a.i - b.i).slice(0, 6).map(x => x.s)
}

const BOUND = /[.,;:!?—–]/

/** The clause around a match: out to the nearest punctuation, or ~34 characters, widened or trimmed to whole words. */
function clauseAround(text: string, from: number, to: number): [number, number] {
  let a = from, b = to
  let aStop = false, bStop = false
  for (let i = from - 1; i >= Math.max(0, from - 34); i--) { if (BOUND.test(text[i])) { aStop = true; break } a = i }
  for (let i = to; i < Math.min(text.length, to + 34); i++) { if (BOUND.test(text[i])) { bStop = true; break } b = i + 1 }
  if (!aStop && a > 0) while (a < from && /\S/.test(text[a - 1])) a++ // cut mid-word: move to the next word start
  if (!bStop && b < text.length) while (b > to && /\S/.test(text[b])) b-- // cut mid-word: back to the previous word end
  while (a < b && /\s/.test(text[a])) a++
  while (b > a && /[\s,;:.]/.test(text[b - 1])) b--
  return [a, Math.max(b, to)]
}

/** Up to two spans of the quote that carry its evidence; `prefer` (a signal id) is shown first when it matches. */
export function highlightsOf(quote: string, prefer?: string | null): [number, number][] {
  const text = cleanQuote(quote)
  const spans: { span: [number, number]; pri: number }[] = []
  SIGNALS.forEach((s, idx) => {
    const m = s.re.exec(text)
    if (m) spans.push({ span: clauseAround(text, m.index, m.index + m[0].length), pri: s.id === prefer ? -1 : idx })
  })
  spans.sort((x, y) => x.pri - y.pri)
  const chosen: [number, number][] = []
  for (const { span } of spans) {
    if (chosen.length === 2) break
    if (chosen.every(c => span[1] <= c[0] || span[0] >= c[1])) chosen.push(span)
  }
  return chosen.sort((a, b) => a[0] - b[0])
}

/** The cleaned quote cut into plain and highlighted parts. */
export function segments(quote: string, prefer?: string | null): { text: string; hl: boolean }[] {
  const text = cleanQuote(quote)
  const out: { text: string; hl: boolean }[] = []
  let at = 0
  for (const [a, b] of highlightsOf(quote, prefer)) {
    if (a > at) out.push({ text: text.slice(at, a), hl: false })
    out.push({ text: text.slice(a, b), hl: true })
    at = b
  }
  if (at < text.length) out.push({ text: text.slice(at), hl: false })
  return out
}

interface RoleLike { id: string; company: string; start_month: string; is_current: boolean }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

/** The work experience a recommendation belongs to: the company named in the recommender's title or the quote (latest role wins). */
export function matchRole<T extends RoleLike>(t: Pick<Testimonial, 'title_and_company' | 'quote'>, roles: readonly T[]): T | null {
  const hay = ` ${norm(t.title_and_company)} `
  const body = ` ${norm(t.quote)} `
  const hit = roles.filter(r => {
    const c = norm(r.company)
    return c.length >= 3 && (hay.includes(` ${c} `) || body.includes(` ${c} `) || (c.split(' ')[0].length >= 5 && hay.includes(` ${c.split(' ')[0]} `)))
  })
  return hit.length ? hit.reduce((a, b) => (b.is_current || (!a.is_current && b.start_month > a.start_month) ? b : a)) : null
}

/**
 * The part of a quote worth showing next to a role: the sentence that holds its strongest claim (highlighted),
 * cut to about `max` characters around that claim if it is long.
 */
export function excerptOf(quote: string, max = 200): { text: string; hl: boolean }[] {
  const text = cleanQuote(quote)
  const spans = highlightsOf(quote)
  const ends = Array.from(text.matchAll(/[.!?](?=\s|$)/g)).map(m => (m.index ?? 0) + 1)
  const anchor = spans[0]?.[0] ?? 0
  let a = 0, b = text.length
  for (const e of ends) { if (e <= anchor) a = e; else { b = e; break } }
  while (a < b && /\s/.test(text[a])) a++
  if (b - a > max) {
    const from = Math.max(a, (spans[0]?.[0] ?? a) - 40)
    a = from > a ? text.indexOf(' ', from) + 1 || from : a
    b = Math.min(b, a + max)
    const cut = text.lastIndexOf(' ', b)
    if (cut > a + max / 2) b = cut
  }
  const sliceSpans = spans.map(([x, y]) => [Math.max(x, a), Math.min(y, b)] as [number, number]).filter(([x, y]) => y > x)
  const out: { text: string; hl: boolean }[] = []
  let at = a
  if (a > 0) out.push({ text: '…', hl: false })
  for (const [x, y] of sliceSpans) {
    if (x > at) out.push({ text: text.slice(at, x), hl: false })
    out.push({ text: text.slice(x, y), hl: true })
    at = y
  }
  if (at < b) out.push({ text: text.slice(at, b), hl: false })
  if (b < text.length && !/[.!?]$/.test(text.slice(a, b))) out.push({ text: '…', hl: false })
  return out
}

/** Recommendations grouped by the role they belong to. */
export function proofsByRole<T extends RoleLike>(testimonials: readonly Testimonial[], roles: readonly T[]): Map<string, Testimonial[]> {
  const m = new Map<string, Testimonial[]>()
  for (const t of testimonials) {
    const r = matchRole(t, roles)
    if (r) m.set(r.id, [...(m.get(r.id) ?? []), t])
  }
  return m
}
