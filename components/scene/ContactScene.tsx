'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { Character } from './DesignerScene'
import './designer-scene.css'
import './contact-scene.css'

// The designer from the hero, standing above the "Let's work together" links. She waves now and then;
// hovering or focusing "Get in touch" makes her cheer (jump, arms up, confetti). It is the same puppet
// as DesignerScene, posed and animated by contact-scene.css. Decorative, so hidden from assistive tech.
// perched: she sits on the top edge of the View Resume card (the page positions her, see .pxp-cta__perch), legs
// dangling and swinging, waving, with a soft cast shadow on the card and the wall behind her.
// With animate=false (Motion: Still) or reduced motion she is one calm standing frame.

const OUT = '#2a2347'
const STAR = 'M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4 Z'
const COLORS = ['#e53416', '#ffd34d', '#3fc1c9', '#ff9fb4']
// Where each confetti piece ends up: sideways, rise on the way out, fall, spin, and start delay.
const CONFETTI = [
  { dx: -84, up: -62, dy: 170, rot: 380, d: 0.28 }, { dx: -58, up: -84, dy: 190, rot: -300, d: 0.32 },
  { dx: -30, up: -92, dy: 200, rot: 260, d: 0.3 }, { dx: -8, up: -100, dy: 210, rot: -240, d: 0.36 },
  { dx: 14, up: -96, dy: 205, rot: 320, d: 0.31 }, { dx: 38, up: -90, dy: 195, rot: -360, d: 0.34 },
  { dx: 62, up: -80, dy: 185, rot: 280, d: 0.29 }, { dx: 86, up: -60, dy: 168, rot: -340, d: 0.33 },
  { dx: -46, up: -50, dy: 150, rot: 220, d: 0.4 }, { dx: 50, up: -48, dy: 150, rot: -200, d: 0.42 },
]

export function ContactScene({ animate = true, perched = false }: { animate?: boolean; perched?: boolean }) {
  const shadowId = `cta-shadow-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const ref = useRef<HTMLDivElement>(null)
  const [play, setPlay] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !animate) return
    const io = new IntersectionObserver(([entry]) => setPlay(entry.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [animate])

  return (
    <div ref={ref} className={`sc-root cta-root${perched ? ' cta-root--perch' : ''}`} data-motion={animate ? 'on' : 'off'} data-play={animate && play ? 'true' : 'false'} aria-hidden="true">
      <svg viewBox="-110 76 220 284" xmlns="http://www.w3.org/2000/svg">
        {perched && (
          <>
            <defs>
              {/* flat dark silhouette, softened: the shadow is the character itself, so it follows every pose */}
              <filter id={shadowId} x="-30%" y="-20%" width="160%" height="150%">
                <feColorMatrix type="matrix" values="0 0 0 0 .12  0 0 0 0 .09  0 0 0 0 .24  0 0 0 1 0" />
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>
            <ellipse cx="0" cy="288" rx="30" ry="3.6" fill="#1b1538" opacity=".22" />
            <g className="cta-cast" filter={`url(#${shadowId})`} opacity=".26" transform="translate(9 6)"><Character seated /></g>
          </>
        )}
        <Character seated={perched} />
        <g className="cta-sparkles" fill="#ffd34d" stroke={OUT} strokeWidth="1.2" strokeLinejoin="round">
          <g transform="translate(-78 150)"><path className="sc-sp1" d={STAR} /></g>
          <g transform="translate(80 140) scale(.8)"><path className="sc-sp2" d={STAR} /></g>
          <g transform="translate(74 230) scale(.65)"><path className="sc-sp3" d={STAR} /></g>
          <g transform="translate(-72 236) scale(.7)"><path className="sc-sp2" d={STAR} /></g>
        </g>
        <g stroke={OUT} strokeWidth="1.4">
          {CONFETTI.map((c, i) => (
            <g key={i} transform="translate(0 150)">
              <g className="cta-cf" style={{ '--dx': `${c.dx}px`, '--up': `${c.up}px`, '--dy': `${c.dy}px`, '--rot': `${c.rot}deg`, '--d': `${c.d}s` } as React.CSSProperties}>
                {i % 2 ? <rect x="-4" y="-2.5" width="8" height="5" rx="1" fill={COLORS[i % 4]} /> : <circle r="3.4" fill={COLORS[i % 4]} />}
              </g>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
