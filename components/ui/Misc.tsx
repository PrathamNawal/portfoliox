'use client'

import React from 'react'
import { Badge } from './Badge'

// ── PXLogo ────────────────────────────────────────────────────────────────────
export function PXLogo({ size = 28, wordmark = true, light = false }: { size?: number; wordmark?: boolean; light?: boolean }) {
  const textColor = light ? '#F0EEE9' : 'var(--px-text)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="#E53416"/>
        <line x1="8.5" y1="8.5" x2="19.5" y2="19.5" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
        <line x1="19.5" y1="8.5" x2="8.5" y2="19.5" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
        <circle cx="14" cy="14" r="2.2" fill="white" opacity="0.25"/>
      </svg>
      {wordmark && (
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.03em', color: textColor, fontFamily: 'var(--px-font)', lineHeight: 1 }}>
          PortfolioX
        </span>
      )}
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
interface ToggleProps {
  value: boolean
  onChange: (v: boolean) => void
  label?: string
  size?: 'sm' | 'md'
}

export function Toggle({ value, onChange, label, size = 'md' }: ToggleProps) {
  const w = size === 'sm' ? 32 : 40
  const h = size === 'sm' ? 18 : 22
  const dot = size === 'sm' ? 12 : 16
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!value)}
        style={{ position: 'relative', width: w, height: h, borderRadius: 999, background: value ? 'var(--px-accent)' : 'var(--px-surface-3)', transition: 'background 0.18s', flexShrink: 0 }}
      >
        <div
          style={{ position: 'absolute', top: (h - dot) / 2, left: value ? w - dot - (h - dot) / 2 : (h - dot) / 2, width: dot, height: dot, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.18s' }}
        />
      </div>
      {label && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--px-text-2)' }}>{label}</span>}
    </label>
  )
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
export function ProgressBar({ steps, current }: { steps: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {Array.from({ length: steps }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 3,
            flex: 1,
            borderRadius: 999,
            background: i <= current ? 'var(--px-accent)' : 'var(--px-border)',
            transition: 'background 0.3s',
          }}
        />
      ))}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ label, style: sx }: { label?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...sx }}>
      <div style={{ flex: 1, height: 1, background: 'var(--px-border)' }} />
      {label && (
        <span style={{ fontSize: 12, color: 'var(--px-text-3)', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          {label}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: 'var(--px-border)' }} />
    </div>
  )
}

// ── SectionHead ───────────────────────────────────────────────────────────────
export function SectionHead({ title, action, count }: { title: string; action?: React.ReactNode; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--px-text)' }}>{title}</h2>
        {count !== undefined && <Badge>{count}</Badge>}
      </div>
      {action}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid rgba(255,255,255,0.3)`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  )
}
