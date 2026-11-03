'use client'

import React, { useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import type { ExperienceScreen } from '@/types'
import { MAX_SCREENS, MAX_CAPTION } from '@/lib/experience-story'

interface Props {
  value: ExperienceScreen[]
  onChange: (screens: ExperienceScreen[]) => void
  /** True while files are compressing or uploading, so the modal can hold the save button. */
  onBusyChange?: (busy: boolean) => void
  /** How many images at most (default 12). */
  max?: number
  label?: string
}

const ACCEPT = 'image/png,image/jpeg,image/webp'

function naturalSize(file: Blob): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')) }
    img.src = url
  })
}

/** Compress to webp (max 1600px), measure, upload through a signed URL. */
async function uploadScreen(file: File): Promise<ExperienceScreen> {
  const compressed = await imageCompression(file, { maxWidthOrHeight: 1600, maxSizeMB: 1.5, useWebWorker: true, fileType: 'image/webp' })
  const { w, h } = await naturalSize(compressed)
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '') || 'screen'
  const res = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: `${base}.webp`, contentType: 'image/webp', bucket: 'case-study-images' }),
  })
  if (!res.ok) throw new Error('presign')
  const { url, publicUrl } = await res.json()
  const put = await fetch(url, { method: 'PUT', body: compressed, headers: { 'Content-Type': 'image/webp' } })
  if (!put.ok) throw new Error('upload')
  return { url: publicUrl, w, h }
}

