'use client'

import React from 'react'

interface InputProps {
  label?: string
  hint?: string
  error?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  type?: string
  prefix?: string
  style?: React.CSSProperties
  disabled?: boolean
  autoFocus?: boolean
  onBlur?: () => void
}

export function Input({
  label, hint, error, value, onChange, placeholder, maxLength,
  type = 'text', prefix, style: sx, disabled, autoFocus, onBlur,
}: InputProps) {
  const remaining = maxLength ? maxLength - (value || '').length : null
  const showCount = maxLength && remaining !== null && remaining < 20

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)', letterSpacing: '-0.01em' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && (
          <span style={{ position: 'absolute', left: 12, fontSize: 14, color: 'var(--px-text-3)', pointerEvents: 'none' }}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          autoFocus={autoFocus}
          onBlur={onBlur}
          style={{
            width: '100%',
            height: 40,
            padding: `0 ${showCount ? 48 : 12}px 0 ${prefix ? prefix.length * 8 + 16 : 12}px`,
            fontSize: 14,
            color: 'var(--px-text)',
            background: 'var(--px-surface)',
            border: `1px solid ${error ? '#C94040' : 'var(--px-border)'}`,
            borderRadius: 'var(--px-r)',
            outline: 'none',
            transition: 'border 0.12s',
            opacity: disabled ? 0.6 : 1,
            ...sx,
          }}
        />
        {showCount && (
          <span style={{ position: 'absolute', right: 10, fontSize: 11, color: remaining! < 5 ? '#C94040' : 'var(--px-text-3)' }}>
            {remaining}
          </span>
        )}
      </div>
      {(hint || error) && (
        <span style={{ fontSize: 12, color: error ? '#C94040' : 'var(--px-text-3)' }}>
          {error || hint}
        </span>
      )}
    </div>
  )
}

interface TextareaProps {
  label?: string
  hint?: string
  error?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  rows?: number
  style?: React.CSSProperties
  disabled?: boolean
}

export function Textarea({
  label, hint, error, value, onChange, placeholder, maxLength, rows = 3, style: sx, disabled,
}: TextareaProps) {
  const remaining = maxLength ? maxLength - (value || '').length : null
  const showCount = maxLength && remaining !== null && remaining < 20

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)', letterSpacing: '-0.01em' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--px-text)',
            background: 'var(--px-surface)',
            border: `1px solid ${error ? '#C94040' : 'var(--px-border)'}`,
            borderRadius: 'var(--px-r)',
            outline: 'none',
            resize: 'vertical',
            transition: 'border 0.12s',
            ...sx,
          }}
        />
        {showCount && (
          <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 11, color: remaining! < 5 ? '#C94040' : 'var(--px-text-3)' }}>
            {remaining}
          </span>
        )}
      </div>
      {(hint || error) && (
        <span style={{ fontSize: 12, color: error ? '#C94040' : 'var(--px-text-3)' }}>
          {error || hint}
        </span>
      )}
    </div>
  )
}
