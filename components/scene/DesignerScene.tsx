'use client'

import React, { useEffect, useRef, useState } from 'react'
import './designer-scene.css'

// A looping illustration of a designer's day: she sketches a flow on the whiteboard, walks to her
// desk, and designs the screen on her laptop. Pure inline SVG + CSS (no images, no JS animation).
//
//  - Colours come from the theme (outfit and accents use --px-accent), so it fits every theme.
//  - Plays only while on screen. Reduced motion shows one calm frame: at the desk, board filled.
//  - ?freeze (0..1) pins a moment of the 18s loop, for screenshots and tests.
//  - Rotating parts never carry a transform attribute: CSS animates the inner <g>, and the
//    parent <g transform> only places it. (A CSS transform replaces the attribute.)

const HAIR = '#2d2a5e'
const HAIR_HI = '#4b46a1'
const SKIN = '#ffd9c7'
const SKIN_SH = '#f2bfa8'
const PANTS = '#3a3560'
const INK = '#3a3560'

interface Props {
  /** 0..1: pin the animation at this point of the loop (paused). Omit to play. */
  freeze?: number
  className?: string
  label?: string
}

export function DesignerScene({ freeze, className, label = 'Illustration: a designer sketches a flow on a whiteboard, then walks to her desk and designs the screen on her laptop.' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [play, setPlay] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || freeze !== undefined) return
    const io = new IntersectionObserver(([entry]) => setPlay(entry.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [freeze])

  const frozen = freeze !== undefined
  return (
    <div
      ref={ref}
      className={`sc-root${className ? ` ${className}` : ''}`}
      data-play={frozen ? 'false' : play ? 'true' : 'false'}
      data-frozen={frozen ? 'true' : undefined}
      style={frozen ? ({ '--sc-delay': `${-(freeze as number) * 18}s` } as React.CSSProperties) : undefined}
    >
      <svg viewBox="0 0 640 400" role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg">
        {/* floor */}
        <line x1="8" y1="352" x2="632" y2="352" stroke="var(--sc-floor)" strokeWidth="3" strokeLinecap="round" />

        <Whiteboard />
        <Desk />

        {/* four poses of the same character; CSS shows one at a time */}
        <g transform="translate(290 352)"><g className="sc-stand"><Standing /></g></g>
        <g transform="translate(290 352)"><g className="sc-walk-r"><Walking look={3} /></g></g>
        <g transform="translate(290 352)"><g className="sc-walk-l"><Walking look={-3} /></g></g>
        <g transform="translate(425 352)"><g className="sc-sit"><Sitting /></g></g>

        <Sparkles />
      </svg>
    </div>
  )
}

/* ── Props in the room ─────────────────────────────────────────────────── */

function Whiteboard() {
  const p = { fill: 'none', stroke: INK, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, pathLength: 1 }
  return (
    <g>
      <line x1="72" y1="256" x2="62" y2="352" stroke="#8d88a8" strokeWidth="5" strokeLinecap="round" />
      <line x1="214" y1="256" x2="224" y2="352" stroke="#8d88a8" strokeWidth="5" strokeLinecap="round" />
      <rect x="36" y="66" width="214" height="186" rx="8" fill="var(--sc-board)" stroke={INK} strokeWidth="4" />
      <rect x="58" y="252" width="170" height="8" rx="3" fill="#b9b4cf" />
      <rect x="190" y="245" width="26" height="7" rx="3" fill="var(--px-accent)" />
      <g className="sc-board">
        <path className="sc-b1" d="M58 98 q9 -10 18 0 t18 0 t18 0 t18 0 t18 0" {...p} />
        <path className="sc-b2" d="M58 124 h56 v36 h-56 z" {...p} />
        <path className="sc-b3" d="M114 142 h24 M131 135 l8 7 l-8 7" {...p} />
        <path className="sc-b4" d="M142 124 h56 v36 h-56 z" {...p} stroke="var(--px-accent)" />
        <path className="sc-b5" d="M86 160 v22 M79 175 l7 8 l7 -8" {...p} />
        <path className="sc-b6" d="M58 186 h56 v36 h-56 z" {...p} />
        <path className="sc-b7" d="M114 204 h24 M131 197 l8 7 l-8 7" {...p} />
        <path className="sc-b8" d="M142 186 h56 v36 h-56 z" {...p} />
        <path className="sc-b9" d="M203 100 a11 11 0 1 1 22 0 c0 6 -5 8 -5 13 h-12 c0 -5 -5 -7 -5 -13 z M208 119 h12" {...p} />
        <path className="sc-b10" d="M214 80 v-7 M232 87 l5 -5 M236 106 l7 2 M196 87 l-5 -5" {...p} />
        <g className="sc-sticky">
          <rect x="204" y="132" width="30" height="30" rx="2" fill="#ffe27a" transform="rotate(6 219 147)" />
          <path d="M210 142 h18 M210 149 h13" stroke={INK} strokeWidth="2" strokeLinecap="round" transform="rotate(6 219 147)" />
        </g>
      </g>
    </g>
  )
}

function Desk() {
  return (
    <g>
      {/* chair */}
      <rect x="386" y="226" width="9" height="72" rx="4" fill="#5b55a0" />
      <rect x="392" y="289" width="64" height="9" rx="4" fill="#5b55a0" />
      <rect x="419" y="298" width="5" height="46" rx="2" fill="#8d88a8" />
      <path d="M398 349 h46" stroke="#8d88a8" strokeWidth="5" strokeLinecap="round" />
      {/* desk */}
      <rect x="448" y="284" width="7" height="68" rx="2" fill="var(--sc-wood-dark)" />
      <rect x="616" y="284" width="7" height="68" rx="2" fill="var(--sc-wood-dark)" />
      <rect x="438" y="274" width="196" height="10" rx="3" fill="var(--sc-wood)" />
      {/* laptop */}
      <path d="M468 268 h124 l8 6 h-140 z" fill="#b9b4cf" />
      <rect x="478" y="186" width="104" height="82" rx="6" fill="#2a2750" />
      <rect x="484" y="192" width="92" height="70" rx="3" fill="#fff" />
      <g className="sc-ui">
        <rect className="sc-u1" x="490" y="198" width="80" height="9" rx="2" fill="var(--px-accent)" />
        <rect className="sc-u2" x="490" y="212" width="38" height="30" rx="3" fill="#cfc9ee" />
        <rect className="sc-u3" x="534" y="214" width="36" height="4" rx="2" fill="#3a3560" />
        <rect className="sc-u4" x="534" y="222" width="28" height="4" rx="2" fill="#8d88a8" />
        <rect className="sc-u5" x="534" y="232" width="22" height="8" rx="4" fill="var(--px-accent)" />
        <rect className="sc-u6" x="490" y="246" width="24" height="12" rx="2" fill="#e9e6f7" />
        <rect className="sc-u7" x="518" y="246" width="24" height="12" rx="2" fill="#e9e6f7" />
        <rect className="sc-u8" x="546" y="246" width="24" height="12" rx="2" fill="#e9e6f7" />
        <g className="sc-cursor"><path d="M0 0 l0 12 l3.5 -3 l3 6.5 l2.2 -1 l-3 -6.5 l4.5 -.5 z" fill="#1c1840" stroke="#fff" strokeWidth="1" transform="translate(500 214)" /></g>
      </g>
      {/* mug + plant */}
      <rect x="592" y="253" width="14" height="17" rx="3" fill="#fff" stroke={INK} strokeWidth="2" />
      <path d="M606 257 q7 0 7 6 q0 5 -7 5" fill="none" stroke={INK} strokeWidth="2" />
      <path className="sc-steam" d="M596 246 q-3 -5 0 -9 q3 -4 0 -8" fill="none" stroke="#b9b4cf" strokeWidth="2" strokeLinecap="round" />
      <rect x="612" y="256" width="16" height="18" rx="3" fill="var(--px-accent)" />
      <path d="M620 256 q-12 -10 -8 -24 q10 6 8 24 M620 256 q10 -12 18 -16 q0 12 -18 16 M620 256 q-1 -14 4 -22 q6 10 -4 22" fill="#5fb48a" />
    </g>
  )
}

function Sparkles() {
  const star = 'M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4 Z'
  return (
    <g className="sc-sparkles" fill="#ffd34d">
      <g transform="translate(596 178)"><path className="sc-sp1" d={star} /></g>
      <g transform="translate(470 172) scale(.7)"><path className="sc-sp2" d={star} /></g>
      <g transform="translate(604 214) scale(.6)"><path className="sc-sp3" d={star} /></g>
    </g>
  )
}

/* ── The character (front-facing, anime proportions: big head and eyes) ──── */

function Head({ look = 0, tilt = 0 }: { look?: number; tilt?: number }) {
  return (
    <g className="sc-head">
      <g transform={`rotate(${tilt})`}>
        <path d="M-34 -4 C-38 -40 -18 -49 0 -49 C18 -49 38 -40 34 -4 C37 24 31 44 23 54 L-23 54 C-31 44 -37 24 -34 -4 Z" fill={HAIR} />
        <rect x="-6" y="22" width="12" height="16" rx="4" fill={SKIN_SH} />
        <ellipse cx="-25" cy="6" rx="4" ry="6" fill={SKIN} />
        <ellipse cx="25" cy="6" rx="4" ry="6" fill={SKIN} />
        <ellipse cx="0" cy="2" rx="25" ry="28" fill={SKIN} />
        <g className="sc-eyes">
          {[-10, 10].map(x => (
            <g key={x} transform={`translate(${x} 4)`}>
              <ellipse rx="7" ry="9" fill="#fff" />
              <g transform={`translate(${look * 0.6} 0)`}>
                <ellipse rx="5.2" ry="7.4" fill="var(--sc-eye)" />
                <ellipse rx="2.4" ry="4" fill="#1c1840" />
                <circle cx="-1.6" cy="-2.6" r="2" fill="#fff" />
                <circle cx="1.8" cy="3" r="1" fill="#fff" />
              </g>
              <path d="M-7.5 -3 Q0 -10 7.5 -3" fill="none" stroke={HAIR} strokeWidth="2.2" strokeLinecap="round" />
            </g>
          ))}
        </g>
        <path d="M-17 -12 Q-10 -16 -4 -12 M4 -12 Q10 -16 17 -12" fill="none" stroke={HAIR} strokeWidth="1.6" strokeLinecap="round" />
        <ellipse cx="-16" cy="16" rx="5" ry="2.6" fill="#ff9fb0" opacity=".5" />
        <ellipse cx="16" cy="16" rx="5" ry="2.6" fill="#ff9fb0" opacity=".5" />
        <path d="M-3 19 Q0 22 3 19" fill="none" stroke="#b04a5a" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M-28 -4 C-30 -32 -12 -44 2 -43 C18 -44 30 -30 28 -4 L22 -14 L16 -2 L8 -18 L0 -2 L-8 -18 L-14 -2 L-22 -14 Z" fill={HAIR} />
        <path d="M-28 -4 C-31 14 -29 30 -24 40 L-17 28 C-20 14 -22 4 -22 -6 Z M28 -4 C31 14 29 30 24 40 L17 28 C20 14 22 4 22 -6 Z" fill={HAIR} />
        <path d="M-14 -34 C-6 -40 6 -40 14 -34" fill="none" stroke={HAIR_HI} strokeWidth="3" strokeLinecap="round" opacity=".7" />
        <g transform="translate(0 -43)"><g className="sc-ahoge"><path d="M0 0 C-5 -12 6 -14 4 -25" fill="none" stroke={HAIR} strokeWidth="3.2" strokeLinecap="round" /></g></g>
      </g>
    </g>
  )
}

function Torso() {
  return (
    <g>
      <path d="M-24 2 C-24 -6 -12 -10 0 -10 C12 -10 24 -6 24 2 L27 74 C14 79 -14 79 -27 74 Z" fill="var(--sc-outfit)" />
      <path d="M-13 -9 C-8 -1 8 -1 13 -9 C8 -15 -8 -15 -13 -9 Z" fill="var(--sc-outfit-dark)" />
      <path d="M-17 46 h34 l4 20 h-42 z" fill="var(--sc-outfit-dark)" opacity=".35" />
      <path d="M-5 -2 v18 M5 -2 v18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

function Limb({ d, hand, sleeve = true }: { d: string; hand: [number, number]; sleeve?: boolean }) {
  return (
    <g>
      <path d={d} fill="none" stroke={sleeve ? 'var(--sc-outfit)' : PANTS} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="5.5" fill={SKIN} />
    </g>
  )
}

function Shoe({ x = 0, y = 56, w = 11 }: { x?: number; y?: number; w?: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={w} ry="5.5" fill="#fff" />
      <ellipse cx={x + w * 0.45} cy={y + 1} rx={w * 0.45} ry="3.6" fill="var(--px-accent)" />
    </g>
  )
}

function StraightLeg() {
  return (
    <g>
      <path d="M0 0 L0 52" fill="none" stroke={PANTS} strokeWidth="13" strokeLinecap="round" />
      <Shoe />
    </g>
  )
}

function Standing() {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="32" ry="5" fill="var(--sc-shadow)" />
      <g transform="translate(-8 -62)"><StraightLeg /></g>
      <g transform="translate(8 -62)"><StraightLeg /></g>
      <g transform="translate(6 -128)"><Limb d="M0 0 L6 36 L10 70" hand={[10, 70]} /></g>
      <g transform="translate(0 -130)"><Torso /></g>
      {/* writing arm: reaches the board, rocks slightly as she writes */}
      <g transform="translate(-6 -128)">
        <g className="sc-write-arm">
          <Limb d="M0 0 L-37 -15 L-44 -54" hand={[-44, -54]} />
          <rect x="-50" y="-66" width="5" height="13" rx="2" fill="var(--px-accent)" transform="rotate(-8 -47 -60)" />
        </g>
      </g>
      <g transform="translate(0 -168)"><Head look={-4} tilt={-3} /></g>
    </g>
  )
}

function Walking({ look }: { look: number }) {
  return (
    <g className="sc-bob">
      <ellipse cx="0" cy="0" rx="32" ry="5" fill="var(--sc-shadow)" />
      <g transform="translate(-8 -62)"><g className="sc-leg-a"><StraightLeg /></g></g>
      <g transform="translate(8 -62)"><g className="sc-leg-b"><StraightLeg /></g></g>
      <g transform="translate(6 -128)"><g className="sc-arm-b"><Limb d="M0 0 L2 38 L4 74" hand={[4, 74]} /></g></g>
      <g transform="translate(0 -130)"><Torso /></g>
      <g transform="translate(-6 -128)"><g className="sc-arm-a"><Limb d="M0 0 L-2 38 L-4 74" hand={[-4, 74]} /></g></g>
      <g transform="translate(0 -168)"><Head look={look} /></g>
    </g>
  )
}

function Sitting() {
  return (
    <g>
      <ellipse cx="30" cy="0" rx="46" ry="5" fill="var(--sc-shadow)" />
      {/* thighs and shins */}
      <path d="M0 -62 L48 -62 L48 -10" fill="none" stroke={PANTS} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 -56 L52 -56 L52 -8" fill="none" stroke="#2f2a52" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" opacity=".0" />
      <Shoe x={54} y={-6} w={12} />
      <g transform="translate(0 -124)"><Torso /></g>
      {/* arms on the keyboard */}
      <g transform="translate(-4 -118)"><g className="sc-type-a"><Limb d="M0 0 L30 26 L68 30" hand={[68, 30]} /></g></g>
      <g transform="translate(4 -120)"><g className="sc-type-b"><Limb d="M0 0 L32 30 L72 36" hand={[72, 36]} /></g></g>
      <g transform="translate(2 -162)"><Head look={5} tilt={4} /></g>
    </g>
  )
}
