'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import dynamic from 'next/dynamic'
import { durationMonths, formatDuration, formatRange, highlightMetrics } from '@/lib/experience'
import { startYear } from '@/lib/experience-story'
import { layoutRibbon } from '@/lib/career-ribbon'
import { beatOf, bulletsOf, inOrder, skillsAdded, stopAt } from '@/lib/climb'
import { proofsByRole } from '@/lib/recs'
import { Chip } from './StoryChip'
import { Exhibit, Lightbox, Proof } from './ExperienceParts'
import type { ExperienceScreen, Testimonial, WorkExperience } from '@/types'
import './experience-climb.css'

// Work Experience as a climb. On a wide screen with motion on, the section pins and the reader scrolls along a path:
// the designer walks from the first job to the current one, each stop brings that role's card in, and the toolkit
// strip gains the skills the role added. Everywhere else (phones, Motion: Still, reduced motion, before the script
// runs) the same cards are an ordinary stacked list. Roles are read for their lead, number and skills by lib/climb.

const ClimbWalker = dynamic(() => import('@/components/scene/ClimbWalker').then(m => m.ClimbWalker))

const PIN_QUERY = '(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)'
const STICK = 64 // px: the site header the pinned stage sits under (matches top in experience-climb.css)
const LEAD_IN = 0.04 // share of the pinned scroll before the walk starts and after it ends
const IDLE_MS = 160
const HOP_MS = 950

type Vars = CSSProperties & Record<`--${string}`, string | number>

