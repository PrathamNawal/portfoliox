// How a case-study image is framed, from its natural shape. Nothing is ever cropped, and every image follows
// the same few rules so mixed sizes read as one system (see SmartImage, ImageSet and the "Images" section of app/themes.css).
//   wide      ratio >= 1.2   fills the column at its natural height
//   poster    0.45 .. 1.2    square and portrait: one fixed width (POSTER_W), capped in height (POSTER_MAX_H),
//                            left-aligned with the text
//   tall      < 0.45         full-page screenshots: a browser frame that pans as the page scrolls
// Two or more neighbouring images become justified rows (at most ROW_MAX per row, ROW_MAX_H tall at most).

import type { Block } from '@/types'

export type ImageShape = 'wide' | 'poster' | 'tall'

export const DEFAULT_RATIO = 4 / 3
export const POSTER_W = 600
export const POSTER_MAX_H = 720
export const ROW_MAX_H = 480
export const ROW_MAX = 3

export function ratioOf(w: number, h: number): number {
  return w > 0 && h > 0 ? w / h : DEFAULT_RATIO
}

export function shapeOf(ratio: number): ImageShape {
  if (ratio >= 1.2) return 'wide'
  if (ratio >= 0.45) return 'poster'
  return 'tall'
}

/** Split n images into rows of at most ROW_MAX with sizes as even as possible (4 -> 2+2, 5 -> 3+2, 7 -> 3+2+2). */
export function rowSizes(n: number): number[] {
  const rows = Math.ceil(n / ROW_MAX)
  const sizes: number[] = []
  let left = n
  for (let r = rows; r > 0; r--) { const k = Math.ceil(left / r); sizes.push(k); left -= k }
  return sizes
}

/** Neighbouring image and gallery blocks become one gallery block (the first block's label), so they lay out as rows. */
export function mergeImageBlocks(blocks: Block[]): Block[] {
  const out: Block[] = []
  const items = (b: Block) => b.type === 'image' ? (b.imageUrl ? [{ url: b.imageUrl, caption: b.caption ?? '' }] : []) : (b.images ?? []).filter(i => i.url)
  for (const b of blocks) {
    const isImg = b.type === 'image' || b.type === 'gallery'
    const prev = out[out.length - 1]
    if (isImg && prev && prev.type === 'gallery' && items(b).length) {
      out[out.length - 1] = { ...prev, images: [...(prev.images ?? []), ...items(b)] }
    } else if (isImg) {
      const list = items(b)
      if (list.length) out.push({ ...b, type: 'gallery', images: list })
    } else out.push(b)
  }
  return out
}
