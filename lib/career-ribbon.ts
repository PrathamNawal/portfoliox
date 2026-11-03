import { durationMonths, formatDuration, formatRange, monthIndex } from './experience'
import type { WorkExperience } from '@/types'

// Layout for the career ribbon: every role as a bar whose width is its duration, on one time axis. Long empty stretches
// are compressed to a break (a 26-month gap would otherwise be 40% of the ribbon), parallel roles get their own lane,
// and the discipline of each role (graphic, UX, product) gives the growth arc a colour and a one-line headline.

export type Discipline = 'brand' | 'ux' | 'product'
export const DISCIPLINE_LABEL: Record<Discipline, string> = { brand: 'graphic design', ux: 'UX design', product: 'product design' }
export const DISCIPLINE_SHORT: Record<Discipline, string> = { brand: 'Graphic', ux: 'UX', product: 'Product' }

const GAP_KEEP = 6 // a gap up to this many months is drawn to scale; a longer one is drawn as GAP_DRAWN months with a break
const GAP_DRAWN = 3

/** The discipline of a role, from its title first (it is the more specific), then the tag. */
export function disciplineOf(r: Pick<WorkExperience, 'role' | 'discipline_tag'>): Discipline {
  const text = r.role.toLowerCase()
  if (/product/.test(text)) return 'product'
  if (/graphic|brand|visual|illustrat|motion/.test(text)) return 'brand'
  if (/\bux\b|\bui\b|interaction|research/.test(text)) return 'ux'
  const tag = (r.discipline_tag ?? '').toLowerCase()
  if (/product/.test(tag)) return 'product'
  if (/brand|graphic/.test(tag)) return 'brand'
  return 'ux'
}

export interface RibbonBar {
  id: string
  company: string
  role: string
  discipline: Discipline
  left: number // percent
  width: number // percent
  lane: number
  current: boolean
  range: string
  duration: string
  stat: string | null
}
export interface Ribbon {
  bars: RibbonBar[]
  ticks: { year: number; left: number }[]
  breaks: number[] // percent positions of compressed gaps
  lanes: number
  headline: string
  experience: string // "3 yrs 4 mo"
  totalMonths: number
}

export function layoutRibbon(roles: readonly WorkExperience[], now: Date = new Date()): Ribbon {
  const nowIdx = now.getFullYear() * 12 + now.getMonth()
  const items = roles.map(r => {
    const start = monthIndex(r.start_month)
    if (start === null) return null
    const end = r.is_current || !r.end_month ? nowIdx : (monthIndex(r.end_month) ?? start)
    return { r, start, end: Math.max(end, start + 1) }
  }).filter((x): x is { r: WorkExperience; start: number; end: number } => !!x).sort((a, b) => a.start - b.start || a.end - b.end)
  if (!items.length) return { bars: [], ticks: [], breaks: [], lanes: 0, headline: '', experience: '', totalMonths: 0 }

  // coverage = the union of the roles; the axis is the coverage with long gaps shortened
  const cover: { a: number; b: number; x0: number }[] = []
  let cursor = 0
  const breaksAt: number[] = []
  for (const it of items) {
    const last = cover[cover.length - 1]
    if (last && it.start <= last.b) { last.b = Math.max(last.b, it.end); continue }
    if (last) {
      cursor = last.x0 + (last.b - last.a)
      const gap = it.start - last.b
      if (gap > GAP_KEEP) { breaksAt.push(cursor + GAP_DRAWN / 2); cursor += GAP_DRAWN } else cursor += gap
    }
    cover.push({ a: it.start, b: it.end, x0: cursor })
  }
  const lastSeg = cover[cover.length - 1]
  const total = lastSeg.x0 + (lastSeg.b - lastSeg.a)
  const pos = (m: number) => {
    const seg = cover.find(c => m >= c.a && m <= c.b)
    return seg ? seg.x0 + (m - seg.a) : null
  }
  const pct = (x: number) => (x / total) * 100

  const laneEnd: number[] = []
  const bars: RibbonBar[] = items.map(it => {
    let lane = laneEnd.findIndex(e => e <= it.start)
    if (lane < 0) { lane = laneEnd.length; laneEnd.push(0) }
    laneEnd[lane] = it.end
    const a = pos(it.start) ?? 0, b = pos(it.end) ?? a
    return {
      id: it.r.id, company: it.r.company, role: it.r.role, discipline: disciplineOf(it.r),
      left: pct(a), width: Math.max(pct(b - a), 0.5), lane, current: !!it.r.is_current,
      range: formatRange(it.r), duration: formatDuration(durationMonths(it.r, now)),
      stat: it.r.stat_value ? `${it.r.stat_value}${it.r.stat_label ? ` ${it.r.stat_label}` : ''}` : null,
    }
  })

  const ticks: { year: number; left: number }[] = []
  const firstYear = Math.floor(items[0].start / 12), lastYear = Math.floor(lastSeg.b / 12)
  let prev = -100
  for (let y = firstYear; y <= lastYear; y++) {
    const p = pos(y * 12)
    if (p === null) continue
    const left = pct(p)
    if (left - prev < 7) continue
    ticks.push({ year: y, left })
    prev = left
  }

  // the career starts somewhere: label that year even when no January falls inside the first stretch
  if (!ticks.length || ticks[0].left > 10) ticks.unshift({ year: firstYear, left: 0 })

  const totalMonths = cover.reduce((n, c) => n + (c.b - c.a), 0)
  const order: Discipline[] = []
  for (const b of [...bars].sort((p, q) => p.left - q.left)) if (!order.includes(b.discipline)) order.push(b.discipline)
  const first = order[0], last = order[order.length - 1]
  const experience = formatDuration(totalMonths)
  const headline = order.length > 1 ? `From ${DISCIPLINE_LABEL[first]} to ${DISCIPLINE_LABEL[last]}` : DISCIPLINE_LABEL[first].replace(/^./, c => c.toUpperCase())
  return { bars, ticks, breaks: breaksAt.map(pct), lanes: laneEnd.length, headline, experience, totalMonths }
}
