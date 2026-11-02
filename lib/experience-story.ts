// Pure helpers for the "story" Work Experience layout (no React).
// Used by the API routes (validation), the published page and the editor.

import type { ExperienceScreen, WorkExperience } from '@/types'
import { monthIndex } from '@/lib/experience'

export const MAX_SCREENS = 12
export const MAX_HEADLINE = 140
export const MAX_STAT_VALUE = 12
export const MAX_STAT_LABEL = 40
export const MAX_CAPTION = 90
const MAX_DIM = 10000

/** Only images in our own public storage are accepted when NEXT_PUBLIC_SUPABASE_URL is set. */
export function storagePrefix(): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return base ? `${base.replace(/\/+$/, '')}/storage/v1/object/public/` : null
}

/** Validates the screens array. Returns the cleaned list, or null if anything is invalid. */
export function cleanScreens(input: unknown, prefix: string | null = storagePrefix()): ExperienceScreen[] | null {
  if (input == null) return []
  if (!Array.isArray(input) || input.length > MAX_SCREENS) return null
  const out: ExperienceScreen[] = []
  for (const item of input) {
    if (!item || typeof item !== 'object') return null
    const { url, w, h, caption } = item as Record<string, unknown>
    if (typeof url !== 'string' || !url.startsWith('https://')) return null
    if (prefix && !url.startsWith(prefix)) return null
    const okDim = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= MAX_DIM
    if (!okDim(w) || !okDim(h)) return null
    if (caption != null && typeof caption !== 'string') return null
    const cap = typeof caption === 'string' ? caption.trim().slice(0, MAX_CAPTION) : ''
    out.push(cap ? { url, w, h, caption: cap } : { url, w, h })
  }
  return out
}

const STORY_KEYS = ['headline', 'stat_value', 'stat_label', 'screens'] as const

/** Reads the story fields from a request body. Only keys present in the body are returned. */
export function pickStoryFields(body: Record<string, unknown>): { update: Record<string, unknown> } | { error: string } {
  const update: Record<string, unknown> = {}
  const text = (key: 'headline' | 'stat_value' | 'stat_label', max: number, label: string): string | null => {
    const v = body[key]
    if (v == null) return null
    if (typeof v !== 'string') throw new Error(`${label} must be text`)
    const t = v.trim()
    if (t.length > max) throw new Error(`${label} is too long (max ${max} characters)`)
    return t || null
  }
  try {
    for (const key of STORY_KEYS) {
      if (!(key in body)) continue
      if (key === 'headline') update.headline = text('headline', MAX_HEADLINE, 'Headline')
      else if (key === 'stat_value') update.stat_value = text('stat_value', MAX_STAT_VALUE, 'Stat value')
      else if (key === 'stat_label') update.stat_label = text('stat_label', MAX_STAT_LABEL, 'Stat label')
      else {
        const screens = cleanScreens(body.screens)
        if (!screens) return { error: `Screens must be up to ${MAX_SCREENS} images from your portfolio uploads` }
        update.screens = screens
      }
    }
  } catch (e) {
    return { error: (e as Error).message }
  }
  return { update }
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" }

/** HTML to plain text: tags dropped, common entities decoded, whitespace collapsed. */
export function plainText(html: string | null | undefined): string {
  return (html ?? '')
    .replace(/<\/(li|p|div|br)\s*>|<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#?\w+);/g, (m, e: string) => ENTITIES[e] ?? m)
    .replace(/\s+/g, ' ')
    .trim()
}

/** Cuts at a word boundary, adds an ellipsis when it cut. */
function cut(text: string, max: number): string {
  if (text.length <= max) return text
  const head = text.slice(0, max - 1)
  const space = head.lastIndexOf(' ')
  return `${(space > max * 0.5 ? head.slice(0, space) : head).replace(/[\s,;:.\-–]+$/, '')}…`
}

/** The big line of a chapter: the owner's headline, else the first bullet (or the text), cut to 140. */
export function storyHeadline(exp: Pick<WorkExperience, 'headline' | 'description'>): string {
  const own = (exp.headline ?? '').trim()
  if (own) return own
  const desc = exp.description ?? ''
  const li = desc.match(/<li\b[^>]*>([\s\S]*?)<\/li>/i)
  return cut(plainText(li ? li[1] : desc), MAX_HEADLINE)
}

/** Stable 0..359 hue from a company name, for the initial tile tint. */
export function hueOf(company: string): number {
  let h = 0
  for (const ch of company.trim().toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}

/** 2025 from "Jul 2025", or null if unreadable. */
export function startYear(start: string | null | undefined): number | null {
  const idx = monthIndex(start)
  return idx === null ? null : Math.floor(idx / 12)
}

/** Width / height, clamped so one extreme image cannot wreck a row. */
export function screenRatio(s: Pick<ExperienceScreen, 'w' | 'h'>): number {
  const r = s.w / s.h
  return Math.min(2.4, Math.max(0.4, Number.isFinite(r) ? r : 1))
}

/** Tall images get a phone bezel. */
export function isPortrait(s: Pick<ExperienceScreen, 'w' | 'h'>): boolean {
  return s.h > s.w * 1.2
}

/** How many screens one chapter shows before the "+N" tile. */
export function visibleScreens(featured: boolean): number {
  return featured ? 5 : 4
}

export interface ArcStop { company: string; id: string; current: boolean }

/** Companies oldest to newest; each points at that company's newest role. Input: roles latest first. */
export function careerArc(latestFirst: readonly Pick<WorkExperience, 'id' | 'company' | 'is_current'>[]): ArcStop[] {
  const seen = new Map<string, ArcStop>()
  for (const r of latestFirst) {
    if (!seen.has(r.company)) seen.set(r.company, { company: r.company, id: r.id, current: !!r.is_current })
  }
  return Array.from(seen.values()).reverse()
}
