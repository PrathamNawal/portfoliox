'use client'

import { useEffect, useRef } from 'react'
import type { SyntheticEvent } from 'react'

// Reports an image's natural ratio, both when it loads and when it had already loaded before React attached
// (server-rendered images often finish first, so onLoad alone would miss them).
export function useImageRatio(onRatio: (ratio: number) => void) {
  const ref = useRef<HTMLImageElement>(null)
  const cb = useRef(onRatio)
  cb.current = onRatio
  useEffect(() => {
    const img = ref.current
    if (img && img.complete && img.naturalWidth && img.naturalHeight) cb.current(img.naturalWidth / img.naturalHeight)
  }, [])
  const onLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    if (w && h) cb.current(w / h)
  }
  return { ref, onLoad }
}
