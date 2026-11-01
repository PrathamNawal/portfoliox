'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { THEMES, resolveTheme, type ThemeId, type ThemeMeta } from '@/lib/themes'

interface Props {
  value: ThemeId | string | null | undefined
  onChange: (id: ThemeId) => void
  disabled?: boolean
}

/** Tiny page-in-a-box preview built from a theme's swatch colours. */
function Swatch({ meta, size = 44 }: { meta: ThemeMeta; size?: number }) {
  const { bg, surface, ink, accent } = meta.swatch
  return (
    <span aria-hidden="true" style={{ position: 'relative', display: 'block', width: size, height: size * 0.75, flexShrink: 0, borderRadius: 6, background: bg, border: '1px solid rgba(128,128,128,.35)', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', left: '12%', right: '12%', top: '18%', height: '40%', borderRadius: 3, background: surface, border: '1px solid rgba(128,128,128,.25)' }} />
      <span style={{ position: 'absolute', left: '20%', top: '30%', width: '36%', height: 3, borderRadius: 2, background: ink }} />
      <span style={{ position: 'absolute', right: '16%', bottom: '14%', width: '22%', height: '16%', borderRadius: 3, background: accent }} />
    </span>
  )
}

/**
 * Theme chooser for the portfolio editor. Disclosure button + radiogroup popover.
 * Keyboard: Enter/Space opens, arrows move (roving tabindex), Enter/Space picks,
 * Esc or outside click closes and returns focus to the button.
 */
export function ThemePicker({ value, onChange, disabled }: Props) {
  const current = resolveTheme(value)
  const meta = THEMES.find(t => t.id === current) ?? THEMES[0]
  const [open, setOpen] = useState(false)
  const [above, setAbove] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const optRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const panelId = useId()

  const close = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) btnRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    optRefs.current[current]?.focus()
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) close(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const move = (from: number, delta: number) => {
    const next = THEMES[(from + delta + THEMES.length) % THEMES.length]
    optRefs.current[next.id]?.focus()
  }

  const onOptionKey = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return }
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (step) { e.preventDefault(); move(index, step) }
    if (e.key === 'Home') { e.preventDefault(); optRefs.current[THEMES[0].id]?.focus() }
    if (e.key === 'End') { e.preventDefault(); optRefs.current[THEMES[THEMES.length - 1].id]?.focus() }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => {
          const r = btnRef.current?.getBoundingClientRect()
          // flip above the button when there is not enough room below (~340px panel)
          if (r) setAbove(window.innerHeight - r.bottom < 360 && r.top > 360)
          setOpen(o => !o)
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px 4px 6px', borderRadius: 8, border: '1.5px solid var(--px-border)', background: 'transparent', cursor: disabled ? 'default' : 'pointer', fontFamily: 'var(--px-font)', color: 'var(--px-text-2)' }}
      >
        <Swatch meta={meta} size={28} />
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em' }}>{meta.label}</span>
        <svg viewBox="0 0 10 6" width="9" height="6" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .12s' }}><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Choose portfolio theme"
          onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); close() } }}
          style={{ position: 'absolute', zIndex: 60, ...(above ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }), left: 0, width: 'min(600px, calc(100vw - 32px))', padding: 12, borderRadius: 12, background: 'var(--px-surface)', border: '1px solid var(--px-border-strong)', boxShadow: 'var(--px-shadow-xl)' }}
        >
          <div role="radiogroup" aria-label="Portfolio theme" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 8 }}>
            {THEMES.map((t, i) => {
              const active = t.id === current
              return (
                <button
                  key={t.id}
                  ref={el => { optRefs.current[t.id] = el }}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  onKeyDown={e => onOptionKey(e, i)}
                  onClick={() => { if (!active) onChange(t.id); close() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, textAlign: 'left', borderRadius: 9, cursor: 'pointer', fontFamily: 'var(--px-font)', border: `1.5px solid ${active ? 'var(--px-accent)' : 'var(--px-border)'}`, background: active ? 'var(--px-accent-subtle)' : 'transparent' }}
                >
                  <Swatch meta={t} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: active ? 'var(--px-accent)' : 'var(--px-text)', letterSpacing: '-0.01em' }}>
                      {t.label}{t.tone === 'dark' ? ' · dark' : ''}
                    </span>
                    <span style={{ display: 'block', fontSize: 11, lineHeight: 1.35, color: 'var(--px-text-3)' }}>{t.blurb}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
