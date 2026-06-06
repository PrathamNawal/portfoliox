'use client'

import React, { useState } from 'react'
import { Icon, IconName } from './Icon'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type Size = 'xs' | 'sm' | 'md' | 'lg'

const SIZE = {
  xs: { h: 28, px: 10, fs: 12, gap: 4, iconSize: 13 },
  sm: { h: 32, px: 12, fs: 13, gap: 5, iconSize: 14 },
  md: { h: 36, px: 16, fs: 14, gap: 6, iconSize: 15 },
  lg: { h: 44, px: 20, fs: 15, gap: 7, iconSize: 16 },
}

const VARIANT: Record<Variant, { bg: string; hbg: string; fg: string; border: string }> = {
  primary:   { bg: 'var(--px-accent)',    hbg: 'var(--px-accent-hover)', fg: 'var(--px-accent-fg)', border: 'transparent' },
  secondary: { bg: 'var(--px-surface-2)', hbg: 'var(--px-surface-3)',    fg: 'var(--px-text)',      border: 'var(--px-border)' },
  ghost:     { bg: 'transparent',         hbg: 'var(--px-surface-2)',    fg: 'var(--px-text-2)',    border: 'transparent' },
  outline:   { bg: 'transparent',         hbg: 'var(--px-surface-2)',    fg: 'var(--px-text)',      border: 'var(--px-border)' },
  danger:    { bg: 'transparent',         hbg: '#FEF2F2',                fg: '#C94040',             border: '#C94040' },
}

interface BtnProps {
  children?: React.ReactNode
  variant?: Variant
  size?: Size
  icon?: IconName
  iconRight?: IconName
  onClick?: () => void
  disabled?: boolean
  style?: React.CSSProperties
  type?: 'button' | 'submit' | 'reset'
  title?: string
  className?: string
}

export function Btn({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  onClick,
  disabled,
  style: sx,
  type = 'button',
  title,
  className,
}: BtnProps) {
  const [hover, setHover] = useState(false)
  const s = SIZE[size]
  const v = VARIANT[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={className}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseDown={(e) => { if (!disabled) { e.currentTarget.style.transform = 'scale(0.96)' } }}
      onMouseUp={(e) => { if (!disabled) { e.currentTarget.style.transform = '' } }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        height: s.h,
        padding: `0 ${s.px}px`,
        fontSize: s.fs,
        fontWeight: 600,
        fontFamily: 'var(--px-font)',
        letterSpacing: '-0.01em',
        borderRadius: 'var(--px-r)',
        background: hover && !disabled ? v.hbg : v.bg,
        color: v.fg,
        border: `1px solid ${v.border}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: `background var(--dur-fast) var(--ease-hover), transform var(--dur-micro) var(--ease-in)`,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        ...sx,
      }}
    >
      {icon && <Icon name={icon} size={s.iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={s.iconSize} />}
    </button>
  )
}

interface IconBtnProps {
  name: IconName
  size?: number
  iconSize?: number
  onClick?: () => void
  title?: string
  active?: boolean
  color?: string
  style?: React.CSSProperties
  disabled?: boolean
}

export function IconBtn({ name, size = 32, iconSize = 18, onClick, title, active, color, style: sx, disabled }: IconBtnProps) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)' }}
      onMouseUp={(e) => { e.currentTarget.style.transform = '' }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 'var(--px-r)',
        background: active
          ? 'var(--px-accent-subtle)'
          : hover
          ? 'var(--px-surface-2)'
          : 'transparent',
        color: active ? 'var(--px-accent)' : color || 'var(--px-text-2)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: `background var(--dur-fast) var(--ease-hover), color var(--dur-fast)`,
        flexShrink: 0,
        opacity: disabled ? 0.45 : 1,
        ...sx,
      }}
    >
      <Icon name={name} size={iconSize} />
    </button>
  )
}
