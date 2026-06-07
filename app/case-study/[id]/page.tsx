'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Btn, IconBtn } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PXLogo, Toggle, Spinner } from '@/components/ui/Misc'
import { Icon } from '@/components/ui/Icon'
import { ImageSlot } from '@/components/editor/ImageSlot'
import { FigmaBlock } from '@/components/editor/FigmaBlock'
import { CompareBlock } from '@/components/editor/CompareBlock'
import { TextBlock } from '@/components/editor/TextBlock'
import { SECTION_DEFS, makeSection } from '@/lib/case-study-templates'
import type { Block, BlockType, CaseStudy, CaseSection, OverviewData, CaseSectionType } from '@/types'

// ── Palettes ──────────────────────────────────────────────────────────────────
const DARK  = { bg: '#0D0D0B', surface: '#161513', surface2: '#1E1D1A', border: '#2B2926', text: '#F0EEE9', text2: '#8A8780', text3: '#56534D' }
const LIGHT = { bg: '#F8F7F4', surface: '#FFFFFF',  surface2: '#F2F0EC', border: '#E4E2DC', text: '#1C1B18', text2: '#6C6960', text3: '#9A978E' }
type Palette = typeof DARK

// ── Block factory ─────────────────────────────────────────────────────────────
function makeBlock(type: BlockType): Block {
  return {
    id: Math.random().toString(36).slice(2),
    type, sectionLabel: '', caption: '',
    images: type === 'gallery' ? [{ url: '', caption: '' }, { url: '', caption: '' }] : undefined,
  }
}

// ── Upload helper ─────────────────────────────────────────────────────────────
async function uploadFile(file: File): Promise<string> {
  const { default: compress } = await import('browser-image-compression')
  const compressed = await compress(file, { maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true })
  const res = await fetch('/api/upload/presign', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  })
  const { url, publicUrl } = await res.json()
  await fetch(url, { method: 'PUT', body: compressed, headers: { 'Content-Type': file.type } })
  return publicUrl
}

