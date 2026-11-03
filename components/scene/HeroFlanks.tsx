'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Character } from './DesignerScene'
import './designer-scene.css'
import './hero-flanks.css'

// The two margins of the hero scene, so the page reads left to right as a designer's process:
//   01 Research (left)  she interviews a user, jots a sticky note, and it flies to the whiteboard
//   02 Design   (centre) DesignerScene: whiteboard, then the screen
//   03 Ship     (right) the finished screen reaches a phone, goes live, hearts and confetti
// Each side is a 320x400 SVG at the same scale as the centre scene (it is half its width), so the floor lines
// meet. Same puppet as the hero (Character), posed by hero-flanks.css. Decorative: aria-hidden.
// With animate=false or reduced motion each side is one calm frame (the end of its story).

const OUT = '#2a2347'
const FLOOR = 352
const S = 0.85 // her size here, relative to the hero scene
const STAR = 'M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4 Z'
const HEART = 'M0 5 C-11 -5 -7 -14 0 -8 C7 -14 11 -5 0 5 Z'
const CONFETTI = [
  { c: '#e53416', dx: -70, up: -70, dy: 130, rot: 300, d: 0 }, { c: '#ffd34d', dx: -40, up: -96, dy: 150, rot: -260, d: 0.04 },
  { c: '#3fc1c9', dx: -12, up: -110, dy: 160, rot: 220, d: 0.02 }, { c: '#ff9fb4', dx: 16, up: -104, dy: 158, rot: -320, d: 0.06 },
  { c: '#ffd34d', dx: 44, up: -92, dy: 150, rot: 260, d: 0.03 }, { c: '#e53416', dx: 72, up: -66, dy: 128, rot: -280, d: 0.05 },
  { c: '#3fc1c9', dx: -54, up: -50, dy: 112, rot: 200, d: 0.08 }, { c: '#ff9fb4', dx: 58, up: -48, dy: 110, rot: -220, d: 0.09 },
]

/** Her, standing at x, scaled about her feet. */
function Designer({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} ${FLOOR * (1 - S)}) scale(${S})`}>
      <Character />
    </g>
  )
}

/** The user she interviews: the same flat, bold-outline style, a plain figure (not the rig). */
function Person({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} ${FLOOR})`}>
      <ellipse cx="0" cy="0" rx="30" ry="4.5" fill="var(--sc-shadow)" />
      <rect x="-15" y="-54" width="11" height="48" rx="5" fill="#4d6a8a" stroke={OUT} strokeWidth="3" />
      <rect x="4" y="-54" width="11" height="48" rx="5" fill="#4d6a8a" stroke={OUT} strokeWidth="3" />
      <ellipse cx="-9" cy="-4" rx="12" ry="7" fill="#fff" stroke={OUT} strokeWidth="3" />
      <ellipse cx="10" cy="-4" rx="12" ry="7" fill="#fff" stroke={OUT} strokeWidth="3" />
      <rect x="-23" y="-112" width="46" height="64" rx="16" fill="#3fc1c9" stroke={OUT} strokeWidth="3.5" />
      <g transform="translate(0 -112)"><g className="fl-pHead">
        <ellipse cx="0" cy="-34" rx="33" ry="31" fill="#2b2540" stroke={OUT} strokeWidth="3.5" />
        <ellipse cx="0" cy="-29" rx="29" ry="26" fill="#e8b48f" stroke={OUT} strokeWidth="3.5" />
        <path d="M-30 -36 C-30 -62 -12 -64 0 -62 C14 -64 30 -60 30 -36 C22 -48 10 -46 0 -44 C-10 -46 -22 -48 -30 -36 Z" fill="#2b2540" stroke={OUT} strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="-19" cy="-20" rx="5" ry="3" fill="#ff9fb4" opacity=".6" /><ellipse cx="19" cy="-20" rx="5" ry="3" fill="#ff9fb4" opacity=".6" />
        {/* lost: worried brows, flat wobbly mouth */}
        <g className="fl-faceLost" fill="none" stroke={OUT} strokeWidth="3" strokeLinecap="round">
          <ellipse cx="-11" cy="-30" rx="4" ry="5.5" fill={OUT} stroke="none" /><ellipse cx="11" cy="-30" rx="4" ry="5.5" fill={OUT} stroke="none" />
          <path d="M-17 -41 l10 -4 M17 -41 l-10 -4" /><path d="M-7 -13 q3.5 -4 7 0 t7 0" />
        </g>
        {/* delighted: closed happy eyes, open smile */}
        <g className="fl-faceHappy" fill="none" stroke={OUT} strokeWidth="3" strokeLinecap="round">
          <path d="M-17 -29 q6 -8 12 0 M5 -29 q6 -8 12 0" /><path d="M-8 -17 q8 10 16 0 z" fill="#c2415e" strokeWidth="2.4" strokeLinejoin="round" />
        </g>
      </g></g>
      <g transform="translate(-23 -100)"><g className="fl-pArmL">
        <line x1="0" y1="0" x2="0" y2="36" stroke={OUT} strokeWidth="15" strokeLinecap="round" />
        <line x1="0" y1="0" x2="0" y2="36" stroke="#3fc1c9" strokeWidth="9" strokeLinecap="round" />
        <circle cx="0" cy="40" r="7.5" fill="#e8b48f" stroke={OUT} strokeWidth="3" />
      </g></g>
      <g transform="translate(23 -100)"><g className="fl-pArmR">
        <line x1="0" y1="0" x2="0" y2="36" stroke={OUT} strokeWidth="15" strokeLinecap="round" />
        <line x1="0" y1="0" x2="0" y2="36" stroke="#3fc1c9" strokeWidth="9" strokeLinecap="round" />
        <circle cx="0" cy="40" r="7.5" fill="#e8b48f" stroke={OUT} strokeWidth="3" />
      </g></g>
    </g>
  )
}

