// Case study cover handling.
//
// Every card shows the cover in ONE shape (COVER_RATIO), so the crop is the same at any
// column width and in every theme. Two fit modes decide what happens when the image is a
// different shape:
//   fill  crop the image to the card shape (default, previous behaviour)
//   fit   show the whole image uncropped, over a blurred copy of itself

export const COVER_RATIO = '16 / 10'
export const COVER_FITS = ['fill', 'fit'] as const
export type CoverFit = (typeof COVER_FITS)[number]
export const DEFAULT_COVER_FIT: CoverFit = 'fill'

export function isCoverFit(value: unknown): value is CoverFit {
  return typeof value === 'string' && (COVER_FITS as readonly string[]).includes(value)
}

export function resolveCoverFit(value: unknown): CoverFit {
  return isCoverFit(value) ? value : DEFAULT_COVER_FIT
}

/** Safe CSS url() for user-supplied image URLs (quotes and parentheses cannot break out). */
export function cssUrl(url: string): string {
  return `url("${url.replace(/["\\()\n\r]/g, c => encodeURIComponent(c))}")`
}
