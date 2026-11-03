import type { Block, CaseStudy } from '@/types'

// What a case-study card can play as its "work in motion" loop: an uploaded clip (a video block pointing at a
// direct mp4/webm file) or, failing that, up to MAX_SCREENS screens from its image blocks, which the card animates
// as a tap-and-slide prototype. Needs at least MIN_SCREENS of them; the cover is the poster, so it is left out.

export const MIN_SCREENS = 2
export const MAX_SCREENS = 4
const FILE_VIDEO = /\.(mp4|webm)(\?|#|$)/i

export type CardLoop = { kind: 'clip'; src: string } | { kind: 'screens'; screens: string[] }

function blocksOf(cs: Pick<CaseStudy, 'blocks' | 'sections'>): Block[] {
  return [...(cs.blocks ?? []), ...(cs.sections ?? []).flatMap(sec => sec.blocks ?? [])]
}

export function cardLoop(cs: Pick<CaseStudy, 'blocks' | 'sections' | 'cover_image_url' | 'nda_enabled'>): CardLoop | null {
  if (cs.nda_enabled) return null
  const screens: string[] = []
  const add = (url?: string) => { if (url && url !== cs.cover_image_url && !screens.includes(url)) screens.push(url) }
  for (const b of blocksOf(cs)) {
    if (b.type === 'video' && b.videoUrl && FILE_VIDEO.test(b.videoUrl)) return { kind: 'clip', src: b.videoUrl }
    if (b.type === 'image') add(b.imageUrl)
    else if (b.type === 'gallery') b.images?.forEach(img => add(img.url))
    else if (b.type === 'compare') { add(b.beforeUrl); add(b.afterUrl) }
  }
  return screens.length >= MIN_SCREENS ? { kind: 'screens', screens: screens.slice(0, MAX_SCREENS) } : null
}
