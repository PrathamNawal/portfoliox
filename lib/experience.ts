// Work experience ordering. One rule, used everywhere experience is shown or returned:
// latest first, oldest last. Never depends on display_order or the order rows were added.
//
//   1. Current roles first (they end "now"), newest start first
//   2. Then by end date, latest first (a role with no end date ends where it started)
//   3. Ties: later start first, then newest created, then id (so the order is deterministic)
//   4. Rows with an unreadable date go last
//
// Dates are the "Mon YYYY" strings the editor stores, e.g. "Jan 2025".

import type { WorkExperience } from '@/types'

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }

/** "Jan 2025" -> a sortable month index (year * 12 + month), or null if unreadable. */
export function monthIndex(value: string | null | undefined): number | null {
  if (!value) return null
  const [mon, year] = value.trim().split(/\s+/)
  const m = MONTHS[(mon || '').slice(0, 3).toLowerCase()]
  const y = parseInt(year, 10)
  if (m === undefined || !Number.isFinite(y)) return null
  return y * 12 + m
}

/** "Jan 2025" -> Date (first of the month). Unreadable input gives Invalid Date. */
export function parseMonthYear(value: string): Date {
  const idx = monthIndex(value)
  return idx === null ? new Date(NaN) : new Date(Math.floor(idx / 12), idx % 12, 1)
}

const FAR_FUTURE = Number.MAX_SAFE_INTEGER

function endIndex(e: Pick<WorkExperience, 'is_current' | 'start_month' | 'end_month'>): number {
  if (e.is_current) return FAR_FUTURE
  return monthIndex(e.end_month) ?? monthIndex(e.start_month) ?? -1
}

type Sortable = Pick<WorkExperience, 'id' | 'is_current' | 'start_month' | 'end_month'> & { created_at?: string }

function compare(a: Sortable, b: Sortable): number {
  const byEnd = endIndex(b) - endIndex(a)
  if (byEnd !== 0) return byEnd
  const byStart = (monthIndex(b.start_month) ?? -1) - (monthIndex(a.start_month) ?? -1)
  if (byStart !== 0) return byStart
  const byCreated = String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''))
  if (byCreated !== 0) return byCreated
  return String(a.id).localeCompare(String(b.id))
}

/** New array, latest to oldest. Safe to call on already sorted or partial data. */
export function sortExperience<T extends Sortable>(items: readonly T[] | null | undefined): T[] {
  return [...(items ?? [])].sort(compare)
}

// ── Display helpers (readability of the experience section) ──────────────────

type Span = Pick<WorkExperience, 'is_current' | 'start_month' | 'end_month'>

/** Whole months a role lasted; current roles run to `now`. Unreadable start = 0. */
export function durationMonths(e: Span, now: Date = new Date()): number {
  const start = monthIndex(e.start_month)
  if (start === null) return 0
  const end = e.is_current || !e.end_month ? now.getFullYear() * 12 + now.getMonth() : (monthIndex(e.end_month) ?? start)
  return Math.max(0, end - start)
}

/** 7 -> "7 mo", 12 -> "1 yr", 19 -> "1 yr 7 mo". Never shows "0 mo". */
export function formatDuration(months: number): string {
  const total = Math.max(1, months)
  const y = Math.floor(total / 12), m = total % 12
  if (y === 0) return `${m} mo`
  if (m === 0) return `${y} yr${y !== 1 ? 's' : ''}`
  return `${y} yr${y !== 1 ? 's' : ''} ${m} mo`
}

/** "Jul 2025 – Mar 2026" or "Jan 2025 – Present". */
export function formatRange(e: Span): string {
  return `${e.start_month} – ${e.is_current ? 'Present' : e.end_month || e.start_month}`
}

const UNIT = String.raw`(?:days?|weeks?|hours?|hrs?|minutes?|mins?)`
const METRIC = new RegExp(
  [
    String.raw`[₹$€£]\s?\d[\d,]*(?:\.\d+)?\s?(?:[KMB]|lakh|crore|Cr|L)?\+?`, // ₹5L, $2.5M
    String.raw`\d+(?:\.\d+)?\s?%`, // 30%
    String.raw`\d+\s+${UNIT}\s+to\s+\d+\s+${UNIT}`, // 7 days to 2 days
    String.raw`\d+(?:[.,]\d+)?\s?[KMB]\+?(?![A-Za-z0-9])`, // 260K+, 1.2M
    String.raw`\d+(?:\.\d+)?x(?![A-Za-z0-9])`, // 3x
    String.raw`\d[\d,]*\+`, // 750+, 8+
  ].join('|'),
  'gi',
)

/**
 * Wraps numbers that read as impact (30%, 260K+, 7 days to 2 days, ₹5L, 3x) in <mark class="pxp-metric">.
 * Only text is touched: tags, attributes and HTML entities are left exactly as they were.
 */
export function highlightMetrics(html: string): string {
  return html
    .split(/(<[^>]*>)/)
    .map((part, i) => {
      if (i % 2 === 1) return part // a tag
      return part
        .split(/(&#?\w+;)/)
        .map((seg, j) => (j % 2 === 1 ? seg : seg.replace(METRIC, match => `<mark class="pxp-metric">${match}</mark>`)))
        .join('')
    })
    .join('')
}

/**
 * For a description that is one plain bullet list, split it after `limit` bullets so the rest can
 * sit inside a <details>. Anything else (text, nested lists, no list) returns null: render as is.
 */
export function splitBullets(html: string, limit = 3): { head: string; rest: string; restCount: number } | null {
  const outer = html.trim().match(/^<ul\b[^>]*>([\s\S]*)<\/ul>$/i)
  if (!outer || /<ul\b/i.test(outer[1])) return null
  const items = outer[1].match(/<li\b[^>]*>[\s\S]*?<\/li>/gi)
  if (!items || outer[1].replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, '').trim() !== '') return null
  if (items.length <= limit) return null
  return { head: `<ul>${items.slice(0, limit).join('')}</ul>`, rest: `<ul>${items.slice(limit).join('')}</ul>`, restCount: items.length - limit }
}
