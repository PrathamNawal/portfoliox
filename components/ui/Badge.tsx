'use client'

import React, { useState } from 'react'
import { Icon } from './Icon'

type BadgeColor = 'default' | 'accent' | 'green' | 'orange' | 'dark'

const BADGE_COLORS: Record<BadgeColor, { bg: string; fg: string; border: string }> = {
  default: { bg: 'var(--px-surface-2)', fg: 'var(--px-text-2)',  border: 'var(--px-border)' },
  accent:  { bg: 'var(--px-accent-subtle)', fg: 'var(--px-accent)', border: 'transparent' },
  green:   { bg: 'var(--px-success-subtle)', fg: 'var(--px-success)', border: 'transparent' },
  orange:  { bg: 'var(--px-warning-subtle)', fg: 'var(--px-warning)', border: 'transparent' },
  dark:    { bg: 'var(--px-text)', fg: 'var(--px-bg)', border: 'transparent' },
}

interface BadgeProps {
  children: React.ReactNode
  color?: BadgeColor
  size?: 'xs' | 'sm'
}

export function Badge({ children, color = 'default', size = 'sm' }: BadgeProps) {
  const c = BADGE_COLORS[color]
  const pad = size === 'xs' ? '0 6px' : '2px 8px'
  const fs = size === 'xs' ? 10 : 11
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: pad,
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        borderRadius: 'var(--px-r-sm)',
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

interface TagProps {
  children: React.ReactNode
  selected?: boolean
  onClick?: () => void
  removable?: boolean
  onRemove?: () => void
}

export function Tag({ children, selected, onClick, removable, onRemove }: TagProps) {
  const [hover, setHover] = useState(false)
  return (
    <span
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 12px',
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: '-0.01em',
        borderRadius: 999,
        background: selected ? 'var(--px-accent)' : hover ? 'var(--px-surface-3)' : 'var(--px-surface-2)',
        color: selected ? 'var(--px-accent-fg)' : 'var(--px-text)',
        border: `1px solid ${selected ? 'transparent' : 'var(--px-border)'}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: `background var(--dur-fast) var(--ease-hover), color var(--dur-fast)`,
        userSelect: 'none',
      }}
    >
      {children}
      {removable && (
        <span
          onClick={(e) => { e.stopPropagation(); onRemove?.() }}
          style={{ display: 'inline-flex', opacity: 0.6, marginLeft: 2, cursor: 'pointer' }}
        >
          <Icon name="x" size={12} />
        </span>
      )}
    </span>
  )
}
