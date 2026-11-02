'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { Character } from './DesignerScene'
import './designer-scene.css'
import './shopping-scene.css'

// The designer from the hero, shopping on her phone and getting more and more excited. It is the same
// puppet as DesignerScene (never redrawn), posed and animated by shopping-scene.css over one 10s loop:
//
//   0-14%   she looks at her phone, a search is typed on the magnified screen
//   14-30%  results load and scroll
//   30-37%  she spots the one: "!" bubble, gasp, small hop; the card is tapped
//   37-62%  product page: stars pop, "Add to cart" tap, thumbnail flies to the cart, badge pops, hop
//   62-72%  checkout, "Place order" tap, order placed check
//   72-91%  cheer: crouch, big jump, both arms up, happy face, confetti, hearts, parcel lands
//   91-100% settle back to the first frame (the loop is seamless)
//
// The app on the big phone is deliberately generic (no real brand, logo or wordmark). The small phone in her
// hand rides the same joints as her right arm (the "sh-" classes copy the rig's bob / torso / arm), so it
// stays in her hand through every hop.
// Motion Still (animate=false) and reduced motion show one calm frame: standing, looking at the product page.
// `freeze` (0..1) pins a moment of the loop, for screenshots and tests.

const OUT = '#2a2347'
const STAR = 'M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4 Z'
const HEART = 'M0 5 C-9 -1 -7 -9 0 -5 C7 -9 9 -1 0 5 Z'
const PASTEL = ['#ffe4ec', '#dff3f1', '#fff0c8', '#e4e0fb']
const CONF_COLORS = ['#e53416', '#ffd34d', '#3fc1c9', '#ff9fb4']
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const LOOP_SECONDS = 10

// Confetti: sideways drift, rise on the way out, fall, spin, and start offset (seconds after the order is placed).
const CONFETTI = [
  { dx: -104, up: -70, dy: 205, rot: 380, d: 0 }, { dx: -76, up: -92, dy: 220, rot: -300, d: 0.05 },
  { dx: -48, up: -104, dy: 232, rot: 260, d: 0.02 }, { dx: -22, up: -112, dy: 240, rot: -240, d: 0.08 },
  { dx: 4, up: -108, dy: 236, rot: 320, d: 0.03 }, { dx: 30, up: -104, dy: 228, rot: -360, d: 0.07 },
  { dx: 56, up: -96, dy: 222, rot: 280, d: 0.01 }, { dx: 82, up: -80, dy: 212, rot: -340, d: 0.06 },
  { dx: 108, up: -66, dy: 200, rot: 240, d: 0.04 }, { dx: -62, up: -60, dy: 180, rot: 220, d: 0.12 },
  { dx: 44, up: -58, dy: 178, rot: -200, d: 0.14 }, { dx: 96, up: -50, dy: 168, rot: 300, d: 0.16 },
]

interface Props {
  /** false = Motion Still: one calm frame. */
  animate?: boolean
  /** 0..1 pins a moment of the loop (screenshots, tests). */
  freeze?: number
  className?: string
  label?: string
}

