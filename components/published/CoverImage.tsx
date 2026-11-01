import { cssUrl, resolveCoverFit } from '@/lib/cover'

interface Props {
  url: string
  fit?: string | null
  label: string
}

/**
 * Fills its (positioned) parent. "fill" crops to the parent's shape; "fit" shows the whole
 * image over a blurred copy so nothing is cut. Styles: .px-cover in app/themes.css.
 */
export function CoverImage({ url, fit, label }: Props) {
  const mode = resolveCoverFit(fit)
  const image = cssUrl(url)
  return (
    <div className="px-cover" data-fit={mode} role="img" aria-label={label}>
      {mode === 'fit' && <div className="px-cover__blur" aria-hidden="true" style={{ backgroundImage: image }} />}
      <div className="px-cover__img" style={{ backgroundImage: image }} />
    </div>
  )
}
