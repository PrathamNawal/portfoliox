import { Children, type CSSProperties, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  seconds: number
  gap?: number
  /** Extend the strip to the page edges (testimonials, tools). */
  bleed?: boolean
  marginTop?: number
  padding?: string
  label: string
}

/**
 * Infinite horizontal strip. The second copy is aria-hidden so screen readers read
 * each item once; under prefers-reduced-motion CSS stops the scroll, hides the copy
 * and wraps the items into a static list (see app/themes.css).
 */
export function Marquee({ children, seconds, gap = 8, bleed = false, marginTop, padding, label }: Props) {
  const items = Children.toArray(children)
  const style = { '--pxp-dur': `${seconds}s`, '--pxp-gap': `${gap}px`, padding } as CSSProperties
  return (
    <div className={`pxp-marquee-wrap${bleed ? ' pxp-marquee-wrap--bleed' : ''}`} style={{ marginTop }} role="group" aria-label={label}>
      <div className="pxp-marquee" style={style}>
        {items}
        <div className="pxp-dup" aria-hidden="true">{items}</div>
      </div>
    </div>
  )
}
