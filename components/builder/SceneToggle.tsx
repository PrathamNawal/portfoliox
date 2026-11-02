'use client'

import React from 'react'

interface Props {
  value: boolean
  onChange: (on: boolean) => void
  disabled?: boolean
  /** Defaults keep the designer illustration switch. */
  label?: string
  description?: string
  /** Id prefix for the label element; must be unique per switch on a page. */
  id?: string
}

const SCENE_DESCRIPTION = 'A small looping scene of a designer at work, under your intro (Canvas layout). It animates unless Motion is Still, which shows one still frame.'

/** On/off switch (role="switch": Space or Enter toggles it). Defaults to the designer illustration. */
export function SceneToggle({ value, onChange, disabled, label = 'Designer illustration', description = SCENE_DESCRIPTION, id = 'scene-toggle' }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-labelledby={`${id}-label`}
        disabled={disabled}
        onClick={() => onChange(!value)}
        style={{ position: 'relative', flexShrink: 0, width: 36, height: 20, marginTop: 1, padding: 0, borderRadius: 999, border: 'none', cursor: disabled ? 'default' : 'pointer', background: value ? 'var(--px-accent)' : 'var(--px-surface-3)', transition: 'background 0.18s' }}
      >
        <span aria-hidden="true" style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.18s' }} />
      </button>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span id={`${id}-label`} style={{ fontSize: 12, fontWeight: 700, color: 'var(--px-text-2)', letterSpacing: '-0.01em' }}>{label}</span>
        <span style={{ fontSize: 11, lineHeight: 1.45, color: 'var(--px-text-3)', maxWidth: 420 }}>
          {description}
        </span>
      </span>
    </div>
  )
}