function Bubble({ x, y, className, children }: { x: number; y: number; className: string; children: React.ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}><g className={className}>
      <path d="M-22 -18 h44 a8 8 0 0 1 8 8 v22 a8 8 0 0 1 -8 8 h-26 l-10 10 l1 -10 h-9 a8 8 0 0 1 -8 -8 v-22 a8 8 0 0 1 8 -8 z" fill="#fff" stroke={OUT} strokeWidth="3" strokeLinejoin="round" />
      {children}
    </g></g>
  )
}

/** The sticky note she writes: the pad between her hands, and the copy that peels off and flies. */
function Note({ fill = '#ffe27a' }: { fill?: string }) {
  return <rect x="-14" y="-14" width="28" height="28" rx="2.5" fill={fill} stroke={OUT} strokeWidth="2.6" />
}

function Scribbles() {
  return (
    <g fill="none" stroke={OUT} strokeWidth="2.2" strokeLinecap="round">
      <path className="fl-s1" d="M-8 -6 h14" pathLength={1} /><path className="fl-s2" d="M-8 1 h9" pathLength={1} /><path className="fl-s3" d="M-8 8 h12" pathLength={1} />
    </g>
  )
}

function Research() {
  const px = 70 // she
  const padX = px + 26 * S, padY = FLOOR - 80 * S * 1.2 // between her hands
  return (
    <svg viewBox="0 0 320 400" xmlns="http://www.w3.org/2000/svg">
      <FloorLine side="left" />
      <Person x={218} />
      <Designer x={px} />
      {/* pad in her hands, scribbled on while she writes */}
      <g transform={`translate(${padX} ${padY})`}>
        <Note />
        <g className="fl-scribble"><Scribbles /></g>
      </g>
      <Bubble x={262} y={132} className="fl-bubbleQ"><text x="0" y="12" textAnchor="middle" fontSize="30" fontWeight="800" fill={OUT}>?</text></Bubble>
      <Bubble x={262} y={132} className="fl-bubbleOk"><path d="M-10 0 l7 8 l14 -16" fill="none" stroke="#2f9e63" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></Bubble>
      {/* the note that peels off and flies to the whiteboard (it starts on the pad) */}
      <g transform={`translate(${padX} ${padY})`}><g className="fl-fly"><g className="fl-flyTurn"><Note /><Scribbles /></g></g></g>
      <g transform="translate(346 214)"><g className="fl-land"><path d={STAR} fill="#ffd34d" stroke={OUT} strokeWidth="1.4" strokeLinejoin="round" /></g></g>
    </svg>
  )
}

