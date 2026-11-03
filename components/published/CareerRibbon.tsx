'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { DISCIPLINE_LABEL, DISCIPLINE_SHORT, layoutRibbon, type Discipline } from '@/lib/career-ribbon'
import type { WorkExperience } from '@/types'
import { Chip } from './StoryChip'

// The career as one ribbon: a bar per role, as wide as the role was long, on a single time axis (long gaps are
// shortened to a break; parallel roles take their own lane), coloured by discipline so the move from graphic to UX to
// product reads at a glance, with a headline computed from the roles. It is also the navigation: each bar links to its
// chapter, the chapter being read is highlighted, and on wide screens it stays in view while the timeline scrolls.
// Motion on: the bars draw in left to right and the current role pulses. Styles: "Career ribbon" in app/globals.css.

const LANE = 38

export function CareerRibbon({ roles, animate }: { roles: WorkExperience[]; animate: boolean }) {
  const ribbon = useMemo(() => layoutRibbon(roles), [roles])
  const byId = useMemo(() => new Map(roles.map(r => [r.id, r])), [roles])
  const [active, setActive] = useState<string | null>(null)
  const [shown, setShown] = useState(!animate)
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const chapters = Array.from(document.querySelectorAll<HTMLElement>('.pxs-chapter'))
    if (!chapters.length) return
    const io = new IntersectionObserver(entries => {
      const hit = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (hit) setActive(hit.target.id.replace(/^pxs-/, ''))
    }, { rootMargin: '-30% 0px -60% 0px' })
    chapters.forEach(c => io.observe(c))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const el = root.current
    if (!animate || !el) { setShown(true); return }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [animate])

  if (ribbon.bars.length < 2) return null
  const present = (['brand', 'ux', 'product'] as Discipline[]).filter(d => ribbon.bars.some(b => b.discipline === d))

  return (
    <nav className="pxs-rb" ref={root} aria-label="Career timeline" data-motion={animate ? 'on' : 'off'} data-in={shown || undefined} data-has-active={active ? '' : undefined}>
      <div className="pxs-rb__head">
        <p className="pxs-rb__headline">{ribbon.headline}</p>
        <p className="pxs-rb__meta">{ribbon.experience} of experience</p>
        {present.length > 1 && (
          <ul className="pxs-rb__legend" aria-hidden="true">
            {present.map(d => <li key={d} data-d={d}>{DISCIPLINE_SHORT[d]}</li>)}
          </ul>
        )}
      </div>
      <ol className="pxs-rb__track" style={{ ['--lanes' as string]: ribbon.lanes, ['--lane' as string]: `${LANE}px` }}>
        {ribbon.bars.map((b, i) => {
          const role = byId.get(b.id)
          const align = b.left < 14 ? 'start' : b.left + b.width > 86 ? 'end' : 'mid'
          return (
            <li key={b.id} className="pxs-rb__bar" data-d={b.discipline} data-current={b.current || undefined} data-on={active === b.id || undefined} data-align={align}
              style={{ left: `${b.left}%`, width: `${b.width}%`, top: b.lane * LANE, ['--i' as string]: i }}>
              <a href={`#pxs-${b.id}`} aria-label={`${b.company}, ${b.role}, ${b.range}, ${b.duration}`}>
                <Chip company={b.company} logoUrl={role?.logo_url} small />
                <span className="pxs-rb__name">{b.company}</span>
              </a>
              <span className="pxs-rb__tip" role="tooltip">
                <b>{b.company}</b>
                <span>{b.role}</span>
                <i>{b.range} · {b.duration}</i>
                {b.stat && <em>{b.stat}</em>}
                <u>{DISCIPLINE_LABEL[b.discipline]}</u>
              </span>
            </li>
          )
        })}
        {ribbon.breaks.map((x, i) => <li key={`b${i}`} className="pxs-rb__break" aria-hidden="true" style={{ left: `${x}%` }}>//</li>)}
        {ribbon.ticks.map(t => <li key={t.year} className="pxs-rb__tick" aria-hidden="true" style={{ left: `${t.left}%` }}>{t.year}</li>)}
      </ol>
    </nav>
  )
}
