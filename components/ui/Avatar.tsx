'use client'

import React, { useState } from 'react'
import { Icon } from './Icon'

const PALETTE = ['#E53416', '#7B5EE0', '#1A8A4A', '#B86E0A', '#2B7FD4']

interface AvatarProps {
  name?: string
  size?: number
  src?: string | null
  editable?: boolean
  style?: React.CSSProperties
  onClick?: () => void
}

export function Avatar({ name = '', size = 48, src, editable, style: sx, onClick }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const [hover, setHover] = useState(false)
  const colorIdx = name.charCodeAt(0) % PALETTE.length

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        background: src ? 'transparent' : PALETTE[colorIdx] ?? '#E53416',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: editable || onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: size * 0.36, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
          {initials}
        </span>
      )}
      {editable && hover && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Icon name="upload" size={size * 0.28} color="#fff" />
          <span style={{ fontSize: size * 0.16, color: '#fff', fontWeight: 600 }}>Edit</span>
        </div>
      )}
    </div>
  )
}
