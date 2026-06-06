'use client'

import React, { useEffect } from 'react'
import { IconBtn } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  width?: number
  title?: string
  noPad?: boolean
}

export function Modal({ open, onClose, children, width = 480, title, noPad }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,10,8,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        animation: 'px-fadein 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--px-surface)',
          borderRadius: 'var(--px-r-xl)',
          boxShadow: 'var(--px-shadow-xl)',
          border: '1px solid var(--px-border)',
          overflow: 'hidden',
        }}
      >
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--px-border)',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</span>
            <IconBtn name="x" size={28} iconSize={16} onClick={onClose} />
          </div>
        )}
        <div style={noPad ? {} : { padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}
