'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Icon } from '@/components/ui/Icon'

const SECTION_LABELS = ['Intro','Research','Ideation','Wireframes','Process','Prototype','Testing','Outcome','Learnings']

const D = { bg: '#0D0D0B', surface: '#161513', surface2: '#1E1D1A', border: '#2B2926', text: '#F0EEE9', text2: '#8A8780', text3: '#56534D' }

const GRADS = [
  'linear-gradient(135deg,#2A1B4A,#5B3FA6)',
  'linear-gradient(135deg,#0D1A2A,#1A4A6A)',
  'linear-gradient(135deg,#1A1028,#3A2856)',
]

interface Props {
  label: string
  ratio?: string
  sectionLabel: string
  onSectionLabel: (v: string) => void
  caption: string
  onCaption: (v: string) => void
  imageUrl?: string
  onImageUrl: (url: string | undefined) => void
  enforceRatio?: boolean // 16:9 enforced (cover image)
}

export function ImageSlot({ label, ratio = '4/3', sectionLabel, onSectionLabel, caption, onCaption, imageUrl, onImageUrl, enforceRatio }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const grad = GRADS[label.charCodeAt(0) % GRADS.length]

  const nextLabel = () => {
    const i = SECTION_LABELS.indexOf(sectionLabel)
    onSectionLabel(SECTION_LABELS[(i + 1) % SECTION_LABELS.length])
  }

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return }
    setUploading(true)
    try {
      const { default: compress } = await import('browser-image-compression')
      const compressed = await compress(file, { maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true })
      const res = await fetch('/api/upload/presign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      const { url, publicUrl } = await res.json()
      await fetch(url, { method: 'PUT', body: compressed, headers: { 'Content-Type': file.type } })
      onImageUrl(publicUrl)
    } catch { alert('Upload failed — try again') }
    finally { setUploading(false) }
  }, [onImageUrl])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Section label pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span onClick={nextLabel} title="Click to change label"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D.text2, cursor: 'pointer', userSelect: 'none', padding: '2px 6px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}`, transition: 'background 0.1s' }}>
          {sectionLabel}
        </span>
        {enforceRatio && <span style={{ fontSize: 9, color: D.text3, letterSpacing: '0.06em' }}>16:9 COVER</span>}
      </div>

      {/* Drop zone */}
      <div onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => !imageUrl && inputRef.current?.click()}
        style={{ aspectRatio: ratio, background: imageUrl ? `url(${imageUrl}) center/cover` : dragOver ? '#252420' : '#1A1917', border: `1.5px dashed ${dragOver ? '#E53416' : imageUrl ? 'transparent' : D.border}`, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: imageUrl ? 'default' : 'pointer', position: 'relative', overflow: 'hidden', animation: imageUrl ? 'px-slot-reveal 0.28s var(--ease-out) both' : 'none', minHeight: 60 }}>
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #E53416', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: 11, color: D.text3 }}>Uploading…</span>
          </div>
        ) : imageUrl ? (
          <div style={{ position: 'absolute', inset: 0, opacity: 0, transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
            <div style={{ background: 'rgba(0,0,0,0.6)', inset: 0, position: 'absolute' }} />
            <button onClick={() => inputRef.current?.click()} style={{ position: 'relative', zIndex: 1, fontSize: 11, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>Replace</button>
            <button onClick={() => onImageUrl(undefined)} style={{ position: 'relative', zIndex: 1, fontSize: 11, fontWeight: 600, color: '#fff', background: 'rgba(229,52,22,0.5)', border: '1px solid rgba(229,52,22,0.4)', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>Remove</button>
          </div>
        ) : (
          <>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#252420', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="upload" size={16} color={D.text3} />
            </div>
            <span style={{ fontSize: 11, color: D.text3, fontWeight: 500 }}>Drop image or click</span>
            <span style={{ fontSize: 10, color: D.text3 }}>Max 5MB · PNG, JPG, WEBP</span>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />

      {/* Caption */}
      <input value={caption} onChange={e => onCaption(e.target.value)} placeholder="Add caption…"
        style={{ fontSize: 11, color: D.text2, background: 'transparent', border: 'none', borderBottom: `1px solid ${D.border}`, padding: '4px 0', fontFamily: 'var(--px-font)', outline: 'none', transition: 'border-color 0.12s' }}
        onFocus={e => (e.target.style.borderColor = '#E53416')}
        onBlur={e => (e.target.style.borderColor = D.border)} />
    </div>
  )
}