// ── Overview Card ─────────────────────────────────────────────────────────────
function OverviewCard({ data, onChange, P, coverUrl, onCoverUrl }: {
  data: OverviewData
  onChange: (d: OverviewData) => void
  P: Palette
  coverUrl: string | undefined
  onCoverUrl: (url: string | undefined) => void
}) {
  const set = <K extends keyof OverviewData>(k: K, v: OverviewData[K]) => onChange({ ...data, [k]: v })
  const setMetric = (i: number, field: 'label' | 'value', val: string) => {
    const m = [...data.metrics]
    m[i] = { ...m[i], [field]: val }
    set('metrics', m)
  }

  return (
    <div style={{ background: P.surface, borderRadius: 12, border: `1px solid ${P.border}`, overflow: 'hidden', marginBottom: 24 }}>
      {/* Hero image */}
      <div style={{ height: 280 }}>
        <ImageSlot
          label="cover" ratio="cover" enforceRatio
          sectionLabel="" onSectionLabel={() => {}}
          caption="" onCaption={() => {}}
          imageUrl={coverUrl} onImageUrl={onCoverUrl}
        />
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* Summary */}
        <textarea
          value={data.summary}
          onChange={e => set('summary', e.target.value)}
          placeholder="One sentence that tells the story of this project…"
          rows={2}
          style={{ width: '100%', fontSize: 18, fontWeight: 600, color: P.text, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontFamily: 'var(--px-font)', letterSpacing: '-0.02em', lineHeight: 1.45, marginBottom: 20 }}
        />

        {/* Metadata row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {([
            { key: 'role',     label: 'My Role',   ph: 'Lead Designer' },
            { key: 'timeline', label: 'Timeline',   ph: '12 weeks' },
            { key: 'team',     label: 'Team',       ph: '4 people' },
          ] as const).map(f => (
            <div key={f.key} style={{ background: P.surface2, borderRadius: 8, padding: '10px 12px', border: `1px solid ${P.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: P.text3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
              <input
                value={data[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.ph}
                style={{ width: '100%', fontSize: 13, fontWeight: 600, color: P.text, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--px-font)' }}
              />
            </div>
          ))}
          {/* Placeholder for 4th column alignment */}
          <div />
        </div>

        {/* Metrics row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {data.metrics.map((m, i) => (
            <div key={i} style={{ background: P.surface2, borderRadius: 8, padding: '14px 16px', border: `1px solid ${P.border}`, textAlign: 'center' }}>
              <input
                value={m.value}
                onChange={e => setMetric(i, 'value', e.target.value)}
                placeholder="42%"
                style={{ display: 'block', width: '100%', fontSize: 28, fontWeight: 800, color: '#E53416', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--px-font)', letterSpacing: '-0.04em', textAlign: 'center', marginBottom: 4 }}
              />
              <input
                value={m.label}
                onChange={e => setMetric(i, 'label', e.target.value)}
                placeholder="Conversion increase"
                style={{ display: 'block', width: '100%', fontSize: 11, fontWeight: 500, color: P.text3, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--px-font)', textAlign: 'center' }}
              />
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: P.text3, marginTop: 10, fontStyle: 'italic' }}>Leave metrics empty if not applicable</p>
      </div>
    </div>
  )
}

// ── Visual Block (inside a section) ──────────────────────────────────────────
function VisualBlock({ block, onChange, onDelete, index, dragHandleProps, innerRef, draggableProps, P }: {
  block: Block; onChange: (b: Block) => void; onDelete: () => void
  index: number; dragHandleProps: any; innerRef: any; draggableProps: any; P: Palette
}) {
  const [hover, setHover] = useState(false)

  return (
    <div ref={innerRef} {...draggableProps}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', marginBottom: 12 }}>
      {hover && (
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 10 }}>
          <div {...(dragHandleProps || {})} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', color: '#fff', borderRadius: 5, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
            <Icon name="drag" size={13} />
          </div>
          <button onClick={onDelete} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', borderRadius: 5, background: 'rgba(201,64,64,0.7)', border: 'none' }}>
            <Icon name="trash" size={12} />
          </button>
        </div>
      )}
      {block.type === 'image' && (
        <ImageSlot label={`b-${index}`} ratio="16/9"
          sectionLabel="" onSectionLabel={() => {}}
          caption={block.caption || ''} onCaption={v => onChange({ ...block, caption: v })}
          imageUrl={block.imageUrl} onImageUrl={url => onChange({ ...block, imageUrl: url })} />
      )}
      {block.type === 'gallery' && <GalleryBlock block={block} onChange={onChange} P={P} />}
      {block.type === 'figma' && (
        <FigmaBlock figmaUrl={block.figmaUrl} onFigmaUrl={url => onChange({ ...block, figmaUrl: url })}
          sectionLabel="" onSectionLabel={() => {}} />
      )}
      {block.type === 'compare' && (
        <CompareBlock beforeUrl={block.beforeUrl} afterUrl={block.afterUrl}
          onBefore={url => onChange({ ...block, beforeUrl: url })} onAfter={url => onChange({ ...block, afterUrl: url })}
          sectionLabel="" onSectionLabel={() => {}} />
      )}
      {block.type === 'text' && (
        <TextBlock html={block.html || ''} onHtml={v => onChange({ ...block, html: v })}
          sectionLabel="" onSectionLabel={() => {}} />
      )}
    </div>
  )
}

type Pal = typeof DARK
function GalleryBlock({ block, onChange, P }: { block: Block; onChange: (b: Block) => void; P: Pal }) {
  const imgs = block.images || [{ url: '', caption: '' }, { url: '', caption: '' }]
  const canAdd = imgs.length < 4

  const upload = async (idx: number, file: File) => {
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return
    const publicUrl = await uploadFile(file)
    const next = [...imgs]; next[idx] = { ...next[idx], url: publicUrl }
    onChange({ ...block, images: next })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${imgs.length}, 1fr)`, gap: 8 }}>
        {imgs.map((img, i) => (
          <div key={i}>
            <div style={{ aspectRatio: '4/3', background: img.url ? `url(${img.url}) center/cover` : P.surface2, border: `1.5px dashed ${P.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = e => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) upload(i, f) }; inp.click() }}>
              {!img.url && <Icon name="upload" size={16} color={P.text3} />}
            </div>
            <input value={img.caption} onChange={e => { const next = [...imgs]; next[i] = { ...next[i], caption: e.target.value }; onChange({ ...block, images: next }) }} placeholder="Caption…"
              style={{ width: '100%', fontSize: 11, color: P.text2, background: 'transparent', border: 'none', borderBottom: `1px solid ${P.border}`, padding: '3px 0', marginTop: 4, fontFamily: 'var(--px-font)', outline: 'none' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {canAdd && <button onClick={() => onChange({ ...block, images: [...imgs, { url: '', caption: '' }] })} style={{ fontSize: 11, color: P.text3, background: 'none', border: `1px dashed ${P.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>+ Add image</button>}
        {imgs.length > 2 && <button onClick={() => onChange({ ...block, images: imgs.slice(0, -1) })} style={{ fontSize: 11, color: '#C94040', background: 'none', border: '1px dashed #C94040', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>Remove last</button>}
      </div>
    </div>
  )
}

// ── Section Editor ────────────────────────────────────────────────────────────
const VISUAL_TYPES = [
  { id: 'image',   label: 'Image',         icon: 'image' },
  { id: 'gallery', label: 'Gallery',        icon: 'grid2' },
  { id: 'figma',   label: 'Figma',          icon: 'figma' },
  { id: 'compare', label: 'Before / After', icon: 'compareH' },
  { id: 'text',    label: 'Text',           icon: 'text' },
] as const

function SectionEditor({ section, onUpdate, onDelete, P, isActive, onActivate, dragHandleProps, innerRef, draggableProps, generating, onGenerate, canGenerate, creditsLeft }: {
  section: CaseSection
  onUpdate: (s: CaseSection) => void
  onDelete: () => void
  P: Palette
  isActive: boolean
  onActivate: () => void
  dragHandleProps: any; innerRef: any; draggableProps: any
  generating: boolean
  onGenerate: () => void
  canGenerate: boolean
  creditsLeft: number | null
}) {
  const def = SECTION_DEFS[section.type]
  const [showVisualPicker, setShowVisualPicker] = useState(false)
  const [editTitle, setEditTitle] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isOverview = section.type === 'overview'

  const addBlock = (type: BlockType) => {
    onUpdate({ ...section, blocks: [...section.blocks, makeBlock(type)] })
    setShowVisualPicker(false)
  }

  const updateBlock = (idx: number, b: Block) => {
    const blocks = section.blocks.map((x, i) => i === idx ? b : x)
    onUpdate({ ...section, blocks })
  }

  const deleteBlock = (idx: number) => {
    onUpdate({ ...section, blocks: section.blocks.filter((_, i) => i !== idx) })
  }

  const onBlockDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const next = Array.from(section.blocks)
    const [moved] = next.splice(result.source.index, 1)
    next.splice(result.destination.index, 0, moved)
    onUpdate({ ...section, blocks: next })
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [section.narrative])

  return (
    <div ref={innerRef} {...draggableProps} id={`section-${section.id}`}
      style={{ background: P.surface, borderRadius: 12, border: `2px solid ${isActive ? def.color : P.border}`, marginBottom: 16, overflow: 'hidden', transition: 'border-color 0.15s' }}
      onClick={onActivate}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${P.border}`, background: isActive ? `${def.color}10` : P.surface }}>
        <div {...(dragHandleProps || {})} style={{ cursor: 'grab', color: P.text3, padding: '0 2px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <Icon name="drag" size={14} />
        </div>
        {/* Type badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: def.color + '18', borderRadius: 999, border: `1px solid ${def.color}30` }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: def.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{def.icon} {section.type}</span>
        </div>
        {/* Editable title */}
        {editTitle ? (
          <input
            value={section.title}
            onChange={e => onUpdate({ ...section, title: e.target.value })}
            onBlur={() => setEditTitle(false)}
            autoFocus
            style={{ flex: 1, fontSize: 14, fontWeight: 700, color: P.text, background: 'transparent', border: 'none', borderBottom: `1px solid ${def.color}`, outline: 'none', fontFamily: 'var(--px-font)' }}
          />
        ) : (
          <span onClick={e => { e.stopPropagation(); setEditTitle(true) }}
            style={{ flex: 1, fontSize: 14, fontWeight: 700, color: P.text, cursor: 'text', letterSpacing: '-0.01em' }}>
            {section.title}
          </span>
        )}
        {/* AI generate button */}
        {!isOverview && (
          <button onClick={e => { e.stopPropagation(); onGenerate() }} disabled={generating || !canGenerate}
            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, background: generating ? def.color : canGenerate ? def.color + '18' : P.surface2, color: generating ? '#fff' : canGenerate ? def.color : P.text3, border: `1px solid ${canGenerate ? def.color + '40' : P.border}`, cursor: canGenerate ? 'pointer' : 'not-allowed', fontFamily: 'var(--px-font)', transition: 'all 0.15s', flexShrink: 0 }}>
            {generating ? <Spinner size={10} /> : <Icon name="sparkle" size={11} />}
            {generating ? 'Generating…' : 'Write with AI'}
          </button>
        )}
        {/* Delete */}
        {section.type !== 'overview' && (
          <button onClick={e => { e.stopPropagation(); onDelete() }}
            style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: P.text3, borderRadius: 5, flexShrink: 0 }}
            title="Remove section">
            <Icon name="x" size={13} />
          </button>
        )}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Narrative field */}
        {!isOverview && (
          <textarea
            ref={textareaRef}
            value={section.narrative}
            onChange={e => onUpdate({ ...section, narrative: e.target.value })}
            placeholder={def.prompt}
            style={{ width: '100%', minHeight: 80, fontSize: 14, lineHeight: 1.7, color: P.text, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontFamily: 'var(--px-font)', marginBottom: section.blocks.length > 0 ? 16 : 0, overflow: 'hidden' }}
          />
        )}

        {/* Visual blocks */}
        {section.blocks.length > 0 && (
          <DragDropContext onDragEnd={onBlockDragEnd}>
            <Droppable droppableId={`blocks-${section.id}`}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {section.blocks.map((block, idx) => (
                    <Draggable key={block.id} draggableId={block.id} index={idx}>
                      {(drag) => (
                        <VisualBlock
                          block={block}
                          onChange={b => updateBlock(idx, b)}
                          onDelete={() => deleteBlock(idx)}
                          index={idx}
                          dragHandleProps={drag.dragHandleProps}
                          innerRef={drag.innerRef}
                          draggableProps={drag.draggableProps}
                          P={P}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Add visual */}
        <div style={{ position: 'relative' }}>
          <button onClick={e => { e.stopPropagation(); setShowVisualPicker(v => !v) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: section.blocks.length > 0 ? 8 : 0, height: 32, padding: '0 12px', fontSize: 12, fontWeight: 600, color: P.text3, background: 'transparent', border: `1px dashed ${P.border}`, borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--px-font)', transition: 'border-color 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = def.color)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = P.border)}>
            <Icon name="plus" size={12} /> Add visual
          </button>
          {showVisualPicker && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: P.surface, border: `1px solid ${P.border}`, borderRadius: 8, padding: 6, display: 'flex', gap: 4, zIndex: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
              {VISUAL_TYPES.map(vt => (
                <button key={vt.id} onClick={() => addBlock(vt.id as BlockType)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 10px', background: P.surface2, border: `1px solid ${P.border}`, borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--px-font)', minWidth: 60, transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = P.border)}
                  onMouseLeave={e => (e.currentTarget.style.background = P.surface2)}>
                  <Icon name={vt.icon as any} size={16} color={P.text2} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: P.text2 }}>{vt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Story Check (right panel) ─────────────────────────────────────────────────
function StoryCheck({ sections, problem, setProblem, whatIDid, setWhatIDid, creditsLeft, P }: {
  sections: CaseSection[]
  problem: string; setProblem: (v: string) => void
  whatIDid: string; setWhatIDid: (v: string) => void
  creditsLeft: number | null
  P: Palette
}) {
  const filled = sections.filter(s => s.narrative.trim().length > 20 || s.blocks.length > 0).length
  const total = sections.length
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0

  const statusColor = pct === 100 ? '#1A8A4A' : pct >= 60 ? '#B86E0A' : '#E53416'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${P.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: P.text, letterSpacing: '-0.01em' }}>Story Check</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{pct}%</span>
        </div>
        <div style={{ height: 4, background: P.surface2, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: statusColor, borderRadius: 999, transition: 'width 0.4s' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {/* Section status */}
        <div style={{ marginBottom: 16 }}>
          {sections.map(s => {
            const def = SECTION_DEFS[s.type]
            const hasNarrative = s.narrative.trim().length > 20
            const hasVisual = s.blocks.length > 0
            const ok = hasNarrative || hasVisual || s.type === 'overview'
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${P.border}` }}>
                <div style={{ width: 6, height: 6, borderRadius: 999, background: ok ? '#1A8A4A' : P.border, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: P.text2, flex: 1, letterSpacing: '-0.01em' }}>{s.title}</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {hasNarrative && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#E8F7EE', color: '#1A8A4A' }}>text</span>}
                  {hasVisual && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#EEF4FF', color: '#0055CC' }}>{s.blocks.length} visual{s.blocks.length !== 1 ? 's' : ''}</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* AI context */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: P.text3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>AI Context</div>
          <p style={{ fontSize: 11, color: P.text3, lineHeight: 1.5, marginBottom: 8 }}>
            These fields give the AI context to write section narratives in your voice.
          </p>
          {[
            { key: 'problem', label: 'Core Problem *', value: problem, set: setProblem, ph: 'What problem were you solving and for whom?', rows: 3 },
            { key: 'what', label: 'Your Approach *', value: whatIDid, set: setWhatIDid, ph: 'How did you tackle it? Key decisions, methods, tradeoffs.', rows: 3 },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: P.text3, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{f.label}</label>
              <textarea value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} rows={f.rows}
                style={{ width: '100%', fontSize: 12, lineHeight: 1.55, color: P.text, background: P.surface2, border: `1px solid ${P.border}`, borderRadius: 6, padding: '7px 9px', resize: 'none', fontFamily: 'var(--px-font)', outline: 'none', transition: 'border-color 0.12s' }}
                onFocus={e => (e.target.style.borderColor = '#E53416')}
                onBlur={e => (e.target.style.borderColor = P.border)} />
            </div>
          ))}
        </div>

        {/* Credits */}
        {creditsLeft !== null && (
          <div style={{ padding: '8px 10px', background: P.surface2, borderRadius: 6, border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: P.text3 }}>AI credits</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: creditsLeft > 3 ? P.text2 : '#B86E0A' }}>{creditsLeft} remaining</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Add Section Picker ────────────────────────────────────────────────────────
const ADDABLE_TYPES: CaseSectionType[] = ['challenge', 'research', 'process', 'solution', 'impact', 'custom']

function AddSectionPicker({ onAdd, P }: { onAdd: (type: CaseSectionType) => void; P: Palette }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', marginBottom: 8 }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, fontSize: 12, fontWeight: 600, color: '#E53416', background: 'rgba(229,52,22,0.06)', border: '1px dashed rgba(229,52,22,0.3)', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
        <Icon name="plus" size={13} /> Add section
      </button>
      {open && (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4, background: P.surface, border: `1px solid ${P.border}`, borderRadius: 8, overflow: 'hidden', zIndex: 30, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          {ADDABLE_TYPES.map(type => {
            const def = SECTION_DEFS[type]
            return (
              <button key={type} onClick={() => { onAdd(type); setOpen(false) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'transparent', border: 'none', borderBottom: `1px solid ${P.border}`, cursor: 'pointer', fontFamily: 'var(--px-font)', textAlign: 'left', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = P.surface2)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontSize: 14 }}>{def.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: def.color }}>{def.title}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Editor Page ──────────────────────────────────────────────────────────
export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [lightMode, setLightMode] = useState(false)
  const P = lightMode ? LIGHT : DARK

  // Core state
  const [title, setTitle] = useState('Untitled')
  const [editTitle, setEditTitle] = useState(false)
  const [published, setPublished] = useState(false)
  const [saved, setSaved] = useState(true)
  const [ndaEnabled, setNdaEnabled] = useState(false)

  // Sections state
  const [sections, setSections] = useState<CaseSection[]>([])
  const [overviewData, setOverviewData] = useState<OverviewData>({ summary: '', role: '', timeline: '', team: '', metrics: [{ label: '', value: '' }, { label: '', value: '' }, { label: '', value: '' }] })
  const [coverUrl, setCoverUrl] = useState<string | undefined>()
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  // AI context
  const [problem, setProblem] = useState('')
  const [whatIDid, setWhatIDid] = useState('')
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null)
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null)

  // Auto-save
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const stateRef = useRef({ sections, overviewData, coverUrl, title, published, ndaEnabled, problem, whatIDid })

  useEffect(() => {
    stateRef.current = { sections, overviewData, coverUrl, title, published, ndaEnabled, problem, whatIDid }
  })

  const markDirty = useCallback(() => {
    setSaved(false)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveNow(), 30000)
  }, [])

  const saveNow = useCallback(async () => {
    const { sections, overviewData, coverUrl, title, published, ndaEnabled, problem, whatIDid } = stateRef.current
    await fetch(`/api/case-studies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections, overview_data: overviewData, cover_image_url: coverUrl || null, title, published, nda_enabled: ndaEnabled, problem, what_i_did: whatIDid }),
    })
    setSaved(true)
  }, [id])

  // Load
  useEffect(() => {
    fetch(`/api/case-studies/${id}`).then(async r => {
      if (!r.ok) { router.push('/dashboard'); return }
      const data: CaseStudy = await r.json()
      setTitle(data.title)
      setPublished(data.published)
      setNdaEnabled(data.nda_enabled)
      setCoverUrl(data.cover_image_url || undefined)
      setProblem(data.problem || '')
      setWhatIDid(data.what_i_did || '')
      if (data.sections?.length) {
        setSections(data.sections)
        setActiveSectionId(data.sections[0]?.id || null)
      }
      if (data.overview_data) setOverviewData(data.overview_data)
    })
    fetch('/api/ai/credits').then(async r => { if (r.ok) { const d = await r.json(); setCreditsLeft(d.credits_remaining) } })
  }, [id, router])

  // Sections CRUD
  const updateSection = useCallback((updated: CaseSection) => {
    setSections(s => s.map(x => x.id === updated.id ? updated : x))
    markDirty()
  }, [markDirty])

  const deleteSection = useCallback((sectionId: string) => {
    setSections(s => s.filter(x => x.id !== sectionId))
    markDirty()
  }, [markDirty])

  const addSection = useCallback((type: CaseSectionType) => {
    const newSection = makeSection(type)
    setSections(s => [...s, newSection])
    setActiveSectionId(newSection.id)
    markDirty()
    // Scroll to new section
    setTimeout(() => {
      document.getElementById(`section-${newSection.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [markDirty])

  const onSectionDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const next = Array.from(sections)
    // Don't allow moving the overview (always index 0)
    if (result.source.index === 0 || result.destination.index === 0) return
    const [moved] = next.splice(result.source.index, 1)
    next.splice(result.destination.index, 0, moved)
    setSections(next)
    markDirty()
  }

  // AI generate for a specific section
  const generateForSection = async (section: CaseSection) => {
    if (!problem || !whatIDid) return
    setGeneratingSectionId(section.id)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseStudyId: id,
          section: section.type === 'challenge' ? 'intro' : section.type === 'impact' ? 'outcome' : 'process',
          problem,
          whatIDid,
          outcome: '',
          sectionContext: { type: section.type, title: section.title },
        }),
      })
      if (!res.ok) return

      const reader = res.body?.getReader()
      if (!reader) return
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        updateSection({ ...section, narrative: text })
      }
      if (creditsLeft !== null) setCreditsLeft(c => c !== null ? c - 1 : null)
    } finally {
      setGeneratingSectionId(null)
      markDirty()
    }
  }

  const canGenerate = problem.trim().length > 10 && whatIDid.trim().length > 10

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: P.bg, color: P.text, overflow: 'hidden', fontFamily: 'var(--px-font)' }}>

      {/* ── Top bar ── */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: `1px solid ${P.border}`, background: P.surface, flexShrink: 0, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => { saveNow(); router.push('/dashboard') }} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: P.text2, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--px-font)', fontWeight: 500, padding: '4px 6px', borderRadius: 5 }}>
            <Icon name="arrowLeft" size={14} /> Builder
          </button>
          <div style={{ width: 1, height: 16, background: P.border }} />
          {editTitle ? (
            <input value={title} onChange={e => { setTitle(e.target.value); markDirty() }} onBlur={() => setEditTitle(false)} autoFocus
              style={{ fontSize: 14, fontWeight: 700, color: P.text, background: 'transparent', border: 'none', borderBottom: `1px solid #E53416`, outline: 'none', fontFamily: 'var(--px-font)', letterSpacing: '-0.02em', width: 240, padding: '2px 0' }} />
          ) : (
            <span onClick={() => setEditTitle(true)} title="Click to rename"
              style={{ fontSize: 14, fontWeight: 700, color: P.text, letterSpacing: '-0.02em', cursor: 'text', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: saved ? '#3DBE6A' : P.text3 }}>
            <Icon name={saved ? 'checkCircle' : 'edit'} size={13} />
            {saved ? 'Saved' : 'Unsaved'}
          </div>
          {creditsLeft !== null && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, color: creditsLeft > 3 ? P.text3 : '#B86E0A', background: creditsLeft > 3 ? P.surface2 : '#FEF3E4', border: `1px solid ${creditsLeft > 3 ? P.border : '#B86E0A'}` }}>
              {creditsLeft} credits
            </span>
          )}
          <button onClick={() => setLightMode(m => !m)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', fontSize: 12, fontWeight: 600, borderRadius: 6, background: P.surface2, color: P.text2, border: `1px solid ${P.border}`, cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
            <Icon name={lightMode ? 'moon' : 'sun'} size={13} /> {lightMode ? 'Dark' : 'Light'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: P.surface2, border: `1px solid ${P.border}`, borderRadius: 6 }}>
            <span style={{ fontSize: 12, color: P.text2, fontWeight: 500 }}>{published ? 'Published' : 'Draft'}</span>
            <Toggle value={published} onChange={v => { setPublished(v); markDirty() }} size="sm" />
          </div>
          <button onClick={() => saveNow()}
            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 14px', fontSize: 13, fontWeight: 600, borderRadius: 6, background: '#E53416', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
            Save
          </button>
        </div>
      </div>

      {/* ── Three-panel layout ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left — Section navigator */}
        <div style={{ width: 200, borderRight: `1px solid ${P.border}`, background: P.surface, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 12px 8px', fontSize: 10, fontWeight: 700, color: P.text3, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>Sections</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
            <DragDropContext onDragEnd={onSectionDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {sections.map((s, i) => {
                      const def = SECTION_DEFS[s.type]
                      const isActive = s.id === activeSectionId
                      const hasContent = s.narrative.trim().length > 20 || s.blocks.length > 0 || s.type === 'overview'
                      return (
                        <Draggable key={s.id} draggableId={s.id} index={i} isDragDisabled={s.type === 'overview'}>
                          {(drag) => (
                            <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps}
                              onClick={() => {
                                setActiveSectionId(s.id)
                                document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, marginBottom: 2, cursor: 'pointer', background: isActive ? `${def.color}15` : 'transparent', transition: 'background 0.12s' }}>
                              <div style={{ width: 8, height: 8, borderRadius: 999, background: hasContent ? def.color : P.border, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? def.color : P.text2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{s.title}</span>
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          <div style={{ padding: '8px', borderTop: `1px solid ${P.border}`, flexShrink: 0 }}>
            <AddSectionPicker onAdd={addSection} P={P} />
            {/* NDA toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: ndaEnabled ? 'rgba(229,52,22,0.06)' : P.surface2, borderRadius: 6, border: `1px solid ${ndaEnabled ? 'rgba(229,52,22,0.3)' : P.border}` }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: P.text2 }}>NDA</div>
                <div style={{ fontSize: 10, color: P.text3 }}>Password protect</div>
              </div>
              <Toggle value={ndaEnabled} onChange={v => { setNdaEnabled(v); markDirty() }} size="sm" />
            </div>
          </div>
        </div>

        {/* Center — Canvas */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 64px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>

            {/* Overview card — always first, special rendering */}
            {sections.length > 0 && sections[0].type === 'overview' && (
              <div id={`section-${sections[0].id}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: SECTION_DEFS.overview.color + '18', borderRadius: 999, border: `1px solid ${SECTION_DEFS.overview.color}30` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: SECTION_DEFS.overview.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>◈ Overview</span>
                  </div>
                </div>
                <OverviewCard
                  data={overviewData}
                  onChange={d => { setOverviewData(d); markDirty() }}
                  P={P}
                  coverUrl={coverUrl}
                  onCoverUrl={url => { setCoverUrl(url); markDirty() }}
                />
              </div>
            )}

            {/* Remaining sections */}
            <DragDropContext onDragEnd={onSectionDragEnd}>
              <Droppable droppableId="sections-canvas">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {sections.slice(1).map((s, i) => (
                      <Draggable key={s.id} draggableId={`canvas-${s.id}`} index={i}>
                        {(drag) => (
                          <SectionEditor
                            section={s}
                            onUpdate={updateSection}
                            onDelete={() => deleteSection(s.id)}
                            P={P}
                            isActive={s.id === activeSectionId}
                            onActivate={() => setActiveSectionId(s.id)}
                            dragHandleProps={drag.dragHandleProps}
                            innerRef={drag.innerRef}
                            draggableProps={drag.draggableProps}
                            generating={generatingSectionId === s.id}
                            onGenerate={() => generateForSection(s)}
                            canGenerate={canGenerate}
                            creditsLeft={creditsLeft}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Add section CTA */}
            <button onClick={() => addSection('custom')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, fontSize: 13, fontWeight: 600, color: P.text3, background: 'transparent', border: `1.5px dashed ${P.border}`, borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--px-font)', transition: 'border-color 0.15s, color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E53416'; (e.currentTarget as HTMLButtonElement).style.color = '#E53416' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = P.border; (e.currentTarget as HTMLButtonElement).style.color = P.text3 }}>
              <Icon name="plus" size={15} /> Add another section
            </button>
          </div>
        </div>

        {/* Right — Story Check */}
        <div style={{ width: 264, borderLeft: `1px solid ${P.border}`, background: P.surface, flexShrink: 0, overflow: 'hidden' }}>
          <StoryCheck
            sections={sections}
            problem={problem} setProblem={v => { setProblem(v); markDirty() }}
            whatIDid={whatIDid} setWhatIDid={v => { setWhatIDid(v); markDirty() }}
            creditsLeft={creditsLeft}
            P={P}
          />
        </div>
      </div>
    </div>
  )
}
