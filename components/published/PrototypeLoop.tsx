'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { CardLoop } from '@/lib/case-screens'

// "Work in motion" on a case-study card: a device frame over the cover that plays the project's key screens as a
// tap-and-slide prototype (or the owner's uploaded clip). The cover is the poster; nothing else is fetched until the
// reader hovers or focuses the card (or, on touch screens, until it is mostly in view). Plays on hover, focus, or in
// view on touch; paused otherwise. Not rendered at Motion: Still or under reduced motion. Styles: "Prototype loop" in app/themes.css.

export function PrototypeLoop({ loop, label }: { loop: CardLoop; label: string }) {
  const root = useRef<HTMLDivElement>(null)
  const [armed, setArmed] = useState(false)
  const [inView, setInView] = useState(false)
  const [wide, setWide] = useState(false)
  const [ok, setOk] = useState(true)

  useEffect(() => {
    const el = root.current
    const card = el?.closest<HTMLElement>('.pxp-card')
    if (!el || !card) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setOk(false); return }
    const arm = () => setArmed(true)
    card.addEventListener('pointerenter', arm, { once: true })
    card.addEventListener('focusin', arm, { once: true })
    let io: IntersectionObserver | undefined
    if (window.matchMedia('(hover: none)').matches) {
      io = new IntersectionObserver(([e]) => { setInView(e.isIntersecting); if (e.isIntersecting) setArmed(true) }, { threshold: 0.6 })
      io.observe(card)
    }
    return () => { card.removeEventListener('pointerenter', arm); card.removeEventListener('focusin', arm); io?.disconnect() }
  }, [])

  if (!ok) return null
  const n = loop.kind === 'screens' ? loop.screens.length : 0
  return (
    <div ref={root} className="pxp-proto" data-armed={armed || undefined} data-inview={inView || undefined} data-wide={wide || undefined} data-n={n || undefined} aria-hidden="true">
      {armed && (
        <div className="pxp-proto__device" role="img" aria-label={`${label}: preview`}>
          {loop.kind === 'clip' ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video className="pxp-proto__clip" src={loop.src} muted loop playsInline autoPlay preload="none" onLoadedMetadata={e => setWide(e.currentTarget.videoWidth > e.currentTarget.videoHeight * 1.1)} />
          ) : (
            <>
              <div className="pxp-proto__track">
                {[...loop.screens, loop.screens[0]].map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" loading="lazy" decoding="async" draggable={false}
                    onLoad={i === 0 ? e => setWide(e.currentTarget.naturalWidth > e.currentTarget.naturalHeight * 1.1) : undefined} />
                ))}
              </div>
              <span className="pxp-proto__cursor"><span className="pxp-proto__ripple" /></span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
