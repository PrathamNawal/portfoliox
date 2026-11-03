'use client'

import React, { useEffect, useRef, useState } from 'react'

// Wayfinding for a case study: a sticky chapter list beside the text (wide screens) or a compact "3 of 6" bar with a
// jump menu (narrow). Both highlight the chapter being read. Styles: "Case study" in app/themes.css.

export interface Chapter { id: string; title: string }

export function CaseRail({ chapters, animate = false }: { chapters: Chapter[]; animate?: boolean }) {
  const [active, setActive] = useState(chapters[0]?.id ?? '')
  const menu = useRef<HTMLDetailsElement>(null)
  const rail = useRef<HTMLElement>(null)

  // The rail's line fills as the reader moves through the chapters (--p, 0 to 1). Not with reduced motion or animation off.
  useEffect(() => {
    const aside = rail.current
    const main = document.querySelector<HTMLElement>('.px-cs__main')
    if (!animate || !aside || !main || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const update = () => {
      frame = 0
      const r = main.getBoundingClientRect()
      // 0 as the chapters reach 45% down the screen, 1 when the page ends (the page keeps ~120px of padding below them)
      const p = (window.innerHeight * 0.45 - r.top) / Math.max(1, r.height - window.innerHeight * 0.55 + 120)
      aside.style.setProperty('--p', String(Math.min(1, Math.max(0, p))))
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (frame) cancelAnimationFrame(frame) }
  }, [animate])

  useEffect(() => {
    const els = chapters.map(c => document.getElementById(`cs-${c.id}`)).filter((e): e is HTMLElement => !!e)
    if (!els.length) return
    const io = new IntersectionObserver(entries => {
      // the chapter whose heading is highest above the reading line wins
      const seen = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (seen) setActive(seen.target.id.replace(/^cs-/, ''))
    }, { rootMargin: '-15% 0px -70% 0px' })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [chapters])

  const jump = (e: React.MouseEvent, id: string) => {
    const el = document.getElementById(`cs-${id}`)
    if (!el) return
    e.preventDefault()
    el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
    setActive(id)
    if (menu.current) menu.current.open = false
  }

  const at = Math.max(0, chapters.findIndex(c => c.id === active))
  if (chapters.length < 2) return null
  return (
    <>
      <details className="px-cs__bar" ref={menu}>
        <summary><b>{String(at + 1).padStart(2, '0')}</b> <span>{chapters[at]?.title}</span><i aria-hidden="true">{at + 1} / {chapters.length}</i></summary>
        <ol>{chapters.map((c, i) => <li key={c.id}><a href={`#cs-${c.id}`} onClick={e => jump(e, c.id)} data-on={c.id === active || undefined}><b>{String(i + 1).padStart(2, '0')}</b>{c.title}</a></li>)}</ol>
      </details>
      <aside className="px-cs__rail" aria-label="Chapters" ref={rail}>
        <p>In this case study</p>
        <ol>{chapters.map((c, i) => <li key={c.id}><a href={`#cs-${c.id}`} onClick={e => jump(e, c.id)} data-on={c.id === active || undefined} aria-current={c.id === active ? 'location' : undefined}><b>{String(i + 1).padStart(2, '0')}</b>{c.title}</a></li>)}</ol>
      </aside>
    </>
  )
}
