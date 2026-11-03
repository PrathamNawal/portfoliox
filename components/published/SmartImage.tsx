'use client'

import React, { useState } from 'react'
import { DEFAULT_RATIO, shapeOf } from '@/lib/image-shape'
import { useImageRatio } from './useImageRatio'

// One case-study image, framed by its own shape so it is never cropped and the owner never has to resize it.
// The shape is read when the image loads, so existing portfolios are fixed without any data change.
// Rules in lib/image-shape.ts; styles: "Images" in app/themes.css.

export function SmartImage({ src, alt }: { src: string; alt: string }) {
  const [ratio, setRatio] = useState<number | null>(null)
  const shape = ratio === null ? 'wide' : shapeOf(ratio)
  const img = useImageRatio(setRatio)

  if (shape === 'tall') {
    return (
      <div className="px-fig px-fig--tall" style={{ '--r': ratio ?? DEFAULT_RATIO } as React.CSSProperties}>
        <div className="px-fig__chrome" aria-hidden="true"><i /><i /><i /></div>
        <div className="px-fig__view">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} loading="lazy" decoding="async" ref={img.ref} onLoad={img.onLoad} />
        </div>
      </div>
    )
  }
  return (
    <div className={`px-fig px-fig--${shape}`} style={{ '--r': ratio ?? DEFAULT_RATIO } as React.CSSProperties}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" decoding="async" ref={img.ref} onLoad={img.onLoad} />
    </div>
  )
}
