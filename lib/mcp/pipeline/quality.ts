// Quality rubric for a case study. Pure function over the saved record, so it runs on any case study,
// including ones built by hand in the editor.
import type { CaseStudy } from '@/types'
import { hasPlaceholder } from './validate'

export interface QualityCheck { id: string; ok: boolean; fix: string }
export interface QualityReport { score: number; checks: QualityCheck[]; suggestions: string[] }

const words = (s: string) => (s.match(/\S+/g) ?? []).length

export function qualityReport(cs: Pick<CaseStudy, 'title' | 'sections' | 'overview_data' | 'cover_image_url'>): QualityReport {
  const sections = cs.sections ?? []
  const body = sections.filter(s => s.type !== 'overview' && s.type !== 'custom')
  const checks: QualityCheck[] = []
  const add = (id: string, ok: boolean, fix: string) => checks.push({ id, ok, fix })

  add('title', !!cs.title && cs.title !== 'Untitled', 'Give the case study a specific title.')
  add('cover', !!cs.cover_image_url, 'Set a cover image; the portfolio grid uses it.')
  add('structure', body.length >= 3, 'Add at least challenge, process and solution sections.')
  add('summary', words(cs.overview_data?.summary || sections.find(s => s.type === 'overview')?.narrative || '') >= 12, 'Write a 1-2 sentence overview.')
  add('role', !!cs.overview_data?.role?.trim(), 'State your role in the overview.')
  for (const s of body) {
    add(`narrative:${s.type}`, words(s.narrative) >= 35, `"${s.title}" is thin; add what you did and why (35+ words).`)
    if (s.type !== 'whatsnext' && s.type !== 'challenge') add(`visual:${s.type}`, s.blocks.length > 0, `"${s.title}" has no visuals; add a screen.`)
  }
  const impact = sections.find(s => s.type === 'impact')
  add('outcome', !!impact && (impact.blocks.some(b => b.type === 'stat') || words(impact.narrative) >= 35), 'Say what changed because of the work, with a number if you have one.')
  const images = sections.flatMap(s => s.blocks.flatMap(b => b.type === 'image' ? [b.caption] : b.type === 'gallery' ? (b.images ?? []).map(i => i.caption) : []))
  add('captions', images.length === 0 || images.filter(c => c && c.trim()).length / images.length >= 0.5, 'Caption at least half of the screens.')
  const placeholder = sections.some(s => hasPlaceholder(s.narrative))
  add('placeholders', !placeholder, 'Replace placeholder text before publishing.')

  const passed = checks.filter(c => c.ok).length
  return { score: Math.round((passed / checks.length) * 100), checks, suggestions: checks.filter(c => !c.ok).map(c => c.fix) }
}
