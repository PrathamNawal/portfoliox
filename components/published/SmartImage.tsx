'use client'

import React, { useState } from 'react'
import { cssUrl } from '@/lib/cover'
import { DEFAULT_RATIO, shapeOf } from '@/lib/image-shape'
import { useImageRatio } from './useImageRatio'

// One case-study image, framed by its own shape so it is never cropped and the owner never has to resize it.
// The shape is read when the image loads, so existing portfolios are fixed without any data change.
// Styles: "Smart image" in app/themes.css.

export function SmartImage({ src, alt, onRatio }: { src: string; alt: string; onRatio?: (ratio: number) => void }) {
  const [ratio, setRatio] = useState<number | null>(null)
  const shape = ratio === null ? 'wide' : shapeOf(ratio)
  const img = useImageRatio(r => { setRatio(r); onRatio?.(r) })

  if (shape === 'tall') {
    return (
      <div className="px-si px-si--tall" style={{ '--r': ratio ?? DEFAULT_RATIO } as React.CSSProperties}>
        <div className="px-si__chrome" aria-hidden="true"><i /><i /><i /></div>
        <div className="px-si__view">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} loading="lazy" decoding="async" ref={img.ref} onLoad={img.onLoad} />
        </div>
      </div>
    )
  }
  if (shape === 'wide') {
    return (
      <div className="px-si px-si--wide" data-loaded={ratio !== null || undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" decoding="async" ref={img.ref} onLoad={img.onLoad} />
      </div>
    )
  }
  return (
    <div className={`px-si px-si--stage px-si--${shape}`} style={{ '--r': ratio ?? DEFAULT_RATIO } as React.CSSProperties}>
      <div className="px-si__blur" aria-hidden="true" style={{ backgroundImage: cssUrl(src) }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" decoding="async" ref={img.ref} onLoad={img.onLoad} />
    </div>
  )
}
