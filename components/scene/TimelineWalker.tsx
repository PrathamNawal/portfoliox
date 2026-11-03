'use client'

import React, { useEffect, useRef } from 'react'
import { Character } from './DesignerScene'
import './designer-scene.css'
import './timeline-walker.css'

// The designer from the hero, walking down the Work Experience rail as the reader scrolls. She stands
// where the fill line ends (60% down the viewport), walks while the page scrolls, and when she passes a
// job's dot she hops, the "!" pops and she looks happy. Same puppet as DesignerScene, posed and animated
// by timeline-walker.css. It is an <li> inside the .pxs-timeline <ol> it is given (position: relative) and
// writes --wy (her feet, in px from the top of the timeline) so the fill line can follow her.
// Decorative: aria-hidden. Not mounted for Motion: Still or reduced motion.

const FEET = 12 / 280 // her soles sit 12 of the viewBox's 280 units above its bottom edge
const IDLE_MS = 160 // scroll pause after which she stops walking
const HOP_MS = 950

export function TimelineWalker({ timeline }: { timeline: React.RefObject<HTMLOListElement | null> }) {
  const root = useRef<HTMLLIElement>(null)

  useEffect(() => {
    const tl = timeline.current
    const el = root.current
    if (!tl || !el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    tl.setAttribute('data-walker', '')

    let frame = 0
    let idle = 0
    let hopOff = 0
    let lastY = NaN
    let lastIdx = -1
    let flip = false
    let nodes: number[] = []

    // Dot centre of each chapter, in px from the top of the timeline (the dot is 16px, 10px below the chapter top).
    const measure = () => {
      nodes = Array.from(tl.querySelectorAll<HTMLElement>(':scope > .pxs-chapter')).map(c => c.offsetTop + 18)
    }

    const update = () => {
      frame = 0
      if (!nodes.length) return
      const r = tl.getBoundingClientRect()
      const y = Math.min(nodes[nodes.length - 1], Math.max(nodes[0], window.innerHeight * 0.6 - r.top))
      tl.style.setProperty('--wy', `${y}px`)
      const h = el.offsetHeight
      el.style.transform = `translateY(${y - h * (1 - FEET)}px)`
      const idx = nodes.filter(n => n <= y + 0.5).length
      if (lastIdx >= 0 && idx !== lastIdx) {
        flip = !flip
        el.setAttribute('data-hop', flip ? 'a' : 'b')
        window.clearTimeout(hopOff)
        hopOff = window.setTimeout(() => el.removeAttribute('data-hop'), HOP_MS)
      }
      lastIdx = idx
      if (!Number.isNaN(lastY) && Math.abs(y - lastY) > 0.2) {
        el.setAttribute('data-walking', 'true')
        window.clearTimeout(idle)
        idle = window.setTimeout(() => el.setAttribute('data-walking', 'false'), IDLE_MS)
      }
      lastY = y
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    const onResize = () => { measure(); onScroll() }

    measure()
    update()
    const io = new IntersectionObserver(([entry]) => el.setAttribute('data-play', entry.isIntersecting ? 'true' : 'false'), { threshold: 0 })
    io.observe(tl)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    // Fonts and screenshots change the chapters' heights after mount.
    const ro = new ResizeObserver(onResize)
    ro.observe(tl)
    return () => {
      tl.removeAttribute('data-walker')
      tl.style.removeProperty('--wy')
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      io.disconnect()
      ro.disconnect()
      if (frame) cancelAnimationFrame(frame)
      window.clearTimeout(idle)
      window.clearTimeout(hopOff)
    }
  }, [timeline])

  return (
    <li ref={root} className="sc-root wk-root" data-motion="on" data-play="false" data-walking="false" aria-hidden="true">
      <svg viewBox="-60 84 130 280" xmlns="http://www.w3.org/2000/svg">
        <Character />
      </svg>
    </li>
  )
}
