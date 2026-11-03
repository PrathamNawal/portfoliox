// How a case-study image should be framed, from its natural shape. Nothing is ever cropped: each shape gets
// a frame that shows the whole image (see SmartImage and the "Smart image" section of app/themes.css).
//   wide      ratio >= 1.2   full column width at its natural height
//   square    0.8 .. 1.2     natural size, centred on a soft stage (a blurred copy of itself behind it)
//   portrait  0.45 .. 0.8    same stage, capped in height
//   tall      < 0.45         full-page screenshots: a browser frame that pans as the page scrolls

export type ImageShape = 'wide' | 'square' | 'portrait' | 'tall'

export const DEFAULT_RATIO = 4 / 3

export function ratioOf(w: number, h: number): number {
  return w > 0 && h > 0 ? w / h : DEFAULT_RATIO
}

export function shapeOf(ratio: number): ImageShape {
  if (ratio >= 1.2) return 'wide'
  if (ratio >= 0.8) return 'square'
  if (ratio >= 0.45) return 'portrait'
  return 'tall'
}
