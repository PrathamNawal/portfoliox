'use client'

import React, { useRef } from 'react'
import { MOTION_LEVELS, resolveMotion, type MotionLevel } from '@/lib/motion'

interface Props {
  value: MotionLevel | string | null | undefined
  onChange: (level: MotionLevel) => void
  disabled?: boolean
}

const LABELS: Record<MotionLevel, { label: string; hint: string }> = {
  still: { label: 'Still', hint: 'No animation. Hover effects only.' },
  subtle: { label: 'Subtle', hint: 'Intro animation, headline wipe and a colour glow taken from your covers. Your work shows higher on the page.' },
  expressive: { label: 'Expressive', hint: 'Subtle, plus a research, design and ship story in the hero margins on wide screens.' },
}

/** Still / Subtle / Expressive. Radiogroup with arrow-key navigation (roving tabindex). */
export function MotionPicker({ value, onChange, disabled }: Props) {
  const current = resolveMotion(value)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const onKey = (e: React.KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = MOTION_LEVELS[(index + step + MOTION_LEVELS.length) % MOTION_LEVELS.length]
    refs.current[next]?.focus()
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div role="radiogroup" aria-label="Portfolio motion" style={{ display: 'inline-flex', gap: 6 }}>
        {MOTION_LEVELS.map((level, i) => {
          const active = level === current
          return (
            <button
              key={level}
              ref={el => { refs.current[level] = el }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              disabled={disabled}
              onKeyDown={e => onKey(e, i)}
              onClick={() => { if (!active) onChange(level) }}
              style={{ padding: '5px 12px', borderRadius: 8, fontFamily: 'var(--px-font)', fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em', cursor: active || disabled ? 'default' : 'pointer', border: `1.5px solid ${active ? 'var(--px-accent)' : 'var(--px-border)'}`, background: active ? 'var(--px-accent-subtle)' : 'transparent', color: active ? 'var(--px-accent)' : 'var(--px-text-2)', transition: 'all 0.12s' }}
            >
              {LABELS[level].label}
            </button>
          )
        })}
      </div>
      <span style={{ fontSize: 11, lineHeight: 1.45, color: 'var(--px-text-3)', maxWidth: 420 }}>{LABELS[current].hint}</span>
    </div>
  )
}
