'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Btn, IconBtn } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PXLogo, Spinner, Toggle } from '@/components/ui/Misc'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { ImageSlot } from '@/components/editor/ImageSlot'
import { FigmaBlock } from '@/components/editor/FigmaBlock'
import { CompareBlock } from '@/components/editor/CompareBlock'
import { TextBlock } from '@/components/editor/TextBlock'
import { GeneratingText } from '@/components/editor/GeneratingText'
import type { Block, BlockType, CaseStudy } from '@/types'

const DARK  = { bg: '#0D0D0B', surface: '#161513', surface2: '#1E1D1A', border: '#2B2926', text: '#F0EEE9', text2: '#8A8780', text3: '#56534D' }
const LIGHT = { bg: '#F8F7F4', surface: '#FFFFFF', surface2: '#F2F0EC', border: '#E4E2DC', text: '#1C1B18', text2: '#6C6960', text3: '#9A978E' }
// D is set dynamically in the component based on lightMode state
const D = DARK // default — overridden inside component

const BLOCK_TYPES = [
  { id: 'image',   label: 'Image',         icon: 'image',    desc: 'Single image with caption' },
  { id: 'gallery', label: 'Gallery',        icon: 'grid2',    desc: '2–4 images with captions' },
  { id: 'figma',   label: 'Figma embed',   icon: 'figma',    desc: 'Prototype embed' },
  { id: 'compare', label: 'Before / After', icon: 'compareH', desc: 'Comparison slider' },
  { id: 'text',    label: 'Text',           icon: 'text',     desc: 'Rich text block' },
] as const

function makeBlock(type: BlockType): Block {
  return {
    id: Math.random().toString(36).slice(2),
    type,
    sectionLabel: 'Process',
    caption: '',
    imageUrl: undefined,
    images: type === 'gallery' ? [{ url: '', caption: '' }, { url: '', caption: '' }] : undefined,
    figmaUrl: undefined,
    beforeUrl: undefined,
    afterUrl: undefined,
    html: '',
  }
}

