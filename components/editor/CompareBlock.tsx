'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Icon } from '@/components/ui/Icon'

const D = { surface2: '#1E1D1A', border: '#2B2926', text: '#F0EEE9', text2: '#8A8780', text3: '#56534D' }
const LABELS = ['Intro','Research','Ideation','Wireframes','Process','Prototype','Testing','Outcome','Learnings']

interface Props {
  beforeUrl?: string
  afterUrl?: string
  onBefore: (url: string | undefined) => void
  onAfter: (url: string | undefined) => void
  sectionLabel: string
  onSectionLabel: (v: string) => void
}

function UploadZone({ label, url, onUrl }: { label: string; url?: string; onUrl: (u: string | undefined) => void }) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return
    setUploading(true)
    try {
      const { default: compress } = await import('browser-image-compression')
      const compressed = await compress(file, { maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true })
      const res = await fetch('/api/upload/presign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      const { url: signedUrl, publicUrl } = await res.json()
      await fetch(signedUrl, { method: 'PUT', body: compressed, headers: { 'Content-Type': file.type } })
      onUrl(publicUrl)
    } finally { setUploading(false) }
  }

  return (
    <div style={{ flex: 1, position: 'relative', aspectRatio: '4/3', background: url ? `url(${url}) center/cover` : '#1A1917', border: `1.5px dashed ${D.border}`, borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: url ? 'default' : 'pointer', overflow: 'hidden' }}
      onClick={() => !url && ref.current?.click()}>
      <div style={{ position: 'absolute', top: 6, left: 8, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 3 }}>{label}</div>
      {uploading ? (
        <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #E53416', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      ) : !url && (
        <>
          <Icon name="upload" size={18} color={D.text3} />
          <span style={{ fontSize: 10, color: D.text3 }}>Upload {label}</span>
        </>
      )}
      {url && (
        <button onClick={e => { e.stopPropagation(); onUrl(undefined) }}
          style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 10, color: '#fff', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
          Remove
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
    </div>
  )
}

// Interactive slider for preview — only when both images loaded
function Slider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const [pos, setPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setPos(pct)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', cursor: 'col-resize', userSelect: 'none' }}
      onMouseMove={e => handleMove(e.clientX)}
      onTouchMove={e => handleMove(e.touches[0].clientX)}>
      <img src={afterUrl} alt="After" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${pos}%` }}>
        <img src={beforeUrl} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover', minWidth: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }} />
      </div>
      {/* Drag handle */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, transform: 'translateX(-50%)', width: 2, background: '#fff', boxShadow: '0 0 8px rgba(0,0,0,0.4)' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 32, height: 32, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M4 2L1 6l3 4M8 2l3 4-3 4" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
      </div>
      {/* Labels */}
      <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.04em' }}>BEFORE</span>
      <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.04em' }}>AFTER</span>
    </div>
  )
}

export function CompareBlock({ beforeUrl, afterUrl, onBefore, onAfter, sectionLabel, onSectionLabel }: Props) {
  const nextLabel = () => { const i = LABELS.indexOf(sectionLabel); onSectionLabel(LABELS[(i + 1) % LABELS.length]) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span onClick={nextLabel} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D.text2, cursor: 'pointer', userSelect: 'none', padding: '2px 6px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}` }}>{sectionLabel}</span>
        <span style={{ fontSize: 9, color: D.text3, letterSpacing: '0.06em' }}>BEFORE / AFTER</span>
      </div>
      {beforeUrl && afterUrl ? (
        <Slider beforeUrl={beforeUrl} afterUrl={afterUrl} />
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <UploadZone label="Before" url={beforeUrl} onUrl={onBefore} />
          <UploadZone label="After" url={afterUrl} onUrl={onAfter} />
        </div>
      )}
      {(beforeUrl || afterUrl) && !(beforeUrl && afterUrl) && (
        <span style={{ fontSize: 11, color: D.text3 }}>Upload both images to enable the comparison slider.</span>
      )}
    </div>
  )
}
