'use client'

import React from 'react'

const D = { surface: '#161513', border: '#2B2926', text2: '#8A8780' }

interface Props {
  text: string
  streaming: boolean
  onRegenerate?: () => void
  disabled?: boolean
}

export function GeneratingText({ text, streaming, onRegenerate, disabled }: Props) {
  if (!text && !streaming) return null
  return (
    <div style={{ marginTop: 12, padding: '12px 14px', background: D.surface, borderRadius: 6, border: `1px solid ${D.border}` }}>
      <p style={{ fontSize: 13, color: '#C9C6BF', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>
        {text}
        {streaming && (
          <span style={{ display: 'inline-block', width: 2, height: 13, background: '#E53416', marginLeft: 2, verticalAlign: 'middle', animation: 'px-blink 1s infinite' }} />
        )}
      </p>
      {!streaming && text && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {onRegenerate && (
            <button onClick={onRegenerate} disabled={disabled}
              style={{ fontSize: 11, fontWeight: 600, color: D.text2, background: '#1E1D1A', border: `1px solid ${D.border}`, borderRadius: 5, padding: '4px 10px', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--px-font)', opacity: disabled ? 0.5 : 1 }}>
              Regenerate
            </button>
          )}
        </div>
      )}
    </div>
  )
}