// ── Gallery Block ─────────────────────────────────────────────────────────────
type Palette = typeof DARK
function GalleryBlock({ block, onChange, D }: { block: Block; onChange: (b: Block) => void; D: Palette }) {
  const imgs = block.images || [{ url: '', caption: '' }, { url: '', caption: '' }]
  const canAdd = imgs.length < 4

  const upload = async (idx: number, file: File) => {
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return
    const { default: compress } = await import('browser-image-compression')
    const compressed = await compress(file, { maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true })
    const res = await fetch('/api/upload/presign', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    })
    const { url, publicUrl } = await res.json()
    await fetch(url, { method: 'PUT', body: compressed, headers: { 'Content-Type': file.type } })
    const next = [...imgs]
    next[idx] = { ...next[idx], url: publicUrl }
    onChange({ ...block, images: next })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D.text2, padding: '2px 6px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}` }}>{block.sectionLabel}</span>
        <span style={{ fontSize: 9, color: D.text3, letterSpacing: '0.06em' }}>GALLERY ({imgs.length})</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${imgs.length}, 1fr)`, gap: 8 }}>
        {imgs.map((img, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <div style={{ aspectRatio: '4/3', background: img.url ? `url(${img.url}) center/cover` : '#1A1917', border: `1.5px dashed ${D.border}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = e => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) upload(i, f) }; inp.click() }}>
              {!img.url && <Icon name="upload" size={16} color={D.text3} />}
            </div>
            <input value={img.caption} onChange={e => { const next = [...imgs]; next[i] = { ...next[i], caption: e.target.value }; onChange({ ...block, images: next }) }} placeholder="Caption…"
              style={{ width: '100%', fontSize: 11, color: D.text2, background: 'transparent', border: 'none', borderBottom: `1px solid ${D.border}`, padding: '3px 0', marginTop: 4, fontFamily: 'var(--px-font)', outline: 'none' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {canAdd && <button onClick={() => onChange({ ...block, images: [...imgs, { url: '', caption: '' }] })} style={{ fontSize: 11, color: D.text3, background: 'none', border: `1px dashed ${D.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>+ Add image</button>}
        {imgs.length > 2 && <button onClick={() => onChange({ ...block, images: imgs.slice(0, -1) })} style={{ fontSize: 11, color: '#C94040', background: 'none', border: `1px dashed #C94040`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>Remove last</button>}
      </div>
    </div>
  )
}

// ── Dynamic Block ─────────────────────────────────────────────────────────────
function DynamicBlock({ block, onChange, onDelete, index, draggableProps, dragHandleProps, innerRef, D }: {
  block: Block
  onChange: (b: Block) => void
  onDelete: () => void
  index: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  draggableProps: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleProps: any
  innerRef: (el: HTMLElement | null) => void
  D: Palette
}) {
  const [hover, setHover] = useState(false)

  return (
    <div ref={innerRef} {...draggableProps}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', padding: '14px 0' }}>
      {/* Block controls */}
      <div style={{ position: 'absolute', right: 0, top: 14, display: 'flex', alignItems: 'center', gap: 4, opacity: hover ? 1 : 0, transition: 'opacity 0.15s', zIndex: 1 }}>
        <div {...(dragHandleProps || {})} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', color: D.text3, borderRadius: 4, background: D.surface2 }}>
          <Icon name="drag" size={14} />
        </div>
        <button onClick={onDelete} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#C94040', borderRadius: 4, background: D.surface2, border: 'none' }}>
          <Icon name="trash" size={13} />
        </button>
      </div>

      {/* Block content */}
      {block.type === 'image' && (
        <ImageSlot label={`block-${index}`} ratio="16/9"
          sectionLabel={block.sectionLabel} onSectionLabel={v => onChange({ ...block, sectionLabel: v })}
          caption={block.caption || ''} onCaption={v => onChange({ ...block, caption: v })}
          imageUrl={block.imageUrl} onImageUrl={url => onChange({ ...block, imageUrl: url })} />
      )}
      {block.type === 'gallery' && <GalleryBlock block={block} onChange={onChange} D={D} />}
      {block.type === 'figma' && (
        <FigmaBlock figmaUrl={block.figmaUrl} onFigmaUrl={url => onChange({ ...block, figmaUrl: url })}
          sectionLabel={block.sectionLabel} onSectionLabel={v => onChange({ ...block, sectionLabel: v })} />
      )}
      {block.type === 'compare' && (
        <CompareBlock beforeUrl={block.beforeUrl} afterUrl={block.afterUrl}
          onBefore={url => onChange({ ...block, beforeUrl: url })} onAfter={url => onChange({ ...block, afterUrl: url })}
          sectionLabel={block.sectionLabel} onSectionLabel={v => onChange({ ...block, sectionLabel: v })} />
      )}
      {block.type === 'text' && (
        <TextBlock html={block.html || ''} onHtml={v => onChange({ ...block, html: v })}
          sectionLabel={block.sectionLabel} onSectionLabel={v => onChange({ ...block, sectionLabel: v })} />
      )}
    </div>
  )
}

// ── Main Editor Page ──────────────────────────────────────────────────────────
export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [lightMode, setLightMode] = useState(false)
  const P = lightMode ? LIGHT : DARK // active palette

  const [cs, setCs] = useState<CaseStudy | null>(null)
  const [title, setTitle] = useState('Untitled')
  const [editTitle, setEditTitle] = useState(false)
  const [problem, setProblem] = useState('')
  const [whatIDid, setWhatIDid] = useState('')
  const [outcome, setOutcome] = useState('')
  const [published, setPublished] = useState(false)

  // Cover slot
  const [coverUrl, setCoverUrl] = useState<string | undefined>()
  const [coverCaption, setCoverCaption] = useState('')
  const [coverLabel, setCoverLabel] = useState('Intro')

  // Dynamic blocks
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 'default-p1', type: 'image', sectionLabel: 'Research', caption: '', imageUrl: undefined },
    { id: 'default-p2', type: 'image', sectionLabel: 'Process', caption: '', imageUrl: undefined },
    { id: 'default-p3', type: 'image', sectionLabel: 'Testing', caption: '', imageUrl: undefined },
    { id: 'default-out', type: 'image', sectionLabel: 'Outcome', caption: '', imageUrl: undefined },
  ])

  // NDA
  const [ndaEnabled, setNdaEnabled] = useState(false)
  const [ndaPassword, setNdaPassword] = useState('')
  const [ndaPasswordError, setNdaPasswordError] = useState('')

  // Metadata
  const [metadata, setMetadata] = useState({ role: '', duration: '', platform: '', client: '' })

  // AI generation
  const [generated, setGenerated] = useState<Record<string, string>>({ intro: '', process: '', outcome: '' })
  const [streaming, setStreaming] = useState<string | null>(null)
  const [thinking, setThinking] = useState(false)
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null)

  // Save state
  const [saved, setSaved] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const [activeBlockType, setActiveBlockType] = useState<BlockType>('image')

  const canGenerate = problem.length > 10 && whatIDid.length > 10

  // Load
  useEffect(() => {
    fetch(`/api/case-studies/${id}`).then(async r => {
      if (!r.ok) { router.push('/dashboard'); return }
      const data: CaseStudy = await r.json()
      setCs(data)
      setTitle(data.title)
      setProblem(data.problem || '')
      setWhatIDid(data.what_i_did || '')
      setOutcome(data.outcome_notes || '')
      setNdaEnabled(data.nda_enabled)
      setPublished(data.published)
      setCoverUrl(data.cover_image_url || undefined)
      if (data.blocks?.length) setBlocks(data.blocks)
      if (data.metadata) setMetadata({ role: (data.metadata as any).role || '', duration: (data.metadata as any).duration || '', platform: (data.metadata as any).platform || '', client: (data.metadata as any).client || '' })
      if (data.ai_generated) setGenerated({ intro: data.ai_generated.intro || '', process: data.ai_generated.process || '', outcome: data.ai_generated.outcome || '' })
    })
    fetch('/api/ai/credits').then(async r => { if (r.ok) { const d = await r.json(); setCreditsLeft(d.credits_remaining) } })
  }, [id, router])

  // Auto-save (30s debounce)
  const markDirty = useCallback(() => {
    setSaved(false)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch(`/api/case-studies/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, problem, what_i_did: whatIDid, outcome_notes: outcome, nda_enabled: ndaEnabled, cover_image_url: coverUrl || null, blocks, metadata, published }),
      }).then(() => setSaved(true))
    }, 30000)
  }, [id, title, problem, whatIDid, outcome, ndaEnabled, coverUrl, blocks, metadata, published])

  const saveNow = useCallback(async () => {
    clearTimeout(saveTimer.current)
    await fetch(`/api/case-studies/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, problem, what_i_did: whatIDid, outcome_notes: outcome, nda_enabled: ndaEnabled, nda_password_hash: ndaPassword || undefined, cover_image_url: coverUrl || null, blocks, metadata, published }),
    })
    setSaved(true)
  }, [id, title, problem, whatIDid, outcome, ndaEnabled, ndaPassword, coverUrl, blocks, metadata, published])

  // NDA password handling
  const handleNdaToggle = (v: boolean) => { setNdaEnabled(v); markDirty() }
  const handleNdaSave = async () => {
    if (ndaPassword.length < 6) { setNdaPasswordError('Password must be at least 6 characters'); return }
    setNdaPasswordError('')
    // Hash password server-side — send plaintext, API hashes it
    await fetch(`/api/case-studies/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nda_enabled: true, nda_password: ndaPassword }), // server hashes
    })
    setSaved(true)
  }

  // AI generation for one section
  const generateSection = useCallback(async (section: 'intro' | 'process' | 'outcome') => {
    if (!canGenerate || streaming) return
    if (creditsLeft !== null && creditsLeft <= 0) { alert('No AI credits remaining. Upgrade to Pro for more.'); return }

    setThinking(true)
    await new Promise(r => setTimeout(r, 650))
    setThinking(false)
    setStreaming(section)
    setGenerated(g => ({ ...g, [section]: '' }))

    let attempt = 0
    while (attempt < 2) {
      attempt++
      const res = await fetch('/api/ai/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseStudyId: id, section, problem, whatIDid, outcome }),
      })
      if (res.status === 402) { alert('No credits left. Upgrade to Pro.'); break }
      if (!res.ok || !res.body) break

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let full = ''
      let retry = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of dec.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break
          if (payload === '[FILLER]') { retry = true; break }
          if (payload === '[ERROR]') { retry = true; break }
          full += payload
          setGenerated(g => ({ ...g, [section]: full }))
        }
        if (retry) break
      }

      if (!retry) break
      setGenerated(g => ({ ...g, [section]: '' }))
    }

    setStreaming(null)
    if (creditsLeft !== null) setCreditsLeft(c => c !== null ? c - 1 : null)
    markDirty()
  }, [canGenerate, streaming, creditsLeft, id, problem, whatIDid, outcome, markDirty])

  const generateAll = () => generateSection('intro')

  // Block management
  const addBlock = () => {
    setBlocks(bs => [...bs, makeBlock(activeBlockType)])
    markDirty()
  }

  const updateBlock = (idx: number, b: Block) => { setBlocks(bs => bs.map((x, i) => i === idx ? b : x)); markDirty() }
  const deleteBlock = (idx: number) => { setBlocks(bs => bs.filter((_, i) => i !== idx)); markDirty() }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const next = Array.from(blocks)
    const [removed] = next.splice(result.source.index, 1)
    next.splice(result.destination.index, 0, removed)
    setBlocks(next)
    markDirty()
  }

  const isGenerating = thinking || !!streaming

  return (
    <div className="px-screen" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: P.bg, color: P.text, overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: `1px solid ${P.border}`, background: P.surface, flexShrink: 0, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => { saveNow(); router.push('/dashboard') }} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: P.text2, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--px-font)', fontWeight: 500, padding: '4px 6px', borderRadius: 5 }}>
            <Icon name="arrowLeft" size={14} /> Builder
          </button>
          <div style={{ width: 1, height: 16, background: P.border }} />
          {editTitle ? (
            <input value={title} onChange={e => { setTitle(e.target.value); markDirty() }} onBlur={() => setEditTitle(false)} autoFocus
              style={{ fontSize: 14, fontWeight: 700, color: P.text, background: 'transparent', border: 'none', borderBottom: '1px solid #E53416', outline: 'none', fontFamily: 'var(--px-font)', letterSpacing: '-0.02em', width: 240, padding: '2px 0' }} />
          ) : (
            <span onClick={() => setEditTitle(true)} title="Click to rename" style={{ fontSize: 14, fontWeight: 700, color: P.text, letterSpacing: '-0.02em', cursor: 'text', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Save indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: saved ? '#3DBE6A' : P.text3 }}>
            <Icon name={saved ? 'checkCircle' : 'edit'} size={13} />
            {saved ? 'Saved' : 'Unsaved'}
          </div>
          {/* Credits */}
          {creditsLeft !== null && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, color: creditsLeft > 3 ? P.text3 : '#B86E0A', background: creditsLeft > 3 ? P.surface2 : '#FEF3E4', border: `1px solid ${creditsLeft > 3 ? P.border : '#B86E0A'}` }}>
              {creditsLeft} credit{creditsLeft !== 1 ? 's' : ''}
            </span>
          )}
          {/* Light/dark toggle */}
          <button onClick={() => setLightMode(m => !m)} title={lightMode ? 'Switch to dark' : 'Switch to light'}
            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 10px', fontSize: 12, fontWeight: 600, borderRadius: 7, background: P.surface2, color: P.text2, border: `1px solid ${P.border}`, cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
            <Icon name={lightMode ? 'moon' : 'sun'} size={13} /> {lightMode ? 'Dark' : 'Light'}
          </button>
          {/* Publish toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: P.surface2, border: `1px solid ${P.border}`, borderRadius: 6 }}>
            <span style={{ fontSize: 12, color: P.text2, fontWeight: 500 }}>{published ? 'Published' : 'Draft'}</span>
            <Toggle value={published} onChange={v => { setPublished(v); markDirty() }} size="sm" />
          </div>
          <div style={{ width: 1, height: 16, background: P.border }} />
          {/* Generate narrative */}
          <button onClick={generateAll} disabled={!canGenerate || isGenerating}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', borderRadius: 7, background: canGenerate && !isGenerating ? '#E53416' : P.surface2, color: canGenerate && !isGenerating ? '#fff' : P.text3, border: `1px solid ${P.border}`, cursor: canGenerate ? 'pointer' : 'not-allowed', fontFamily: 'var(--px-font)', position: 'relative', overflow: 'hidden' }}>
            {thinking ? <Spinner size={12} /> : isGenerating ? <Spinner size={12} /> : <Icon name="sparkle" size={14} />}
            {thinking ? 'Thinking…' : isGenerating ? `Generating ${streaming}…` : 'Generate narrative'}
          </button>
          <button onClick={saveNow} style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', fontSize: 13, fontWeight: 600, borderRadius: 7, background: P.surface2, color: P.text2, border: `1px solid ${P.border}`, cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
            Save
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel — block types + metadata */}
        <div style={{ width: 196, borderRight: `1px solid ${P.border}`, background: P.surface, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ padding: '14px 12px 8px', fontSize: 10, fontWeight: 700, color: P.text3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Block Types</div>
          {BLOCK_TYPES.map(bt => (
            <button key={bt.id} onClick={() => setActiveBlockType(bt.id as BlockType)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: activeBlockType === bt.id ? (lightMode ? '#F2F0EC' : '#252420') : 'transparent', border: 'none', borderLeft: `2px solid ${activeBlockType === bt.id ? '#E53416' : 'transparent'}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--px-font)', transition: 'all 0.12s' }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: activeBlockType === bt.id ? (lightMode ? '#E4E2DC' : '#2A2926') : P.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={bt.icon as any} size={15} color={activeBlockType === bt.id ? '#E53416' : P.text2} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: activeBlockType === bt.id ? P.text : P.text2, letterSpacing: '-0.01em' }}>{bt.label}</div>
                <div style={{ fontSize: 10, color: P.text3, lineHeight: 1.3 }}>{bt.desc}</div>
              </div>
            </button>
          ))}

          <button onClick={addBlock} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '10px 12px', height: 34, fontSize: 12, fontWeight: 600, color: '#E53416', background: 'rgba(229,52,22,0.08)', border: '1px dashed rgba(229,52,22,0.3)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--px-font)', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(229,52,22,0.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(229,52,22,0.08)')}>
            <Icon name="plus" size={14} /> Add block
          </button>

          <div style={{ margin: '4px 12px', height: 1, background: P.border }} />

          {/* Project metadata */}
          <div style={{ padding: '10px 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: P.text3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Project Info</div>
            {[
              { key: 'role', label: 'My Role', ph: 'Lead Designer' },
              { key: 'client', label: 'Client', ph: 'Optional' },
              { key: 'duration', label: 'Duration', ph: '10 weeks' },
              { key: 'platform', label: 'Platform', ph: 'Web, iOS…' },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 10, color: P.text3, marginBottom: 3, fontWeight: 600, letterSpacing: '0.03em' }}>{f.label}</div>
                <input value={(metadata as any)[f.key]} onChange={e => { setMetadata(m => ({ ...m, [f.key]: e.target.value })); markDirty() }} placeholder={f.ph}
                  style={{ width: '100%', fontSize: 12, color: P.text, background: P.surface2, border: `1px solid ${P.border}`, borderRadius: 5, padding: '4px 8px', fontFamily: 'var(--px-font)', outline: 'none', transition: 'border-color 0.12s' }}
                  onFocus={e => (e.target.style.borderColor = '#E53416')}
                  onBlur={e => (e.target.style.borderColor = P.border)} />
              </div>
            ))}

            {/* NDA toggle */}
            <div style={{ marginTop: 4, padding: '10px', background: ndaEnabled ? 'rgba(229,52,22,0.05)' : P.surface2, borderRadius: 6, border: `1px solid ${ndaEnabled ? 'rgba(229,52,22,0.2)' : P.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: ndaEnabled ? 8 : 0 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: P.text2, letterSpacing: '-0.01em' }}>NDA Protected</div>
                  <div style={{ fontSize: 10, color: P.text3 }}>Require password</div>
                </div>
                <Toggle value={ndaEnabled} onChange={handleNdaToggle} size="sm" />
              </div>
              {ndaEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input value={ndaPassword} onChange={e => setNdaPassword(e.target.value)} placeholder="Min 6 characters" type="password"
                    style={{ width: '100%', fontSize: 12, color: P.text, background: P.bg, border: `1px solid ${ndaPasswordError ? '#C94040' : P.border}`, borderRadius: 5, padding: '5px 8px', fontFamily: 'var(--px-font)', outline: 'none' }} />
                  {ndaPasswordError && <span style={{ fontSize: 10, color: '#C94040' }}>{ndaPasswordError}</span>}
                  <button onClick={handleNdaSave} style={{ height: 28, fontSize: 11, fontWeight: 600, color: '#fff', background: '#E53416', border: 'none', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
                    Set password
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center canvas */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 48px', background: P.bg }}>
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 4 }}>

            {/* Cover section */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.text3 }}>Cover</span>
                <div style={{ flex: 1, height: 1, background: P.border }} />
              </div>
              <ImageSlot label="cover" ratio="16/9" enforceRatio
                sectionLabel={coverLabel} onSectionLabel={v => { setCoverLabel(v); markDirty() }}
                caption={coverCaption} onCaption={v => { setCoverCaption(v); markDirty() }}
                imageUrl={coverUrl} onImageUrl={u => { setCoverUrl(u); markDirty() }} />
              <GeneratingText text={generated.intro} streaming={streaming === 'intro'}
                onRegenerate={() => generateSection('intro')} disabled={isGenerating || !canGenerate} />
            </div>

            {/* Dynamic blocks with DnD */}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="blocks">
                {provided => (
                  <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: 'flex', flexDirection: 'column' }}>
                    {blocks.map((block, idx) => (
                      <Draggable key={block.id} draggableId={block.id} index={idx}>
                        {(provided) => (
                          <DynamicBlock
                            block={block}
                            onChange={b => updateBlock(idx, b)}
                            onDelete={() => deleteBlock(idx)}
                            index={idx}
                            draggableProps={provided.draggableProps}
                            dragHandleProps={provided.dragHandleProps}
                            innerRef={provided.innerRef}
                            D={P}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Process narrative */}
            {generated.process && (
              <GeneratingText text={generated.process} streaming={streaming === 'process'}
                onRegenerate={() => generateSection('process')} disabled={isGenerating || !canGenerate} />
            )}

            {/* Outcome narrative */}
            {generated.outcome && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.text3 }}>Outcome Narrative</span>
                  <div style={{ flex: 1, height: 1, background: P.border }} />
                </div>
                <GeneratingText text={generated.outcome} streaming={streaming === 'outcome'}
                  onRegenerate={() => generateSection('outcome')} disabled={isGenerating || !canGenerate} />
              </div>
            )}

            {/* Add block CTA */}
            <button onClick={addBlock}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, height: 44, fontSize: 13, fontWeight: 600, color: P.text3, background: 'transparent', border: `1.5px dashed ${P.border}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--px-font)', transition: 'border-color 0.15s, color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E53416'; (e.currentTarget as HTMLButtonElement).style.color = '#E53416' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = P.border; (e.currentTarget as HTMLButtonElement).style.color = P.text3 }}>
              <Icon name="plus" size={15} /> Add {activeBlockType} block
            </button>
          </div>
        </div>

        {/* Right panel — Case Brief */}
        <div style={{ width: 272, borderLeft: `1px solid ${P.border}`, background: P.surface, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${P.border}` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: P.text, letterSpacing: '-0.01em' }}>Case Brief</span>
            <Badge color="default" size="xs">AI Context</Badge>
          </div>
          <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
            {[
              { key: 'problem', label: 'Problem', value: problem, onChange: setProblem, required: true, placeholder: 'What problem were you brought in to solve?', rows: 4 },
              { key: 'whatIDid', label: 'What I did', value: whatIDid, onChange: setWhatIDid, required: true, placeholder: 'How did you approach it — research, decisions, tradeoffs.', rows: 4 },
              { key: 'outcome', label: 'Outcome', value: outcome, onChange: setOutcome, required: false, placeholder: 'What changed? Metrics, team impact, learnings.', rows: 3 },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: P.text2, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  {f.label} {f.required && <span style={{ color: '#E53416' }}>*</span>}
                </label>
                <textarea value={f.value} onChange={e => { f.onChange(e.target.value); markDirty() }} placeholder={f.placeholder} rows={f.rows}
                  style={{ width: '100%', fontSize: 12, lineHeight: 1.6, color: P.text, background: P.surface2, border: `1px solid ${P.border}`, borderRadius: 6, padding: '8px 10px', resize: 'none', fontFamily: 'var(--px-font)', outline: 'none', transition: 'border 0.12s' }}
                  onFocus={e => (e.target.style.borderColor = '#E53416')}
                  onBlur={e => (e.target.style.borderColor = P.border)} />
              </div>
            ))}
          </div>

          {/* Generate CTA */}
          <div style={{ padding: '12px 14px', borderTop: `1px solid ${P.border}`, background: P.surface }}>
            {!canGenerate && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '8px 10px', background: P.surface2, borderRadius: 6, border: `1px dashed ${P.border}`, marginBottom: 8 }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>✦</span>
                <p style={{ fontSize: 11, color: P.text2, lineHeight: 1.5, margin: 0 }}>
                  Fill in <strong style={{ color: P.text }}>Problem</strong> and <strong style={{ color: P.text }}>What I did</strong> to unlock generation.
                </p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(['intro', 'process', 'outcome'] as const).map(section => (
                <button key={section} onClick={() => generateSection(section)} disabled={!canGenerate || isGenerating}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 32, fontSize: 12, fontWeight: 600, borderRadius: 6, background: streaming === section ? '#E53416' : P.surface2, color: canGenerate ? (streaming === section ? '#fff' : P.text2) : P.text3, border: `1px solid ${streaming === section ? '#E53416' : P.border}`, cursor: canGenerate ? 'pointer' : 'not-allowed', fontFamily: 'var(--px-font)', transition: 'all 0.15s', position: 'relative', overflow: 'hidden', textTransform: 'capitalize' }}>
                  {thinking && streaming === null ? <Spinner size={11} color={P.text2} /> : <Icon name="sparkle" size={12} />}
                  {streaming === section ? `Generating…` : `${section} section`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
