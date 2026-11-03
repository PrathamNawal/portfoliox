'use client'

import React, { useEffect, useState } from 'react'

export interface WallCover { id: string; title: string; url: string; fit?: string | null }

interface Props {
  covers: WallCover[]
}

/** Dominant vivid colour of an image, or null (CORS-tainted canvas, grey images, load error). */
function sampleColour(url: string): Promise<string | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => resolve(null)
    img.onload = () => {
      try {
        const n = 32
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = n
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0, n, n)
        const { data } = ctx.getImageData(0, 0, n, n)
        const bins = Array.from({ length: 12 }, () => ({ w: 0, r: 0, g: 0, b: 0 }))
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255
          const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
          const s = max === 0 ? 0 : d / max
          if (s < 0.25 || max < 0.25 || max > 0.97 && s < 0.4) continue // skip greys, near-black, near-white
          const h = d === 0 ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
          const bin = bins[Math.min(11, Math.floor((h / 6) * 12))]
          const weight = s * max
          bin.w += weight; bin.r += data[i] * weight; bin.g += data[i + 1] * weight; bin.b += data[i + 2] * weight
        }
        const best = bins.reduce((a, c) => (c.w > a.w ? c : a))
        if (best.w < 2) return resolve(null)
        resolve(`rgb(${Math.round(best.r / best.w)}, ${Math.round(best.g / best.w)}, ${Math.round(best.b / best.w)})`)
      } catch {
        resolve(null)
      }
    }
    img.src = url
  })
}

/**
 * Hero motion layer (rendered as the first child of .pxp-hero): a soft colour taken from the owner's own covers,
 * breathing behind the hero. The side margins of the hero belong to HeroFlanks (components/scene), not to this layer.
 * Everything is CSS-driven (see "Motion" in app/themes.css); this only supplies the colour.
 */
export function HeroMotion({ covers }: Props) {
  const [glow, setGlow] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      for (const c of covers.slice(0, 3)) {
        const colour = await sampleColour(c.url)
        if (!alive) return
        if (colour) { setGlow(colour); return }
      }
    })()
    return () => { alive = false }
  }, [covers])

  return (
    <div className="pxp-motion" aria-hidden="true">
      <div className="pxp-glow" data-on={glow ? 'true' : 'false'} style={glow ? ({ '--pxp-glow': glow } as React.CSSProperties) : undefined} />
    </div>
  )
}
