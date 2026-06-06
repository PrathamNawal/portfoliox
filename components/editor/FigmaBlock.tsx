'use client'

import React, { useState } from 'react'
import { Icon } from '@/components/ui/Icon'

const D = { surface: '#161513', surface2: '#1E1D1A', border: '#2B2926', text: '#F0EEE9', text2: '#8A8780', text3: '#56534D' }

const FIGMA_PROTO_RE = /figma\.com\/proto\//

function toEmbedUrl(url: string): string {
  // Convert share URL to embed URL format
  const encoded = encodeURIComponent(url)
  return `https://www.figma.com/embed?embed_host=portfoliox&url=${encoded}`
}

interface Props {
  figmaUrl?: string
  onFigmaUrl: (url: string | undefined) => void
  sectionLabel: string
  onSectionLabel: (v: string) => void
}

const LABELS = ['Intro','Research','Ideation','Wireframes','Process','Prototype','Testing','Outcome','Learnings']

export function FigmaBlock({ figmaUrl, onFigmaUrl, sectionLabel, onSectionLabel }: Props) {
  const [input, setInput] = useState(figmaUrl || '')
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)

  const handleSet = () => {
    const trimmed = input.trim()
    if (!trimmed) { onFigmaUrl(undefined); return }
    if (!FIGMA_PROTO_RE.test(trimmed)) {
      setError('Please use a Figma prototype link (figma.com/proto/…)')
      return
    }
    setError('')
    onFigmaUrl(trimmed)
  }

  const nextLabel = () => {
    const i = LABELS.indexOf(sectionLabel)
    onSectionLabel(LABELS[(i + 1) % LABELS.length])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span onClick={nextLabel} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D.text2, cursor: 'pointer', userSelect: 'none', padding: '2px 6px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}` }}>
          {sectionLabel}
        </span>
        <span style={{ fontSize: 9, color: D.text3, letterSpacing: '0.06em' }}>FIGMA PROTOTYPE</span>
      </div>

      {figmaUrl ? (
        <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0D0D0B', borderRadius: 8, overflow: 'hidden', border: `1px solid ${D.border}` }}>
          {playing ? (
            <iframe src={toEmbedUrl(figmaUrl)} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen title="Figma prototype" />
          ) : (
            <div style={{ inset: 0, position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'linear-gradient(135deg,#1A1028,#2D1B4A)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                onClick={() => setPlaying(true)}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(229,52,22,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="8,5 19,12 8,19"/></svg>
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Click to preview prototype</span>
              <button onClick={() => { onFigmaUrl(undefined); setInput(''); setPlaying(false) }}
                style={{ position: 'absolute', top: 8, right: 8, fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ borderRadius: 8, border: `1.5px dashed ${D.border}`, padding: '24px 20px', background: '#1A1917', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="figma" size={20} />
            <span style={{ fontSize: 13, fontWeight: 600, color: D.text2 }}>Paste a Figma prototype link</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="https://www.figma.com/proto/…"
              style={{ flex: 1, height: 36, padding: '0 10px', fontSize: 12, color: D.text, background: D.surface2, border: `1px solid ${error ? '#C94040' : D.border}`, borderRadius: 6, fontFamily: 'var(--px-font)', outline: 'none' }}
              onKeyDown={e => e.key === 'Enter' && handleSet()} />
            <button onClick={handleSet} style={{ height: 36, padding: '0 14px', fontSize: 12, fontWeight: 600, color: '#fff', background: '#E53416', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--px-font)', whiteSpace: 'nowrap' }}>Embed</button>
          </div>
          {error && <span style={{ fontSize: 11, color: '#C94040' }}>{error}</span>}
          <span style={{ fontSize: 11, color: D.text3 }}>Accepts figma.com/proto/ links only. Visitors do not need a Figma account.</span>
        </div>
      )}
    </div>
  )
}
