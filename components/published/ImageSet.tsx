'use client'

import React, { useEffect, useRef, useState } from 'react'
import { DEFAULT_RATIO, isDocument, packRows, ROW_GAP, ROW_MAX_H } from '@/lib/image-shape'
import { SmartImage } from './SmartImage'
import { useImageRatio } from './useImageRatio'

// One or more neighbouring case-study images. One image: SmartImage. Two or more: justified rows (at most three per
// row, each row between MIN_ROW_H and ROW_MAX_H tall) where every image keeps its own shape; when the column is too
// narrow for that (a split chapter) the images stack one per line instead, at the same widths a single image gets, so
// image size stays consistent from chapter to chapter. Styles: "Images" in app/themes.css.

export interface SetItem { url: string; caption: string }

export function ImageSet({ items }: { items: SetItem[] }) {
  const root = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [ratios, setRatios] = useState<number[]>([])
  const [widths, setWidths] = useState<number[]>([])

  useEffect(() => {
    const el = root.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const setRatio = (i: number, r: number, w = 0) => {
    setRatios(v => (v[i] === r ? v : Object.assign([...v], { [i]: r })))
    if (w) setWidths(v => (v[i] === w ? v : Object.assign([...v], { [i]: w })))
  }
  const rs = items.map((_, i) => ratios[i] ?? DEFAULT_RATIO)
  // documents (exported slides and pages) always get a line of their own; the images between them are packed as usual
  const doc = items.map((_, i) => isDocument(ratios[i], widths[i]))
  const sizes: number[] = []
  for (let i = 0; i < items.length;) {
    if (doc[i]) { sizes.push(1); i++; continue }
    let j = i
    while (j < items.length && !doc[j]) j++
    sizes.push(...(j - i === 1 ? [1] : packRows(rs.slice(i, j), width || 1000)))
    i = j
  }

  // a set that has rows keeps one row height: a leftover image takes that height instead of filling the column
  let refHeight = 0
  {
    let from = 0
    for (const k of sizes) {
      if (k > 1 && !refHeight) {
        const sum = rs.slice(from, from + k).reduce((a, b) => a + b, 0)
        refHeight = (Math.min(width || 1000, sum * ROW_MAX_H) - ROW_GAP * (k - 1)) / sum
      }
      from += k
    }
  }

  let at = 0
  return (
    <div ref={root} className={items.length === 1 ? 'px-set px-set--one' : 'px-set'}>
      {sizes.map(k => {
        const from = at
        at += k
        if (k === 1 && (!refHeight || doc[from])) {
          const it = items[from]
          return (
            <figure key={from} className="px-set__one">
              <SmartImage src={it.url} alt={it.caption} initialRatio={ratios[from]} onRatio={(r, w) => setRatio(from, r, w)} />
              {it.caption && <figcaption>{it.caption}</figcaption>}
            </figure>
          )
        }
        const maxW = k === 1 ? refHeight * rs[from] : undefined
        return <Row key={from} items={items.slice(from, from + k)} ratios={rs.slice(from, from + k)} maxW={maxW} onRatio={(i, r, w) => setRatio(from + i, r, w)} />
      })}
    </div>
  )
}

function Row({ items, ratios, maxW, onRatio }: { items: SetItem[]; ratios: number[]; maxW?: number; onRatio: (i: number, r: number, w: number) => void }) {
  const sum = ratios.reduce((a, b) => a + b, 0)
  return (
    <div className="px-row" style={{ '--max': `${(maxW ?? sum * ROW_MAX_H).toFixed(0)}px` } as React.CSSProperties}>
      {items.map((it, i) => <RowItem key={i} item={it} ratio={ratios[i]} onRatio={(r, w) => onRatio(i, r, w)} />)}
    </div>
  )
}

function RowItem({ item, ratio, onRatio }: { item: SetItem; ratio: number; onRatio: (r: number, w: number) => void }) {
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