export function ExperienceClimb({ experience, walker = false, animate = false, testimonials = [] }: { experience: WorkExperience[]; walker?: boolean; animate?: boolean; testimonials?: Testimonial[] }) {
  const roles = useMemo(() => inOrder(experience), [experience])
  const n = roles.length
  const summary = useMemo(() => layoutRibbon(roles), [roles])
  const beats = useMemo(() => roles.map(beatOf), [roles])
  const added = useMemo(() => skillsAdded(roles), [roles])
  const proofs = useMemo(() => proofsByRole(testimonials, roles), [testimonials, roles])

  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [pin, setPin] = useState(false)
  const [active, setActive] = useState(n - 1)
  const [detail, setDetail] = useState(false)
  const [lightbox, setLightbox] = useState<{ index: number; start: number } | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  // pinned only while the screen and the reader's settings allow it
  useEffect(() => {
    if (!animate || n < 2) return
    const mq = window.matchMedia(PIN_QUERY)
    const sync = () => setPin(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [animate, n])

  const spanOf = useCallback(() => {
    const t = track.current
    const stage = t?.firstElementChild as HTMLElement | null
    if (!t || !stage) return { top: 0, span: 1 }
    return { top: t.getBoundingClientRect().top + window.scrollY, span: Math.max(1, t.offsetHeight - stage.offsetHeight) }
  }, [])

  const jump = useCallback((index: number) => {
    const { top, span } = spanOf()
    const p = n > 1 ? index / (n - 1) : 0
    const y = top - STICK + (LEAD_IN + p * (1 - 2 * LEAD_IN)) * span + 1
    window.scrollTo({ top: y, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [n, spanOf])

  // The walk: page scroll over the pinned stretch -> --cp (0..1 along the path), the active role, hop and walking pose.
  useEffect(() => {
    const el = root.current
    const t = track.current
    if (!pin || !el || !t) return
    let frame = 0
    let idle = 0
    let hopOff = 0
    let lastX = NaN
    let lastIndex = -1
    let flip = false
    const walkerEl = () => el.querySelector<HTMLElement>('.pxc-walker')
    const update = () => {
      frame = 0
      const r = t.getBoundingClientRect()
      const span = Math.max(1, t.offsetHeight - (t.firstElementChild as HTMLElement).offsetHeight)
      const raw = (STICK - r.top) / span
      const p = Math.min(1, Math.max(0, (raw - LEAD_IN) / (1 - 2 * LEAD_IN)))
      const { x, index } = stopAt(p, n)
      el.style.setProperty('--cp', x.toFixed(4))
      const w = walkerEl()
      if (index !== lastIndex) {
        setActive(index)
        setDetail(false)
        if (lastIndex >= 0 && w) {
          flip = !flip
          w.setAttribute('data-hop', flip ? 'a' : 'b')
          window.clearTimeout(hopOff)
          hopOff = window.setTimeout(() => w.removeAttribute('data-hop'), HOP_MS)
        }
        lastIndex = index
      }
      if (w && !Number.isNaN(lastX) && Math.abs(x - lastX) > 0.0004) {
        w.setAttribute('data-walking', 'true')
        window.clearTimeout(idle)
        idle = window.setTimeout(() => w.setAttribute('data-walking', 'false'), IDLE_MS)
      }
      lastX = x
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    // the walker only plays while the pinned stage is on screen
    const io = new IntersectionObserver(([entry]) => walkerEl()?.setAttribute('data-play', entry.isIntersecting ? 'true' : 'false'))
    io.observe(t)
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      io.disconnect()
      if (frame) cancelAnimationFrame(frame)
      window.clearTimeout(idle)
      window.clearTimeout(hopOff)
      el.style.removeProperty('--cp')
    }
  }, [pin, n])

  // Links to #pxs-<role> (the recommendation's role chip) go to that stop instead of a card hidden behind the stage.
  useEffect(() => {
    if (!pin) return
    const go = (id: string) => {
      const i = roles.findIndex(r => `pxs-${r.id}` === id)
      if (i < 0) return false
      jump(i)
      return true
    }
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#pxs-"]')
      if (!a || !go((a.getAttribute('href') ?? '').slice(1))) return
      e.preventDefault()
    }
    document.addEventListener('click', onClick)
    if (window.location.hash.indexOf('#pxs-') === 0) window.setTimeout(() => go(window.location.hash.slice(1)), 60)
    return () => document.removeEventListener('click', onClick)
  }, [pin, roles, jump])

  const show = (roleIndex: number, start: number, opener: HTMLElement) => {
    openerRef.current = opener
    setLightbox({ index: roleIndex, start })
  }
  const close = useCallback(() => {
    setLightbox(null)
    openerRef.current?.focus()
  }, [])

  if (!n) return null
  const year = startYear(roles[active].start_month) ?? ''
  const toolkit = added.slice(0, active + 1)

  const stage = (
    <>
      <div className="pxc-head">
        <div>
          <h3 className="pxc-title">{summary.headline}</h3>
          {summary.experience && <p className="pxc-exp">{summary.experience} of experience</p>}
        </div>
        {pin && year && <div className="pxc-year" aria-hidden="true"><span key={year}>{year}</span></div>}
      </div>

      {pin && (
        <div className="pxc-path">
          <div className="pxc-rail">
            <div className="pxc-walkzone">
              {walker ? <ClimbWalker /> : <span className="pxc-pinmark" />}
            </div>
            <div className="pxc-line" />
            <ol className="pxc-stones">
              {roles.map((r, i) => (
                <li key={r.id} style={{ left: `${n > 1 ? (i / (n - 1)) * 100 : 0}%` }} data-state={i < active ? 'past' : i === active ? 'now' : 'next'}>
                  <button type="button" onClick={() => jump(i)} aria-label={`${r.role}, ${r.company}`} aria-current={i === active ? 'step' : undefined}>
                    <span className="pxc-dot" />
                    <span className="pxc-stone-co">{r.company}</span>
                    <span className="pxc-stone-yr">{startYear(r.start_month)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <ol className="pxc-cards">
        {roles.map((r, i) => {
          const beat = beats[i]
          const proof = proofs.get(r.id)?.[0]
          const screens = (Array.isArray(r.screens) ? r.screens : []) as ExperienceScreen[]
          const bullets = bulletsOf(r.description)
          const pos = !pin ? undefined : i < active ? 'before' : i === active ? 'current' : 'after'
          const open = pin && i === active && detail
          return (
            <li key={r.id} id={`pxs-${r.id}`} className="pxc-card" data-pos={pos} data-open={open ? '' : undefined} data-current={r.is_current ? '' : undefined} aria-label={`${r.role}, ${r.company}`}>
              <div className="pxc-who">
                <Chip company={r.company} logoUrl={r.logo_url} />
                <div className="pxc-id">
                  <p className="pxc-company">{r.company}{r.is_current && <em>Now</em>}</p>
                  <p className="pxc-role">{r.role}</p>
                </div>
                <p className="pxc-when"><b>{formatRange(r)}</b><span>{formatDuration(durationMonths(r))}</span></p>
              </div>

              <div className="pxc-body" data-two={proof ? '' : undefined}>
                <div className="pxc-main">
                  {beat.lead && <p className="pxc-lead">{beat.lead}</p>}
                  {beat.highlight && (
                    <p className="pxc-num"><b>{beat.highlight.value}</b>{beat.highlight.text && <span>{beat.highlight.text}</span>}</p>
                  )}
                </div>
                {proof && <Proof t={proof} />}
              </div>

              {open && bullets.length > 0 && (
                <div className="pxc-detail pxp-exp-desc" dangerouslySetInnerHTML={{ __html: highlightMetrics(r.description ?? '') }} />
              )}

              {!pin && screens.length > 0 && <Exhibit screens={screens} featured={false} role={r.role} onOpen={(k, el) => show(i, k, el)} />}

              <div className="pxc-foot">
                {added[i].length > 0 && (
                  <ul className="pxc-adds" aria-label="Skills this role added">
                    {added[i].map(s => <li key={s}>{s}</li>)}
                  </ul>
                )}
                <div className="pxc-actions">
                  {bullets.length > 0 && pin && (
                    <button type="button" onClick={() => setDetail(d => !d)} aria-expanded={open} tabIndex={i === active ? 0 : -1}>{open ? 'Back' : 'Details'}</button>
                  )}
                  {pin && screens.length > 0 && (
                    <button type="button" tabIndex={i === active ? 0 : -1} onClick={e => show(i, 0, e.currentTarget)}>Screens · {screens.length}</button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {pin && (
        <div className="pxc-skills">
          <span className="pxc-skills__label">Toolkit</span>
          <ul>
            {toolkit.map((list, i) => list.map(s => <li key={s} data-new={i === active ? '' : undefined}>{s}</li>))}
          </ul>
        </div>
      )}
    </>
  )

  return (
    <div className="pxc pxs" ref={root} data-mode={pin ? 'pin' : 'list'} data-motion={animate ? 'on' : 'off'} style={{ '--n': n } as Vars}>
      {pin ? (
        <div className="pxc-track" ref={track}>
          <div className="pxc-stage">{stage}</div>
        </div>
      ) : stage}
      {lightbox && <Lightbox screens={(roles[lightbox.index]?.screens ?? []) as ExperienceScreen[]} start={lightbox.start} onClose={close} />}
    </div>
  )
}
