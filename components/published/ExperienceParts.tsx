'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { isPortrait, screenRatio, visibleScreens } from '@/lib/experience-story'
import { excerptOf } from '@/lib/recs'
import type { ExperienceScreen, Testimonial } from '@/types'

// Pieces of the Work Experience section that ExperienceClimb shares across its layouts: the recommendation that
// belongs to a role, the screens of a role, and the full-screen viewer for them. Styles: .pxs-* in app/globals.css.

type Vars = CSSProperties & Record<`--${string}`, string | number>

/** What someone who worked with her there said, next to what she claims about the role. */
export function Proof({ t }: { t: Testimonial }) {
  return (
    <figure className="pxs-proof">
      <blockquote>&ldquo;{excerptOf(t.quote).map((p, i) => p.hl ? <mark key={i}>{p.text}</mark> : <React.Fragment key={i}>{p.text}</React.Fragment>)}&rdquo;</blockquote>
      <figcaption>
        {t.photo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={t.photo_url} alt="" />
          : <span aria-hidden="true">{t.name[0]}</span>}
        <span><b>{t.name}</b><i>{t.title_and_company}</i></span>
        <a href={`#rec-${t.id}`}>Read in full ↗</a>
      </figcaption>
    </figure>
  )
}

export function Exhibit({ screens, featured, role, onOpen }: { screens: ExperienceScreen[]; featured: boolean; role: string; onOpen: (index: number, el: HTMLElement) => void }) {
  const limit = visibleScreens(featured)
  const shown = screens.slice(0, limit)
  // Past the limit the last tile carries "+N" (itself plus the hidden ones) and opens the lightbox there.
  const hidden = screens.length > limit ? screens.length - (limit - 1) : 0
  return (
    <div className="pxs-exhibit" role="group" aria-label={`${role}: screens`}>
      <div className="pxs-stage">
        {shown.map((s, i) => {
          const more = hidden > 0 && i === shown.length - 1
          const cls = isPortrait(s) ? 'pxs-shot pxs-shot--ph' : 'pxs-shot pxs-shot--ls'
          return (
            <figure key={`${s.url}-${i}`} className={cls} style={{ '--r': screenRatio(s) } as Vars}>
              <button type="button" className="pxs-shot__btn" onClick={e => onOpen(i, e.currentTarget)}
                aria-label={more ? `Show all screens, ${hidden} more` : `Open screen ${i + 1}${s.caption ? `: ${s.caption}` : ''}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt={s.caption ?? ''} width={s.w} height={s.h} loading="lazy" decoding="async" />
                {more && <span className="pxs-shot__more" aria-hidden="true">+{hidden}</span>}
              </button>
              {s.caption && !more && <figcaption>{s.caption}</figcaption>}
            </figure>
          )
        })}
      </div>
    </div>
  )
}

export function Lightbox({ screens, start, onClose }: { screens: ExperienceScreen[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start)
  const closeRef = useRef<HTMLButtonElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const n = screens.length
  const go = useCallback((d: number) => setI(v => (v + d + n) % n), [n])

  useEffect(() => {
    closeRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Tab') {
        const els = Array.from(boxRef.current?.querySelectorAll<HTMLElement>('button') ?? [])
        if (!els.length) return
        const first = els[0], last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow }
  }, [go, onClose])

  const s = screens[i]
  if (!s) return null
  return (
    <div className="pxs-lb" role="dialog" aria-modal="true" aria-label="Screens" ref={boxRef} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <button type="button" className="pxs-lb__x" ref={closeRef} onClick={onClose} aria-label="Close">✕</button>
      {n > 1 && <button type="button" className="pxs-lb__nav pxs-lb__prev" onClick={() => go(-1)} aria-label="Previous screen">←</button>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pxs-lb__img" src={s.url} alt={s.caption ?? ''} />
      {n > 1 && <button type="button" className="pxs-lb__nav pxs-lb__next" onClick={() => go(1)} aria-label="Next screen">→</button>}
      <p className="pxs-lb__cap" aria-live="polite">{s.caption ? `${s.caption} · ` : ''}{i + 1} / {n}</p>
    </div>
  )
}