/** Screens for the Story layout: pick or drop images, reorder, caption, remove. Up to 12. */
export function ScreensEditor({ value, onChange, onBusyChange, max = MAX_SCREENS, label = 'Screens' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const latest = useRef(value)
  latest.current = value
  const [busy, setBusy] = useState(0) // files in flight
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [pageUrl, setPageUrl] = useState('')

  const setBusyCount = (n: number) => { setBusy(n); onBusyChange?.(n > 0) }

  const addFiles = async (list: FileList | File[]) => {
    const files = Array.from(list).filter(f => /^image\/(png|jpe?g|webp)$/.test(f.type))
    const rejected = Array.from(list).length - files.length
    const room = max - latest.current.length
    if (files.length === 0) { setError(rejected ? 'Only PNG, JPG or WebP images.' : ''); return }
    const take = files.slice(0, Math.max(0, room))
    const notes: string[] = []
    if (rejected) notes.push('Some files were not PNG, JPG or WebP and were skipped.')
    if (files.length > take.length) notes.push(`Limit is ${max} screens; ${files.length - take.length} not added.`)
    setError(notes.join(' '))
    if (take.length === 0) return
    setBusyCount(take.length)
    let failed = 0
    let pending = take.length
    await Promise.all(take.map(async f => {
      try {
        const s = await uploadScreen(f)
        onChange([...latest.current, s].slice(0, max))
        latest.current = [...latest.current, s]
      } catch { failed++ }
      finally { pending--; setBusyCount(pending) }
    }))
    if (failed) setError(e => `${failed} image${failed > 1 ? 's' : ''} could not be uploaded. Check your connection and try again.${e ? ' ' + e : ''}`)
  }

  // Capture a screen from a page URL: the server takes the screenshot and stores it like an upload.
  const capture = async () => {
    if (!pageUrl.trim() || busy > 0 || latest.current.length >= max) return
    setError('')
    setBusyCount(1)
    try {
      const res = await fetch('/api/screenshot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: pageUrl.trim() }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d.error || 'Could not capture that page.'); return }
      const s: ExperienceScreen = { url: d.url, w: d.w, h: d.h }
      latest.current = [...latest.current, s]
      onChange(latest.current)
      setPageUrl('')
    } catch {
      setError('Could not capture that page. Check your connection and try again.')
    } finally { setBusyCount(0) }
  }

  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const remove = (i: number) => onChange(value.filter((_, k) => k !== i))
  const caption = (i: number, v: string) => onChange(value.map((s, k) => {
    if (k !== i) return s
    const { caption: _drop, ...rest } = s
    return v ? { ...rest, caption: v.slice(0, MAX_CAPTION) } : rest
  }))

  const full = value.length >= max
  const btn: React.CSSProperties = { height: 26, minWidth: 26, padding: '0 6px', fontSize: 12, fontWeight: 700, lineHeight: 1, color: 'var(--px-text)', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--px-font)' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)', letterSpacing: '-0.01em' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--px-text-3)' }}>{value.length} / {max}</span>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); if (!full) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); if (!full) addFiles(e.dataTransfer.files) }}
        style={{ border: `1.5px dashed ${dragging ? 'var(--px-accent)' : 'var(--px-border)'}`, borderRadius: 'var(--px-r)', padding: 10, background: dragging ? 'var(--px-accent-subtle)' : 'var(--px-surface)' }}
      >
        <button type="button" disabled={full || busy > 0} onClick={() => inputRef.current?.click()}
          style={{ ...btn, width: '100%', height: 38, fontWeight: 600, color: 'var(--px-text-2)', cursor: full || busy > 0 ? 'default' : 'pointer' }}>
          {busy > 0 ? `Working on ${busy} image${busy > 1 ? 's' : ''}… (page captures can take up to 30 seconds)` : full ? 'Screen limit reached' : '+ Add screens (or drop images here)'}
        </button>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input value={pageUrl} onChange={e => setPageUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); capture() } }}
            placeholder="Or paste a page URL to capture it" aria-label="Page URL to capture" disabled={full || busy > 0} inputMode="url"
            style={{ flex: 1, minWidth: 0, height: 34, padding: '0 10px', fontSize: 13, color: 'var(--px-text)', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r)', outline: 'none', fontFamily: 'var(--px-font)' }} />
          <button type="button" onClick={capture} disabled={!pageUrl.trim() || full || busy > 0} style={{ ...btn, height: 34, padding: '0 12px', fontWeight: 600, cursor: !pageUrl.trim() || full || busy > 0 ? 'default' : 'pointer' }}>Capture</button>
        </div>
        <input ref={inputRef} type="file" accept={ACCEPT} multiple style={{ display: 'none' }}
          onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }} />

        {value.length > 0 && (
          <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
            {value.map((s, i) => (
              <li key={`${s.url}-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <div style={{ position: 'relative', aspectRatio: '4 / 3', background: 'var(--px-surface-2)', border: '1px solid var(--px-border)', borderRadius: 8, overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url} alt={s.caption || `Screen ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" style={btn} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move screen ${i + 1} left`}>←</button>
                  <button type="button" style={btn} onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={`Move screen ${i + 1} right`}>→</button>
                  <button type="button" style={{ ...btn, marginLeft: 'auto', color: '#C94040' }} onClick={() => remove(i)} aria-label={`Remove screen ${i + 1}`}>Remove</button>
                </div>
                <input value={s.caption ?? ''} onChange={e => caption(i, e.target.value)} maxLength={MAX_CAPTION} placeholder="Caption (optional)" aria-label={`Caption for screen ${i + 1}`}
                  style={{ height: 30, padding: '0 8px', fontSize: 12, color: 'var(--px-text)', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 6, outline: 'none', fontFamily: 'var(--px-font)', width: '100%', boxSizing: 'border-box' }} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <p style={{ fontSize: 11, color: 'var(--px-text-3)', margin: '6px 0 0', lineHeight: 1.4 }}>
        Export from Figma as PNG, JPG or WebP, or paste a public page URL. Images are resized to 1600px and shown in order; tall ones get a phone frame. Page captures use free services and can fail when they are busy.
      </p>
      {error && <p role="alert" style={{ fontSize: 12, color: '#C94040', margin: '6px 0 0' }}>{error}</p>}
    </div>
  )
}
