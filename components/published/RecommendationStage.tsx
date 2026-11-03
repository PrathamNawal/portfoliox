'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { formatRange } from '@/lib/experience'
import { matchRole, segments, signalCounts } from '@/lib/recs'
import type { Testimonial, WorkExperience } from '@/types'

// Recommendations as evidence. One quote is shown large with the phrase that carries the claim underlined, the
// claims across all recommendations are counted in a strip above, and each quote names the role it belongs to
// (linked to that chapter when the story layout is on). The other recommendations are a row of people to pick from;
// with Motion on they advance on their own (progress bar on the active person) until the reader chooses one or
// hovers. Used for small sets: a long list stays a marquee. Styles: "Recommendations" in app/themes.css.

const ADVANCE_MS = 9000

export function RecommendationStage({ testimonials, roles, linkRoles, animate }: { testimonials: Testimonial[]; roles: WorkExperience[]; linkRoles: boolean; animate: boolean }) {
  const [active, setActive] = useState(0)
  const [prefer, setPrefer] = useState<string | null>(null)
  const [chosen, setChosen] = useState(false)
  const [reduced, setReduced] = useState(false)
  const n = testimonials.length

  useEffect(() => { setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches) }, [])

  const select = useCallback((i: number, byUser = true) => {
    setActive(i)
    if (byUser) setChosen(true)
  }, [])

  // #rec-<id> (from a role in the timeline) opens that recommendation
  useEffect(() => {
    const go = () => {
      const m = window.location.hash.match(/^#rec-(.+)$/)
      if (!m) return
      const i = testimonials.findIndex(t => t.id === decodeURIComponent(m[1]))
      if (i >= 0) { select(i); document.getElementById('pxp-rec')?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }) }
    }
    go()
    window.addEventListener('hashchange', go)
    return () => window.removeEventListener('hashchange', go)
  }, [testimonials, select, reduced])

  const signals = useMemo(() => signalCounts(testimonials), [testimonials])
  const t = testimonials[active]
  const role = useMemo(() => matchRole(t, roles), [t, roles])
  const parts = useMemo(() => segments(t.quote, prefer && signals.some(s => s.id === prefer) ? prefer : null), [t, prefer, signals])
  const auto = animate && !reduced && !chosen && n > 1

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = (active + (e.key === 'ArrowRight' ? 1 : n - 1)) % n
    select(next)
    document.getElementById(`pxp-rec-tab-${next}`)?.focus()
  }

  return (
    <div className="pxp-rec" id="pxp-rec" data-motion={animate && !reduced ? 'on' : 'off'} data-pick={prefer && signals.some(s => s.id === prefer) ? '' : undefined}>
      {signals.length > 0 && (
        <div className="pxp-rec__signals" role="group" aria-label="What people say about working with her">
          <span className="pxp-rec__signals-label">What people say</span>
          <ul>
            {signals.map(s => (
              <li key={s.id}>
                <button type="button" aria-pressed={prefer === s.id} data-on={prefer === s.id || undefined}
                  onClick={() => { setPrefer(p => (p === s.id ? null : s.id)); if (s.first !== active) select(s.first) ; else setChosen(true) }}>
                  {s.label}{s.count > 1 && <b>{s.count}</b>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <figure className="pxp-rec__card" key={t.id} role="tabpanel" id="pxp-rec-panel" aria-labelledby={`pxp-rec-tab-${active}`}>
        <blockquote className="pxp-rec__quote">
          &ldquo;{parts.map((p, i) => p.hl ? <mark key={i} className="pxp-rec__hl">{p.text}</mark> : <React.Fragment key={i}>{p.text}</React.Fragment>)}&rdquo;
        </blockquote>
        <figcaption className="pxp-rec__by">
          {t.photo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img className="pxp-rec__photo" src={t.photo_url} alt="" />
            : <span className="pxp-rec__photo pxp-rec__photo--fallback" aria-hidden="true">{t.name[0]}</span>}
          <span className="pxp-rec__who">
            <b>{t.name}</b>
            <span>{t.title_and_company}</span>
          </span>
          <span className="pxp-rec__meta">
            {role && (linkRoles
              ? <a className="pxp-rec__role" href={`#pxs-${role.id}`}>{role.company} · {role.role} · {formatRange(role)}</a>
              : <span className="pxp-rec__role">{role.company} · {role.role} · {formatRange(role)}</span>)}
            {t.linkedin_url && <a className="pxp-rec__li" href={t.linkedin_url} target="_blank" rel="noreferrer">View on LinkedIn ↗</a>}
          </span>
        </figcaption>
      </figure>

      {n > 1 && (
        <div className="pxp-rec__tabs" role="tablist" aria-label="Recommendations" onKeyDown={onKey}>
          {testimonials.map((x, i) => (
            <button key={x.id} id={`pxp-rec-tab-${i}`} type="button" role="tab" aria-selected={i === active} aria-controls="pxp-rec-panel" tabIndex={i === active ? 0 : -1}
              className="pxp-rec__tab" data-on={i === active || undefined} onClick={() => select(i)}>
              {x.photo_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={x.photo_url} alt="" />
                : <span className="pxp-rec__tabph" aria-hidden="true">{x.name[0]}</span>}
              <span><b>{x.name}</b><i>{x.title_and_company}</i></span>
              {i === active && <u className={auto ? 'is-timing' : ''} style={{ ['--ms' as string]: `${ADVANCE_MS}ms` }} onAnimationEnd={() => auto && select((active + 1) % n, false)} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
