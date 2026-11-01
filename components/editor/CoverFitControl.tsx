'use client'

import React from 'react'
import { COVER_RATIO, type CoverFit } from '@/lib/cover'
import { CoverImage } from '@/components/published/CoverImage'

interface Palette { surface2: string; border: string; text: string; text2: string; text3: string }

interface Props {
  url: string | undefined
  fit: CoverFit
  onChange: (fit: CoverFit) => void
  palette: Palette
}

const OPTIONS: { id: CoverFit; label: string; hint: string }[] = [
  { id: 'fill', label: 'Fill', hint: 'Crops the image to the card shape' },
  { id: 'fit', label: 'Fit', hint: 'Shows the whole image, nothing cut' },
]

/** Fill / Fit choice plus a card-shaped preview, so the owner sees exactly what visitors see. */
export function CoverFitControl({ url, fit, onChange, palette }: Props) {
  if (!url) return null
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 28 }}>
      <div role="radiogroup" aria-label="Cover image fit" style={{ flex: '1 1 220px', minWidth: 200 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: palette.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Card cover</div>
        <div style={{ display: 'inline-flex', gap: 4, padding: 3, borderRadius: 8, background: palette.surface2, border: `1px solid ${palette.border}` }}>
          {OPTIONS.map(o => {
            const active = o.id === fit
            return (
              <button key={o.id} type="button" role="radio" aria-checked={active} onClick={() => onChange(o.id)}
                style={{ padding: '5px 16px', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: active ? 'default' : 'pointer', fontFamily: 'var(--px-font)', border: `1px solid ${active ? palette.border : 'transparent'}`, background: active ? 'var(--px-accent)' : 'transparent', color: active ? 'var(--px-accent-fg)' : palette.text2 }}>
                {o.label}
              </button>
            )
          })}
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 12, lineHeight: 1.5, color: palette.text3 }}>
          {OPTIONS.find(o => o.id === fit)?.hint}. Cards use a 16:10 shape, so a 1600×1000 image fits exactly; keep text away from the edges for Fill.
        </p>
      </div>
      <div style={{ flex: '0 0 240px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: palette.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Preview</div>
        <div style={{ position: 'relative', aspectRatio: COVER_RATIO, borderRadius: 10, overflow: 'hidden', border: `1px solid ${palette.border}` }}>
          <CoverImage url={url} fit={fit} label="Card cover preview" />
        </div>
      </div>
    </div>
  )
}
