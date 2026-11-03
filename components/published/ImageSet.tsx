'use client'

import React, { useState } from 'react'
import { DEFAULT_RATIO, rowSizes, ROW_MAX_H } from '@/lib/image-shape'
import { SmartImage } from './SmartImage'
import { useImageRatio } from './useImageRatio'

// One or more neighbouring case-study images. One image: SmartImage. Two or more: justified rows (at most three
// per row) where every image in a row shares one height and keeps its own shape; a row is never taller than ROW_MAX_H.
// Styles: "Images" in app/themes.css.

export interface SetItem { url: string; caption: string }

export function ImageSet({ items }: { items: SetItem[] }) {
  if (items.length === 1) {
    const it = items[0]
    return (
      <figure className="px-set px-set--one">
        <SmartImage src={it.url} alt={it.caption} />
        {it.caption && <figcaption>{it.caption}</figcaption>}
      </figure>
    )
  }
  let at = 0
  return (
    <div className="px-set">
      {rowSizes(items.length).map(n => {
        const row = items.slice(at, at + n)
        at += n
        return <Row key={at} items={row} />
      })}
    </div>
  )
}

function Row({ items }: { items: SetItem[] }) {
  const [ratios, setRatios] = useState<number[]>([])
  const rs = items.map((_, i) => ratios[i] ?? DEFAULT_RATIO)
  const sum = rs.reduce((a, b) => a + b, 0)
  return (
    <div className="px-row" style={{ '--max': `${(sum * ROW_MAX_H).toFixed(0)}px` } as React.CSSProperties}>
      {items.map((it, i) => (
        <RowItem key={i} item={it} ratio={rs[i]} onRatio={r => setRatios(v => { if (v[i] === r) return v; const next = [...v]; next[i] = r; return next })} />
      ))}
    </div>
  )
}

function RowItem({ item, ratio, onRatio }: { item: SetItem; ratio: number; onRatio: (r: number) => void }) {
  const img = useImageRatio(onRatio)
  return (
    <figure className="px-row__item" style={{ flexGrow: ratio }}>
      <div className="px-fig px-fig--row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt={item.caption} loading="lazy" decoding="async" ref={img.ref} onLoad={img.onLoad} />
      </div>
      {item.caption && <figcaption>{item.caption}</figcaption>}
    </figure>
  )
}
