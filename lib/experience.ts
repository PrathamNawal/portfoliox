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
