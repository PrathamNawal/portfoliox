// How a case-study image is framed, from its natural shape. Nothing is ever cropped, and every image follows
// the same few rules so mixed sizes read as one system (see SmartImage, ImageSet and the "Images" section of app/themes.css).
//   wide      ratio >= 1.2   fills the column at its natural height
//   poster    0.45 .. 1.2    square and portrait: one fixed width (POSTER_W), capped in height (POSTER_MAX_H),
//                            left-aligned with the text
//   tall      < 0.45         full-page screenshots: a browser frame that pans as the page scrolls
// Two or more neighbouring images become justified rows (at most ROW_MAX per row, between MIN_ROW_H and ROW_MAX_H tall),
// or stack one per line when the column is too narrow for that.

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

/**
 * A document, not a picture: an exported slide or page (at least 2400px wide, roughly 16:9 or 16:10). Its text is only
 * readable at full width, so it is never packed into a row or a narrow column, and it can be opened full screen.
 */
export const DOCUMENT_MIN_WIDTH = 2400
export function isDocument(ratio: number | undefined, naturalWidth: number | undefined): boolean {
  return !!ratio && !!naturalWidth && naturalWidth >= DOCUMENT_MIN_WIDTH && ratio >= 1.5 && ratio <= 2.1
}

export function shapeOf(ratio: number): ImageShape {
  if (ratio >= 1.2) return 'wide'
  if (ratio >= 0.45) return 'poster'
  return 'tall'
}

export const ROW_GAP = 10
export const MIN_ROW_H = 300

const rowHeight = (rs: number[], width: number) => (width - ROW_GAP * (rs.length - 1)) / rs.reduce((a, b) => a + b, 0)

/** n images in `rows` rows, as even as possible (5 in 2 rows is 3 + 2). */
function evenSizes(n: number, rows: number): number[] {
  const base = Math.floor(n / rows), extra = n % rows
  return Array.from({ length: rows }, (_, i) => base + (i < extra ? 1 : 0))
}

/**
 * How many images go in each row of a set, for a column `width` px wide. Images share a row only while the row stays at
 * least MIN_ROW_H tall, so a narrow column (a split chapter) never shrinks images to thumbnails: they stack instead,
 * one per line at the shared widths. Fewest rows first; if no arrangement fits, every image gets its own line.
 */
export function packRows(ratios: number[], width: number): number[] {
  const n = ratios.length
  for (let rows = Math.ceil(n / ROW_MAX); rows < n; rows++) {
    const sizes = evenSizes(n, rows)
    let at = 0
    let ok = true
    for (const k of sizes) {
      if (k > 1 && rowHeight(ratios.slice(at, at + k), width) < MIN_ROW_H) { ok = false; break }
      at += k
    }
    if (ok) return sizes
  }
  return ratios.map(() => 1)
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
