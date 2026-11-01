import type { ReactNode } from 'react'
import { THEMES, resolveTheme, type ThemeId } from '@/lib/themes'

interface Props {
  theme?: ThemeId | string | null
  /** Spotlight keeps its original warm light palette when the theme is "light". */
  layout?: 'canvas' | 'spotlight'
  children: ReactNode
}

/**
 * Theme scope for every published page. All theme tokens hang off this element
 * (app/themes.css), so nothing outside a portfolio is ever restyled.
 */
export function ThemeScope({ theme, layout = 'canvas', children }: Props) {
  const id = resolveTheme(theme)
  const tone = THEMES.find(t => t.id === id)?.tone ?? 'light'
  return (
    <div
      className={layout === 'spotlight' ? 'pxp pxp--spotlight' : 'pxp'}
      data-pxtheme={id}
      style={{ colorScheme: tone }}
    >
      {children}
    </div>
  )
}