export function ShoppingScene({
  animate = true,
  freeze,
  className,
  label = 'Illustration: a designer shops on her phone, finds what she wants, adds it to the cart, places the order and cheers.',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [play, setPlay] = useState(false)
  const uid = useId().replace(/:/g, '')
  const frozen = freeze !== undefined

  useEffect(() => {
    const el = ref.current
    if (!el || !animate || frozen) return
    const io = new IntersectionObserver(([entry]) => setPlay(entry.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [animate, frozen])

  return (
    <div
      ref={ref}
      className={`sc-root shop-root${className ? ` ${className}` : ''}`}
      data-motion={animate ? 'on' : 'off'}
      data-play={animate && play && !frozen ? 'true' : 'false'}
      data-frozen={frozen ? 'true' : undefined}
      style={frozen ? ({ '--sc-delay': `${-(freeze as number) * LOOP_SECONDS}s` } as React.CSSProperties) : undefined}
    >
      <svg viewBox="-112 36 372 326" role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id={`${uid}-screen`}><rect x="130" y="116" width="96" height="206" rx="10" /></clipPath>
          <clipPath id={`${uid}-body`}><rect x="130" y="146" width="96" height="176" /></clipPath>
        </defs>

        <line x1="-108" y1="352" x2="256" y2="352" stroke="var(--sc-floor)" strokeWidth="3" strokeLinecap="round" />

        <Beams />
        <BigPhone uid={uid} />
        <Box />
        <Character />
        <HeldPhone />
        <Hearts />
        <Sparkles />
        <Confetti />
      </svg>
    </div>
  )
}

/* ── Props and effects ─────────────────────────────────────────────────── */

/** Dashed "zoom" lines from the phone in her hand to the magnified screen. */
function Beams() {
  return (
    <g className="sh-beams">
      <g fill="none" stroke="#b9b4cf" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="3 4">
        <line className="sh-beam" x1="92" y1="178" x2="122" y2="108" />
        <line className="sh-beam" x1="92" y1="224" x2="122" y2="330" />
      </g>
    </g>
  )
}

/** The parcel that lands when the order is placed. */
function Box() {
  return (
    <g transform="translate(-84 352)">
      <g className="sh-box">
        <rect x="-16" y="-25" width="32" height="25" rx="2.5" fill="#d9a86a" stroke={OUT} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M-5 -25 v10 h10 v-10" fill="#f0cf9a" stroke={OUT} strokeWidth="2" strokeLinejoin="round" />
        <path d="M-11 -9 h8 M-11 -5 h5" stroke={OUT} strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
      </g>
    </g>
  )
}

function Hearts() {
  const hearts = [
    { x: -78, y: 160, hx: -12, at: 7.45 },
    { x: -90, y: 128, hx: 8, at: 7.85 },
    { x: -66, y: 104, hx: -6, at: 8.2 },
  ]
  return (
    <g>
      {hearts.map((h, i) => (
        <g key={i} transform={`translate(${h.x} ${h.y})`}>
          <g className="sh-heart" style={{ '--hx': `${h.hx}px`, '--at': `${h.at}s` } as React.CSSProperties}>
            <path d={HEART} fill="#ff6f91" stroke={OUT} strokeWidth="1.6" strokeLinejoin="round" />
          </g>
        </g>
      ))}
    </g>
  )
}

function Sparkles() {
  return (
    <g className="sh-sparkles" fill="#ffd34d" stroke={OUT} strokeWidth="1.2" strokeLinejoin="round">
      <g transform="translate(-94 176)"><path className="sc-sp1" d={STAR} /></g>
      <g transform="translate(-98 250) scale(.75)"><path className="sc-sp2" d={STAR} /></g>
      <g transform="translate(100 146) scale(.8)"><path className="sc-sp3" d={STAR} /></g>
      <g transform="translate(104 268) scale(.65)"><path className="sc-sp2" d={STAR} /></g>
      <g transform="translate(-30 92) scale(.7)"><path className="sc-sp1" d={STAR} /></g>
    </g>
  )
}

function Confetti() {
  return (
    <g stroke={OUT} strokeWidth="1.4">
      {CONFETTI.map((c, i) => (
        <g key={i} transform="translate(10 150)">
          <g
            className="sh-confetti"
            style={{ '--dx': `${c.dx}px`, '--up': `${c.up}px`, '--dy': `${c.dy}px`, '--rot': `${c.rot}deg`, '--at': `${7.3 + c.d}s` } as React.CSSProperties}
          >
            {i % 2 ? <rect x="-4" y="-2.5" width="8" height="5" rx="1" fill={CONF_COLORS[i % 4]} /> : <circle r="3.4" fill={CONF_COLORS[i % 4]} />}
          </g>
        </g>
      ))}
    </g>
  )
}

/* ── The phone in her hand ─────────────────────────────────────────────── */

/** Copies the rig chain down to the right hand (same transforms, "sh-" classes that share the rig's keyframes)
 *  so the phone moves exactly with her hand. The phone is counter-rotated so it is upright in her resting pose. */
function HeldPhone() {
  return (
    <g transform="translate(0 352)">
      <g transform="scale(1.2)">
        <g className="sh-bob">
          <g transform="translate(0 -60)">
            <g className="sh-torso">
              <g transform="translate(21 -40)">
                <g className="sh-arm">
                  <g transform="translate(0 38) rotate(100)">
                    <rect x="-5" y="-40" width="22" height="40" rx="5" fill="#fff" stroke={OUT} strokeWidth="2.6" />
                    <rect x="-2.4" y="-37.4" width="16.8" height="34.8" rx="3" fill="#f4f2fb" />
                    <path d="M-2.4 -34.4 a3 3 0 0 1 3 -3 h10.8 a3 3 0 0 1 3 3 v4 h-16.8 z" fill={OUT} />
                    <rect x="-0.9" y="-28.5" width="6.4" height="10" rx="1.6" fill={PASTEL[0]} />
                    <rect x="6.5" y="-28.5" width="6.4" height="10" rx="1.6" fill={PASTEL[1]} />
                    <rect className="sh-mini" x="0.4" y="-15.5" width="11.2" height="4.6" rx="2.3" fill="var(--px-accent)" />
                    {/* fingers wrap the corner of the phone */}
                    <circle cx="0" cy="0" r="8" fill="#ffe3d1" stroke={OUT} strokeWidth="3" />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  )
}

/* ── The magnified phone and the app on it ─────────────────────────────── */

function Shoe({ s = 1 }: { s?: number }) {
  return (
    <g transform={`scale(${s})`} strokeLinejoin="round" strokeLinecap="round">
      <path d="M-17 7 V-3 C-17 -7 -14 -9 -10 -9 H-6 C-5 -4 -1 -1 4 0 L11 2 C16 3 18 5 18 7 Z" fill="var(--px-accent)" stroke={OUT} strokeWidth="2" />
      <rect x="-18" y="7" width="37" height="4.5" rx="2.2" fill="#fff" stroke={OUT} strokeWidth="2" />
      <path d="M-3 -2 l3 -3 M1 0 l3 -3 M5 1.5 l3 -3" fill="none" stroke="#fff" strokeWidth="1.6" />
    </g>
  )
}

function Glyph({ kind }: { kind: number }) {
  const p = { fill: '#fff', stroke: OUT, strokeWidth: 1.8, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  switch (kind % 3) {
    case 0: // mug
      return <g><rect x="-7" y="-8" width="14" height="16" rx="3" {...p} /><path d="M7 -3 q6 0 6 5 q0 5 -6 5" fill="none" stroke={OUT} strokeWidth="1.8" strokeLinecap="round" /></g>
    case 1: // watch
      return <g><circle r="9" {...p} /><path d="M0 -5 V0 L4 2" fill="none" stroke={OUT} strokeWidth="1.8" strokeLinecap="round" /></g>
    default: // bag
      return <g><rect x="-8" y="-8" width="16" height="18" rx="4" {...p} /><path d="M-4 -8 q4 -7 8 0" fill="none" stroke={OUT} strokeWidth="1.8" strokeLinecap="round" /></g>
  }
}

function BigPhone({ uid }: { uid: string }) {
  const cards = []
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) cards.push({ x: 4 + c * 46, y: 4 + r * 69, i: r * 2 + c })
  const TARGET = 4 // third row, left card: the one she wants

  return (
    <g className="sh-phone">
      {/* body */}
      <rect x="122" y="104" width="112" height="230" rx="18" fill="#fff" stroke={OUT} strokeWidth="4" />
      <rect x="233" y="150" width="3.5" height="24" rx="1.75" fill={OUT} />
      <rect x="168" y="108.5" width="20" height="3.5" rx="1.75" fill={OUT} />
      <rect x="166" y="327" width="24" height="3" rx="1.5" fill={OUT} />

      <g clipPath={`url(#${uid}-screen)`}>
        <rect x="130" y="116" width="96" height="206" fill="#f4f2fb" />

        {/* pages slide along a track: results, product, checkout */}
        <g clipPath={`url(#${uid}-body)`}>
          <g className="sh-body">
            <g className="sh-track">
              {/* results */}
              <g transform="translate(130 146)">
                <g className="sh-grid">
                  {cards.map(({ x, y, i }) => (
                    <g key={i} transform={`translate(${x} ${y})`}>
                      <g className={i === TARGET ? 'sh-target' : undefined}>
                        <rect width="42" height="64" rx="6" fill="#fff" stroke="#d7d3ea" strokeWidth="1.6" />
                        <rect x="3" y="3" width="36" height="34" rx="4" fill={PASTEL[i % 4]} />
                        <g transform="translate(21 20)">{i === TARGET ? <Shoe s={0.85} /> : <Glyph kind={i} />}</g>
                        <rect x="4" y="42" width="30" height="4" rx="2" fill="#3a3560" />
                        <rect x="4" y="49" width="22" height="3" rx="1.5" fill="#cfc9ee" />
                        <rect x="4" y="56" width="15" height="5" rx="2.5" fill={i === TARGET ? 'var(--px-accent)' : '#8d88a8'} />
                        {i === TARGET && (
                          <g>
                            <rect x="3" y="3" width="15" height="8" rx="2.5" fill="var(--px-accent)" />
                            <text x="10.5" y="9" fontSize="5.4" fontWeight="800" fontFamily={FONT} textAnchor="middle" fill="#fff">-40%</text>
                            <rect className="sh-hl" x="-1.6" y="-1.6" width="45.2" height="67.2" rx="7.6" fill="none" stroke="var(--px-accent)" strokeWidth="2.4" />
                          </g>
                        )}
                      </g>
                    </g>
                  ))}
                </g>
              </g>

              {/* product */}
              <g transform="translate(226 146)">
                <rect x="6" y="6" width="84" height="70" rx="8" fill={PASTEL[0]} />
                <g transform="translate(48 41)"><Shoe s={2} /></g>
                <circle cx="42" cy="84" r="2" fill={OUT} />
                <circle cx="48" cy="84" r="2" fill="#cfc9ee" />
                <circle cx="54" cy="84" r="2" fill="#cfc9ee" />
                <rect x="8" y="91" width="66" height="5" rx="2.5" fill="#3a3560" />
                <rect x="8" y="100" width="44" height="4" rx="2" fill="#cfc9ee" />
                {[0, 1, 2, 3, 4].map(k => (
                  <g key={k} transform={`translate(${13 + k * 10.5} 113) scale(.55)`}>
                    <path className="sh-star" style={{ '--at': `${4.1 + k * 0.09}s` } as React.CSSProperties} d={STAR} fill="#ffd34d" stroke={OUT} strokeWidth="1.8" strokeLinejoin="round" />
                  </g>
                ))}
                <rect x="68" y="111" width="20" height="4" rx="2" fill="#cfc9ee" />
                <text x="8" y="132" fontSize="11" fontWeight="800" fontFamily={FONT} fill={OUT}>$49</text>
                <rect x="34" y="127" width="16" height="3" rx="1.5" fill="#cfc9ee" />
                <g className="sh-add">
                  <rect x="6" y="137" width="84" height="16" rx="8" fill="var(--px-accent)" />
                  <text x="48" y="148" fontSize="7.4" fontWeight="800" fontFamily={FONT} textAnchor="middle" fill="#fff">Add to cart</text>
                </g>
                <rect x="6" y="156" width="84" height="16" rx="8" fill="#ffd34d" stroke={OUT} strokeWidth="1.4" />
                <text x="48" y="167" fontSize="7.4" fontWeight="800" fontFamily={FONT} textAnchor="middle" fill={OUT}>Buy now</text>
              </g>

              {/* checkout */}
              <g transform="translate(322 146)">
                <rect x="8" y="6" width="48" height="6" rx="3" fill="#3a3560" />
                <rect x="6" y="18" width="84" height="26" rx="6" fill="#fff" stroke="#d7d3ea" strokeWidth="1.6" />
                <circle cx="17" cy="31" r="5" fill="var(--px-accent)" />
                <rect x="27" y="25" width="44" height="4" rx="2" fill="#3a3560" />
                <rect x="27" y="33" width="32" height="3" rx="1.5" fill="#cfc9ee" />
                <rect x="6" y="50" width="84" height="34" rx="6" fill="#fff" stroke="#d7d3ea" strokeWidth="1.6" />
                <rect x="10" y="54" width="26" height="26" rx="4" fill={PASTEL[0]} />
                <g transform="translate(23 66)"><Shoe s={0.55} /></g>
                <rect x="42" y="58" width="40" height="4" rx="2" fill="#3a3560" />
                <rect x="42" y="66" width="28" height="3" rx="1.5" fill="#cfc9ee" />
                <text x="42" y="78" fontSize="8" fontWeight="800" fontFamily={FONT} fill={OUT}>$49</text>
                <rect x="8" y="93" width="30" height="3" rx="1.5" fill="#cfc9ee" />
                <rect x="70" y="93" width="20" height="3" rx="1.5" fill="#cfc9ee" />
                <rect x="8" y="101" width="24" height="3" rx="1.5" fill="#cfc9ee" />
                <rect x="76" y="101" width="14" height="3" rx="1.5" fill="#cfc9ee" />
                <path d="M8 110 H90" stroke="#d7d3ea" strokeWidth="1.4" />
                <text x="8" y="121" fontSize="8" fontWeight="800" fontFamily={FONT} fill={OUT}>Total</text>
                <text x="90" y="121" fontSize="8" fontWeight="800" fontFamily={FONT} textAnchor="end" fill={OUT}>$49</text>
                <rect x="6" y="127" width="84" height="14" rx="7" fill="#dff3f1" />
                <text x="48" y="137" fontSize="6.2" fontWeight="800" fontFamily={FONT} textAnchor="middle" fill="#1f6f68">Arrives tomorrow</text>
                <g className="sh-place">
                  <rect x="6" y="148" width="84" height="22" rx="11" fill="var(--px-accent)" />
                  <text x="48" y="162" fontSize="8.4" fontWeight="800" fontFamily={FONT} textAnchor="middle" fill="#fff">Place order</text>
                </g>
              </g>
            </g>

            {/* order placed */}
            <g transform="translate(130 146)">
              <g className="sh-done">
                <rect width="96" height="176" fill="#f4f2fb" />
                <circle cx="48" cy="62" r="24" fill="#5fb48a" stroke={OUT} strokeWidth="3" />
                <path className="sh-check" d="M37 63 l8 8 l15 -16" pathLength={1} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                <text x="48" y="110" fontSize="10" fontWeight="800" fontFamily={FONT} textAnchor="middle" fill={OUT}>Order placed!</text>
                <rect x="22" y="119" width="52" height="4" rx="2" fill="#cfc9ee" />
                <rect x="30" y="127" width="36" height="4" rx="2" fill="#cfc9ee" />
                <rect x="14" y="141" width="68" height="16" rx="8" fill="#dff3f1" />
                <text x="48" y="152" fontSize="6.8" fontWeight="800" fontFamily={FONT} textAnchor="middle" fill="#1f6f68">Arrives tomorrow</text>
              </g>
            </g>
          </g>
        </g>

        {/* taps and the thumbnail that flies to the cart (screen coordinates) */}
        <circle className="sh-rip" style={{ '--at': '3.3s' } as React.CSSProperties} cx="151" cy="250" r="12" fill="var(--px-accent)" />
        <circle className="sh-rip" style={{ '--at': '5.46s' } as React.CSSProperties} cx="178" cy="291" r="12" fill="var(--px-accent)" />
        <circle className="sh-rip" style={{ '--at': '6.84s' } as React.CSSProperties} cx="178" cy="305" r="12" fill="var(--px-accent)" />
        <g transform="translate(178 291)">
          <g className="sh-fly">
            <circle r="6" fill={PASTEL[0]} stroke={OUT} strokeWidth="1.8" />
            <circle cx="0" cy="0" r="2" fill="var(--px-accent)" />
          </g>
        </g>

        {/* header: search and cart */}
        <rect x="130" y="116" width="96" height="30" fill={OUT} />
        <rect x="136" y="122" width="58" height="18" rx="9" fill="#fff" />
        <circle cx="145" cy="130.5" r="3.4" fill="none" stroke="#8d88a8" strokeWidth="1.6" />
        <path d="M147.6 133 L150 135.5" stroke="#8d88a8" strokeWidth="1.6" strokeLinecap="round" />
        <rect className="sh-typed" x="153" y="128" width="36" height="5" rx="2.5" fill="#3a3560" />
        <g className="sh-cart">
          <path d="M201 124 h3.5 l2.6 11 h10 l2.4 -8.5 h-14.2" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="207.5" cy="138.2" r="1.7" fill="#fff" />
          <circle cx="215.2" cy="138.2" r="1.7" fill="#fff" />
        </g>
        <g className="sh-badge">
          <circle cx="218.5" cy="124.5" r="5.4" fill="var(--px-accent)" stroke="#fff" strokeWidth="1.2" />
          <text x="218.5" y="127" fontSize="6.8" fontWeight="800" fontFamily={FONT} textAnchor="middle" fill="#fff">1</text>
        </g>
      </g>
    </g>
  )
}
