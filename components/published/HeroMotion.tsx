'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { CoverImage } from './CoverImage'
import type { MotionLevel } from '@/lib/motion'

export interface WallCover { id: string; title: string; url: string; fit?: string | null }

interface Props {
  covers: WallCover[]
  slug: string
  level: MotionLevel
}

// Where the covers hang in the hero margins: side, vertical %, offset %, tilt, parallax depth, size.
const SLOTS = [
  { side: 'left', top: 9, x: 3, rot: -7, depth: 1.0, w: 1 },
  { side: 'right', top: 7, x: 4, rot: 6, depth: 0.8, w: 1.05 },
  { side: 'left', top: 57, x: 6, rot: 5, depth: 1.6, w: 0.9 },
  { side: 'right', top: 55, x: 7, rot: -5, depth: 1.3, w: 0.95 },
  { side: 'left', top: 80, x: 2, rot: -4, depth: 0.7, w: 0.85 },
  { side: 'right', top: 79, x: 3, rot: 4, depth: 1.1, w: 0.9 },
] as const

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
 * Hero motion layer (rendered as the first child of .pxp-hero).
 *  - glow: a soft colour taken from the owner's own covers, breathing behind the hero
 *  - wall (expressive only): covers pinned in the side margins; they drop in, settle, drift,
 *    and shift slightly with the cursor. Decorative: aria-hidden, not focusable.
 * Everything is CSS-driven (see "Motion" in app/themes.css); this only supplies data and the cursor.
 */
export function HeroMotion({ covers, slug, level }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [glow, setGlow] = useState<string | null>(null)
  const wall = level === 'expressive' && covers.length >= 2

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

  useEffect(() => {
    const hero = rootRef.current?.parentElement
    const root = rootRef.current
    if (!wall || !hero || !root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect()
        root.style.setProperty('--mx', String(((e.clientX - r.left) / r.width - 0.5) * 2))
        root.style.setProperty('--my', String(((e.clientY - r.top) / r.height - 0.5) * 2))
      })
    }
    const onLeave = () => { root.style.setProperty('--mx', '0'); root.style.setProperty('--my', '0') }
    hero.addEventListener('pointermove', onMove)
    hero.addEventListener('pointerleave', onLeave)
    return () => { cancelAnimationFrame(raf); hero.removeEventListener('pointermove', onMove); hero.removeEventListener('pointerleave', onLeave) }
  }, [wall])

  return (
    <div ref={rootRef} className="pxp-motion" aria-hidden="true">
      <div className="pxp-glow" data-on={glow ? 'true' : 'false'} style={glow ? ({ '--pxp-glow': glow } as React.CSSProperties) : undefined} />
      {wall && covers.slice(0, SLOTS.length).map((c, i) => {
        const s = SLOTS[i]
        return (
          <Link
            key={c.id}
            href={`/${slug}/case/${c.id}`}
            tabIndex={-1}
            className="pxp-wall__slot"
            style={{
              [s.side]: `${s.x}%`,
              top: `${s.top}%`,
              '--rot': `${s.rot}deg`,
              '--depth': s.depth,
              '--w': s.w,
              '--delay': `${250 + i * 140}ms`,
              '--dur': `${9 + (i % 3) * 2.5}s`,
            } as React.CSSProperties}
          >
            <span className="pxp-wall__tile">
              <CoverImage url={c.url} fit={c.fit} label="" />
            </span>
          </Link>
        )
      })}
    </div>
  )
}
