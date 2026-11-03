'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { hueOf } from '@/lib/experience-story'

// Company mark for the experience section: the stored logo when it loads and is visible, else the initial on a tint
// taken from the company name. Logos are often hot-linked white-on-transparent marks (made for dark headers) that
// vanish on a light tile, so a logo that is blank once drawn, or whose file name says it is white, is replaced by
// the monogram. Styles: .pxs-chip in app/globals.css.

const WHITE_NAME = /[-_.]white/i

/** True when a drawn logo has almost no visible ink: transparent or near-white everywhere. Null if the browser will not say. */
function isBlank(img: HTMLImageElement): boolean | null {
  try {
    const c = document.createElement('canvas')
    c.width = c.height = 24
    const x = c.getContext('2d')
    if (!x) return null
    x.drawImage(img, 0, 0, 24, 24)
    const d = x.getImageData(0, 0, 24, 24).data
    let ink = 0
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 40 && !(d[i] > 238 && d[i + 1] > 238 && d[i + 2] > 238)) ink++
    return ink < 14
  } catch {
    return null // a cross-origin image without CORS headers cannot be read
  }
}

export function Chip({ company, logoUrl, small }: { company: string; logoUrl?: string | null; small?: boolean }) {
  const [broken, setBroken] = useState(!!logoUrl && WHITE_NAME.test(logoUrl.split('/').pop() ?? ''))
  const [cors, setCors] = useState(true) // try a readable (CORS) load first, then a plain one
  const img = useRef<HTMLImageElement>(null)
  const style = { '--pxs-hue': hueOf(company) } as CSSProperties

  const check = (el: HTMLImageElement | null) => {
    if (el && cors && el.complete && el.naturalWidth && isBlank(el)) setBroken(true)
  }
  useEffect(() => { check(img.current) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className={`pxs-chip${small ? ' pxs-chip--sm' : ''}`} style={style} aria-hidden="true">
      <span className="pxs-chip__initial">{company.trim()[0]?.toUpperCase() ?? '?'}</span>
      {logoUrl && !broken && (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={cors ? 'cors' : 'plain'} ref={img} className="pxs-chip__img" src={logoUrl} alt="" crossOrigin={cors ? 'anonymous' : undefined}
          onLoad={e => check(e.currentTarget)} onError={() => { if (cors) setCors(false); else setBroken(true) }} />
      )}
    </span>
  )
}
