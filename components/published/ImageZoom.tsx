'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Click-to-zoom for documents (exported slides and pages): a transparent button over the picture that opens it full
// screen. Escape, the close button or a click outside closes it; focus returns to the button. Styles: "Images" in app/themes.css.

export function ImageZoom({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => { setOpen(false); opener.current?.focus() }, [])

  useEffect(() => {
    if (!open) return
    closeBtn.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close() } }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, close])

  return (
    <>
      <button type="button" ref={opener} className="px-zoom" onClick={() => setOpen(true)} aria-label={alt ? `Enlarge: ${alt}` : 'Enlarge image'} />
      {open && createPortal(
        <div className="px-zoom__box" role="dialog" aria-modal="true" aria-label={alt || 'Image'} onClick={e => { if (e.target === e.currentTarget) close() }}>
          <button type="button" className="px-zoom__x" ref={closeBtn} onClick={close} aria-label="Close">✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} />
          {alt && <p>{alt}</p>}
        </div>,
        document.body
      )}
    </>
  )
}