function Ship({ uid }: { uid: string }) {
  const px = 64
  const padX = px + 26 * S, padY = FLOOR - 80 * S * 1.2
  const phone = { x: 200, y: 156, w: 100, h: 184 }
  return (
    <svg viewBox="0 0 320 400" xmlns="http://www.w3.org/2000/svg">
      <FloorLine side="right" uid={uid} />
      <Designer x={px} />
      {/* phone on a stand: the finished screen lands here and goes live */}
      <g>
        <ellipse cx={phone.x + phone.w / 2} cy="352" rx="40" ry="5" fill="var(--sc-shadow)" />
        <rect x={phone.x + phone.w / 2 - 4} y={phone.y + phone.h} width="8" height={352 - phone.y - phone.h} fill="#8d88a8" />
        <rect x={phone.x + phone.w / 2 - 30} y="344" width="60" height="8" rx="4" fill="#5b55a0" stroke={OUT} strokeWidth="2.5" />
        <rect x={phone.x} y={phone.y} width={phone.w} height={phone.h} rx="16" fill="#2a2750" stroke={OUT} strokeWidth="4" />
        <rect x={phone.x + 7} y={phone.y + 12} width={phone.w - 14} height={phone.h - 24} rx="8" fill="#fff" />
        <rect x={phone.x + 36} y={phone.y + 4} width="28" height="4" rx="2" fill="#4a4478" />
        <g className="fl-skeleton" fill="#e9e6f7">
          <rect x={phone.x + 15} y={phone.y + 24} width="70" height="9" rx="3" /><rect x={phone.x + 15} y={phone.y + 42} width="70" height="52" rx="5" />
          <rect x={phone.x + 15} y={phone.y + 104} width="54" height="6" rx="3" /><rect x={phone.x + 15} y={phone.y + 116} width="40" height="6" rx="3" />
        </g>
        <g className="fl-ui">
          <rect x={phone.x + 15} y={phone.y + 24} width="70" height="9" rx="3" fill="var(--px-accent)" />
          <rect x={phone.x + 15} y={phone.y + 42} width="70" height="52" rx="5" fill="#cfc9ee" />
          <rect x={phone.x + 15} y={phone.y + 104} width="54" height="6" rx="3" fill="#3a3560" />
          <rect x={phone.x + 15} y={phone.y + 116} width="40" height="6" rx="3" fill="#8d88a8" />
          <rect x={phone.x + 15} y={phone.y + 134} width="70" height="16" rx="8" fill="var(--px-accent)" />
        </g>
        <g transform={`translate(${phone.x + phone.w - 6} ${phone.y - 6})`}><g className="fl-live">
          <rect x="-26" y="-11" width="52" height="22" rx="11" fill="#2f9e63" stroke={OUT} strokeWidth="2.6" />
          <circle cx="-14" cy="0" r="3.6" fill="#fff" />
          <text x="6" y="4.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff" letterSpacing=".6">LIVE</text>
        </g></g>
      </g>
      {/* the finished screen: lifts off the laptop (in the centre scene), is held, then slides into the phone */}
      <g transform={`translate(${padX} ${padY})`}><g className="fl-card"><g className="fl-cardTurn">
        <rect x="-26" y="-19" width="52" height="38" rx="4" fill="#fff" stroke={OUT} strokeWidth="2.6" />
        <rect x="-20" y="-13" width="40" height="6" rx="2" fill="var(--px-accent)" />
        <rect x="-20" y="-3" width="18" height="14" rx="2" fill="#cfc9ee" /><rect x="2" y="-2" width="18" height="3.5" rx="1.7" fill="#3a3560" />
        <rect x="2" y="4" width="13" height="3.5" rx="1.7" fill="#8d88a8" />
      </g></g></g>
      <g stroke={OUT} strokeWidth="1.5" strokeLinejoin="round">
        {[0, 1, 2].map(i => (
          <g key={i} transform={`translate(${phone.x + 26 + i * 24} ${phone.y - 8})`}><g className={`fl-heart fl-heart${i}`}><path d={HEART} fill="#ff6f8f" /></g></g>
        ))}
        {CONFETTI.map((c, i) => (
          <g key={i} transform={`translate(${phone.x + phone.w / 2} ${phone.y + 20})`}>
            <g className="fl-cf" style={{ '--dx': `${c.dx}px`, '--up': `${c.up}px`, '--dy': `${c.dy}px`, '--rot': `${c.rot}deg`, '--d': `${c.d}s` } as React.CSSProperties}>
              {i % 2 ? <rect x="-4" y="-2.5" width="8" height="5" rx="1" fill={c.c} /> : <circle r="3.4" fill={c.c} />}
            </g>
          </g>
        ))}
      </g>
      <g fill="#ffd34d" stroke={OUT} strokeWidth="1.2" strokeLinejoin="round">
        <g transform="translate(318 150) scale(.8)"><path className="fl-sp fl-sp1" d={STAR} /></g>
        <g transform="translate(180 128) scale(.65)"><path className="fl-sp fl-sp2" d={STAR} /></g>
      </g>
    </svg>
  )
}

/** The ground continues the hero scene's floor line and fades out toward the page edge. */
function FloorLine({ side, uid = 'l' }: { side: 'left' | 'right'; uid?: string }) {
  const id = `fl-floor-${side}-${uid.replace(/[^a-zA-Z0-9]/g, '')}`
  const left = side === 'left'
  return (
    <>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={left ? 10 : 310} y1="0" x2={left ? 150 : 170} y2="0">
          <stop offset="0" stopColor="var(--sc-floor)" stopOpacity="0" /><stop offset="1" stopColor="var(--sc-floor)" stopOpacity="1" />
        </linearGradient>
      </defs>
      <line x1={left ? 10 : -16} y1={FLOOR} x2={left ? 336 : 310} y2={FLOOR} stroke={`url(#${id})`} strokeWidth="3" strokeLinecap="round" />
    </>
  )
}

export function HeroFlanks({ animate = true }: { animate?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [play, setPlay] = useState(false)
  const uid = React.useId()

  useEffect(() => {
    const el = ref.current
    if (!el || !animate) return
    const io = new IntersectionObserver(([entry]) => setPlay(entry.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [animate])

  const common = { 'data-motion': animate ? 'on' : 'off', 'data-play': animate && play ? 'true' : 'false' } as const
  return (
    <div ref={ref} className="fl-pair" aria-hidden="true">
      <div className="sc-root fl-root fl-root--left" {...common}><Research /></div>
      <div className="sc-root fl-root fl-root--right" {...common}><Ship uid={uid} /></div>
      <span className="fl-label fl-label--left">01 Research</span>
      <span className="fl-label fl-label--mid">02 Design</span>
      <span className="fl-label fl-label--right">03 Ship</span>
    </div>
  )
}
