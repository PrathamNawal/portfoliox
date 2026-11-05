import { monthIndex } from './experience'
import { plainText } from './experience-story'
import type { WorkExperience } from '@/types'

// Content for the Work Experience "climb": the roles in the order they happened, and for each one a one-line lead,
// a single number to show off, and the skills it added that earlier roles did not show. Everything is read from the
// role's own title, headline, stat and description, so nothing is invented. No React here.

/** The description as plain bullets (the field holds HTML from the editor or plain lines). */
export function bulletsOf(description: string | null | undefined): string[] {
  if (!description) return []
  const text = description
    .replace(/<\/(li|p|div)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
  const out: string[] = []
  text.split(/\n+/).forEach(line => {
    const t = line.replace(/\s+/g, ' ').trim().replace(/^[-•*–]\s*/, '')
    if (t.length > 3 && out.indexOf(t) < 0) out.push(t)
  })
  return out
}

/** At most n characters, cut at a word and closed with an ellipsis when something was left out. */
export function shorten(text: string, n: number): string {
  const t = text.trim().replace(/[.\s]+$/, '')
  if (t.length <= n) return t
  const cut = t.slice(0, n)
  const at = cut.lastIndexOf(' ')
  return `${(at > n * 0.6 ? cut.slice(0, at) : cut).replace(/[,;:\s]+$/, '')}…`
}

// A number worth showing: it carries a unit (30%, 260K+, 500+, 2x), so years and counts such as "7 months" do not match.
const METRIC = /(\d[\d,]*(?:\.\d+)?\s?(?:%|[KkMm]\+?|\+|x|×))(?![A-Za-z0-9])/

export interface Highlight { value: string; text: string }
export interface Beat {
  lead: string // what she did there, one line
  highlight: Highlight | null // the number and the sentence it comes from
}

/** Lower-case words only, no trailing ellipsis, so a shortened sentence still matches the bullet it came from. */
function same(text: string): string {
  return text.toLowerCase().replace(/[…]|\.{3}/g, '').replace(/[^a-z0-9+%$₹]+/g, ' ').trim()
}

/**
 * The description HTML without the bullets the lead or the number's sentence already shows in full.
 * Only a plain one-level bullet list is touched; anything else comes back as it was.
 */
export function withoutRepeats(html: string | null | undefined, beat: Beat): string {
  const src = html ?? ''
  const outer = src.trim().match(/^<ul\b[^>]*>([\s\S]*)<\/ul>$/i)
  if (!outer || /<ul\b/i.test(outer[1])) return src
  const items = outer[1].match(/<li\b[^>]*>[\s\S]*?<\/li>/gi)
  if (!items || outer[1].replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, '').trim() !== '') return src
  const shown = [beat.lead, beat.highlight?.text ?? ''].map(same).filter(t => t.length >= 12)
  const kept = items.filter(li => { const b = same(plainText(li)); return !shown.some(t => t.includes(b)) })
  return kept.length === items.length || kept.length === 0 ? src : `<ul>${kept.join('')}</ul>`
}

/** The role's number: the stored stat when there is one, else the first bullet that carries a measurable result. */
export function beatOf(r: Pick<WorkExperience, 'headline' | 'stat_value' | 'stat_label' | 'description'>): Beat {
  const bullets = bulletsOf(r.description)
  let highlight: Highlight | null = null
  let used = -1
  if (r.stat_value && r.stat_value.trim()) {
    highlight = { value: r.stat_value.trim(), text: (r.stat_label ?? '').trim() }
    // A caption copied out of a bullet says nothing the bullet below does not: keep the number, drop the repeat.
    const cap = same(highlight.text)
    if (cap.length >= 20 && bullets.some(b => same(b).includes(cap))) highlight = { value: highlight.value, text: '' }
  } else {
    for (let i = 0; i < bullets.length; i++) {
      const m = METRIC.exec(bullets[i])
      if (m) { highlight = { value: m[1].replace(/\s+/g, ''), text: shorten(bullets[i], 120) }; used = i; break }
    }
  }
  let lead = (r.headline ?? '').trim()
  if (!lead) {
    for (let i = 0; i < bullets.length; i++) if (i !== used) { lead = shorten(bullets[i], 150); break }
    // the number's own sentence is the only line: it leads, and the number stands alone beside it
    if (!lead && used >= 0 && highlight) { lead = shorten(bullets[used], 150); highlight = { value: highlight.value, text: '' } }
  }
  return { lead, highlight }
}

// Skills a reader would name, each found in the role's own words. The order is the order they are offered in.
const SKILLS: Array<[string, RegExp]> = [
  ['Graphic design', /graphic|visual asset|digital asset|creative/i],
  ['Brand consistency', /\bbrand/i],
  ['UI design', /\bui\b|interface|visual language/i],
  ['UX research', /research|competitor/i],
  ['Usability testing', /usability|user test/i],
  ['Design systems', /design system/i],
  ['Wireframing', /wireframe|low[ /-]*(?:mid )?fidelity/i],
  ['Prototyping', /prototyp/i],
  ['Onboarding flows', /onboarding/i],
  ['Product design', /product (?:and graphic )?design/i],
  ['End-to-end ownership', /end[- ]to[- ]end|entire design process|complete design lifecycle/i],
  ['Working with founders', /founder|founding team/i],
  ['Client engagements', /\bclients?\b/i],
  ['AI products', /\bai\b|ai-native/i],
  ['Dev handoff', /hand-?off|\buat\b/i],
  ['Cross-functional work', /cross[- ]functional|stakeholder/i],
]
const MAX_NEW = 3

/** Roles oldest first, so the list reads as a path from the first job to the current one. */
export function inOrder<T extends Pick<WorkExperience, 'start_month' | 'end_month' | 'is_current'>>(roles: readonly T[]): T[] {
  const key = (r: T) => [monthIndex(r.start_month) ?? 0, r.is_current || !r.end_month ? 1e9 : (monthIndex(r.end_month) ?? 0)]
  return [...roles].sort((a, b) => { const x = key(a), y = key(b); return x[0] - y[0] || x[1] - y[1] })
}

/**
 * For each role (in the order given), the skills it shows that no earlier role did. A skill is added once, at the
 * first role that mentions it, so reading down the list shows the toolkit growing.
 */
export function skillsAdded(roles: readonly Pick<WorkExperience, 'role' | 'headline' | 'description' | 'discipline_tag'>[]): string[][] {
  const seen: Record<string, true> = {}
  return roles.map(r => {
    const text = `${r.role} ${r.headline ?? ''} ${bulletsOf(r.description).join(' ')}`
    const added: string[] = []
    for (let i = 0; i < SKILLS.length && added.length < MAX_NEW; i++) {
      const [label, re] = SKILLS[i]
      if (!seen[label] && re.test(text)) { seen[label] = true; added.push(label) }
    }
    return added
  })
}

/** Where on the path (0..1) the walker is for page progress p, and which role it is at. */
export function stopAt(p: number, n: number): { x: number; index: number } {
  if (n <= 1) return { x: 0, index: 0 }
  const x = Math.min(1, Math.max(0, p))
  return { x, index: Math.round(x * (n - 1)) }
}
