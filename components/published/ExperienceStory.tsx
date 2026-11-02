'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { sortExperience, durationMonths, formatDuration, formatRange, highlightMetrics } from '@/lib/experience'
import { careerArc, hueOf, isPortrait, screenRatio, startYear, storyHeadline, visibleScreens } from '@/lib/experience-story'
import type { ExperienceScreen, WorkExperience } from '@/types'

type Vars = CSSProperties & Record<`--${string}`, string | number>

const tintOf = (company: string): Vars => ({ '--pxs-hue': hueOf(company) })

/** Company mark: the stored logo when it loads, else the initial on a tint taken from the name. */
function Chip({ company, logoUrl, small }: { company: string; logoUrl?: string | null; small?: boolean }) {
  const [broken, setBroken] = useState(false)
  return (
    <span className={`pxs-chip${small ? ' pxs-chip--sm' : ''}`} style={tintOf(company)} aria-hidden="true">
      <span className="pxs-chip__initial">{company.trim()[0]?.toUpperCase() ?? '?'}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logoUrl && !broken && <img className="pxs-chip__img" src={logoUrl} alt="" onError={() => setBroken(true)} />}
    </span>
  )
}

interface Open { roleId: string; index: number }

export function ExperienceStory({ experience }: { experience: WorkExperience[] }) {
  const roles = useMemo(() => sortExperience(experience), [experience])
  const arc = useMemo(() => careerArc(roles), [roles])
  const byId = useMemo(() => new Map(roles.map(r => [r.id, r])), [roles])

  const timelineRef = useRef<HTMLOListElement>(null)
  const [lightbox, setLightbox] = useState<Open | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  // The line fills as the reader scrolls down the timeline. Reduced motion: it stays full.
  useEffect(() => {
    const el = timelineRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const update = () => {
      frame = 0
      const r = el.getBoundingClientRect()
      const p = (window.innerHeight * 0.6 - r.top) / Math.max(1, r.height)
      el.style.setProperty('--p', String(Math.min(1, Math.max(0, p))))
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const show = (roleId: string, index: number, opener: HTMLElement) => {
    openerRef.current = opener
    setLightbox({ roleId, index })
  }
  const close = useCallback(() => {
    setLightbox(null)
    openerRef.current?.focus()
  }, [])

  const featuredId = roles[0]?.id
  const compactId = roles.length >= 3 ? roles[roles.length - 1].id : null

  return (
    <div className="pxs">
      {arc.length > 1 && (
        <nav className="pxs-arc" aria-label="Career arc">
          <ol className="pxs-arc__track">
            {arc.map(stop => {
              const r = byId.get(stop.id)!
              return (
                <li key={stop.company} className="pxs-arc__item">
                  <a className="pxs-arc__node" href={`#pxs-${stop.id}`} data-current={stop.current ? 'true' : undefined} aria-current={stop.current ? 'true' : undefined}>
                    <Chip company={stop.company} logoUrl={r.logo_url} />
                    <span className="pxs-arc__name">{stop.company}</span>
                    <span className="pxs-arc__role">{r.role}</span>
                    <span className="pxs-arc__yr">{startYear(r.start_month) ?? ''}</span>
                  </a>
                </li>
              )
            })}
          </ol>
        </nav>
      )}

      <ol className="pxs-timeline" ref={timelineRef}>
        {roles.map(exp => {
          const featured = exp.id === featuredId
          const compact = exp.id === compactId
          const headline = storyHeadline(exp)
          const screens = Array.isArray(exp.screens) ? exp.screens : []
          const bullets = exp.description ? exp.description : null
          return (
            <li key={exp.id} id={`pxs-${exp.id}`} className="pxs-chapter" data-size={featured ? 'featured' : compact ? 'compact' : 'regular'} data-current={exp.is_current ? 'true' : undefined}>
              <div className="pxs-when">
                <div className="pxs-yr">{startYear(exp.start_month) ?? ''}</div>
                <div className="pxs-span">
                  <span>{formatRange(exp)}</span>
                  <span>{formatDuration(durationMonths(exp))}</span>
                </div>
              </div>
              <article className="pxs-card" aria-label={`${exp.role}, ${exp.company}`}>
                <div className="pxs-who">
                  <Chip company={exp.company} logoUrl={exp.logo_url} />
                  <span className="pxs-company">{exp.company}</span>
                  {exp.discipline_tag && <span className="pxs-tag">{exp.discipline_tag}</span>}
                </div>
                <p className="pxs-role">{exp.role}</p>
                {headline && <h3 className="pxs-headline">{headline}</h3>}
                {exp.stat_value && (
                  <p className="pxs-stat">
                    <b>{exp.stat_value}</b>
                    {exp.stat_label && <span>{exp.stat_label}</span>}
                  </p>
                )}
                {screens.length > 0 && <Exhibit screens={screens} featured={featured} role={exp.role} onOpen={(i, el) => show(exp.id, i, el)} />}
                {bullets && (
                  <details className="pxp-exp-more pxs-more" open={featured}>
                    <summary>
                      <span className="pxp-exp-more__show">Show details</span>
                      <span className="pxp-exp-more__hide">Hide details</span>
                    </summary>
                    <div className="pxp-exp-desc" dangerouslySetInnerHTML={{ __html: highlightMetrics(bullets) }} />
                  </details>
                )}
              </article>
            </li>
          )
        })}
      </ol>

      {lightbox && <Lightbox screens={(byId.get(lightbox.roleId)?.screens ?? []) as ExperienceScreen[]} start={lightbox.index} onClose={close} />}
    </div>
  )
}

function Exhibit({ screens, featured, role, onOpen }: { screens: ExperienceScreen[]; featured: boolean; role: string; onOpen: (index: number, el: HTMLElement) => void }) {
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

function Lightbox({ screens, start, onClose }: { screens: ExperienceScreen[]; start: number; onClose: () => void }) {
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
