'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useIsMobile } from '@/lib/hooks'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Toggle, Spinner } from '@/components/ui/Misc'
import { Icon } from '@/components/ui/Icon'
import { ImageSlot } from '@/components/editor/ImageSlot'
import { FigmaBlock } from '@/components/editor/FigmaBlock'
import { CompareBlock } from '@/components/editor/CompareBlock'
import { TextBlock } from '@/components/editor/TextBlock'
import { SECTION_DEFS, SECTION_TITLE_EXAMPLES, makeSection } from '@/lib/case-study-templates'
import { DISCIPLINE_SAMPLES } from '@/lib/case-study-samples'
import type { Block, BlockType, CaseStudy, CaseSection, OverviewData, CaseSectionType } from '@/types'

// ── Palettes ──────────────────────────────────────────────────────────────────
const DARK  = { bg: '#0D0D0B', surface: '#161513', surface2: '#1E1D1A', border: '#2B2926', text: '#F0EEE9', text2: '#8A8780', text3: '#56534D', inputBg: '#1E1D1A' }
const LIGHT = { bg: '#F8F7F4', surface: '#FFFFFF',  surface2: '#F2F0EC', border: '#E4E2DC', text: '#1C1B18', text2: '#6C6960', text3: '#9A978E', inputBg: '#F8F7F4' }
type P = typeof DARK

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeBlock(type: BlockType): Block {
  return { id: Math.random().toString(36).slice(2), type, sectionLabel: '', caption: '', images: type === 'gallery' ? [{ url: '', caption: '' }, { url: '', caption: '' }] : undefined }
}

async function uploadFile(file: File): Promise<string> {
  const { default: compress } = await import('browser-image-compression')
  const c = await compress(file, { maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true })
  const res = await fetch('/api/upload/presign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, contentType: file.type }) })
  const { url, publicUrl } = await res.json()
  await fetch(url, { method: 'PUT', body: c, headers: { 'Content-Type': file.type } })
  return publicUrl
}

function isSectionDone(s: CaseSection) {
  return s.type === 'overview' || s.narrative.trim().length > 80 || s.blocks.length > 0
}

// Quality signals for Story Check — distinct from "done"
function getSectionWarnings(s: CaseSection): string[] {
  if (s.type === 'overview') return []
  const warnings: string[] = []
  const def = SECTION_DEFS[s.type]
  // Title still at default
  if (s.title === def.title) warnings.push('Rename this section — generic titles lose readers')
  // Thin narrative
  const wordCount = s.narrative.trim().split(/\s+/).filter(Boolean).length
  if (wordCount > 0 && wordCount < 60) warnings.push(`${wordCount} words — aim for 100+ to tell the story`)
  // No visuals in solution/process
  if ((s.type === 'solution' || s.type === 'process') && s.blocks.length === 0 && s.narrative.trim().length > 0) {
    warnings.push('Add screens or a Figma embed — show the work')
  }
  return warnings
}

// ── Addable section types ─────────────────────────────────────────────────────
const ADDABLE: CaseSectionType[] = ['challenge', 'research', 'process', 'solution', 'impact', 'whatsnext', 'custom']

// ── Gallery Block ─────────────────────────────────────────────────────────────
function GalleryBlock({ block, onChange, palette }: { block: Block; onChange: (b: Block) => void; palette: P }) {
  const imgs = block.images || [{ url: '', caption: '' }, { url: '', caption: '' }]

  const upload = async (idx: number, file: File) => {
    const url = await uploadFile(file)
    const next = [...imgs]; next[idx] = { ...next[idx], url }
    onChange({ ...block, images: next })
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${imgs.length}, 1fr)`, gap: 8, marginBottom: 8 }}>
        {imgs.map((img, i) => (
          <div key={i}>
            <div onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = e => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) upload(i, f) }; inp.click() }}
              style={{ aspectRatio: '4/3', background: img.url ? `url(${img.url}) center/cover` : palette.surface2, border: `1.5px dashed ${palette.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
              {!img.url && <Icon name="upload" size={18} color={palette.text3} />}
            </div>
            <input value={img.caption} onChange={e => { const next = [...imgs]; next[i] = { ...next[i], caption: e.target.value }; onChange({ ...block, images: next }) }} placeholder="Caption…"
              style={{ width: '100%', fontSize: 12, color: palette.text2, background: 'transparent', border: 'none', borderBottom: `1px solid ${palette.border}`, padding: '4px 0', marginTop: 4, fontFamily: 'var(--px-font)', outline: 'none' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {imgs.length < 4 && <button onClick={() => onChange({ ...block, images: [...imgs, { url: '', caption: '' }] })} style={{ fontSize: 11, color: palette.text3, background: 'none', border: `1px dashed ${palette.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>+ Add image</button>}
        {imgs.length > 2 && <button onClick={() => onChange({ ...block, images: imgs.slice(0, -1) })} style={{ fontSize: 11, color: '#C94040', background: 'none', border: '1px dashed #C94040', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>Remove last</button>}
      </div>
    </div>
  )
}

// ── Video block ───────────────────────────────────────────────────────────────
function VideoBlock({ block, onChange, palette }: { block: Block; onChange: (b: Block) => void; palette: P }) {
  const url = block.videoUrl || ''
  const isValid = url.includes('youtube') || url.includes('youtu.be') || url.includes('loom.com') || url.includes('vimeo.com') || url.match(/\.(mp4|webm|gif)/)
  return (
    <div>
      <input
        value={url}
        onChange={e => onChange({ ...block, videoUrl: e.target.value })}
        placeholder="YouTube, Loom, Vimeo URL — or direct .mp4 / .gif link"
        style={{ width: '100%', fontSize: 13, color: palette.text, background: palette.surface2, border: `1.5px solid ${url && !isValid ? '#C94040' : palette.border}`, borderRadius: 8, padding: '9px 12px', outline: 'none', fontFamily: 'var(--px-font)', marginBottom: 8 }}
        onFocus={e => (e.target.style.borderColor = '#E53416')}
        onBlur={e => (e.target.style.borderColor = url && !isValid ? '#C94040' : palette.border)}
      />
      {url && isValid && (
        <div style={{ fontSize: 12, color: '#1A8A4A', fontWeight: 600 }}>✓ Valid URL — will embed on the published page</div>
      )}
      {url && !isValid && (
        <div style={{ fontSize: 12, color: '#C94040' }}>Paste a YouTube, Loom, Vimeo, or direct video link</div>
      )}
      <input
        value={block.caption || ''}
        onChange={e => onChange({ ...block, caption: e.target.value })}
        placeholder="Caption (optional)"
        style={{ width: '100%', fontSize: 12, color: palette.text2, background: 'transparent', border: 'none', borderBottom: `1px solid ${palette.border}`, padding: '4px 0', marginTop: 8, fontFamily: 'var(--px-font)', outline: 'none' }}
      />
    </div>
  )
}

// ── Stat callout block ────────────────────────────────────────────────────────
function StatBlock({ block, onChange, palette }: { block: Block; onChange: (b: Block) => void; palette: P }) {
  return (
    <div style={{ background: palette.surface2, borderRadius: 12, padding: '20px 24px', border: `1px solid ${palette.border}` }}>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <input
          value={block.statValue || ''}
          onChange={e => onChange({ ...block, statValue: e.target.value })}
          placeholder="−32%"
          style={{ display: 'block', width: '100%', fontSize: 48, fontWeight: 900, color: '#E53416', background: 'transparent', border: 'none', borderBottom: `2px solid ${palette.border}`, outline: 'none', fontFamily: 'var(--px-font)', letterSpacing: '-0.04em', textAlign: 'center', marginBottom: 8, paddingBottom: 6 }}
        />
        <input
          value={block.statLabel || ''}
          onChange={e => onChange({ ...block, statLabel: e.target.value })}
          placeholder="Cart abandonment reduced"
          style={{ display: 'block', width: '100%', fontSize: 14, fontWeight: 600, color: palette.text, background: 'transparent', border: 'none', borderBottom: `1px solid ${palette.border}`, outline: 'none', fontFamily: 'var(--px-font)', textAlign: 'center', marginBottom: 8, paddingBottom: 4 }}
        />
        <input
          value={block.statNote || ''}
          onChange={e => onChange({ ...block, statNote: e.target.value })}
          placeholder="Context note (optional — e.g. at 90 days post-launch)"
          style={{ display: 'block', width: '100%', fontSize: 12, color: palette.text3, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--px-font)', textAlign: 'center', fontStyle: 'italic' }}
        />
      </div>
    </div>
  )
}

// ── Visual block wrapper ──────────────────────────────────────────────────────
function VisualBlock({ block, onChange, onDelete, dragHandleProps, innerRef, draggableProps, palette }: {
  block: Block; onChange: (b: Block) => void; onDelete: () => void
  dragHandleProps: any; innerRef: any; draggableProps: any; palette: P
}) {
  const [hover, setHover] = useState(false)
  return (
    <div ref={innerRef} {...draggableProps} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ position: 'relative', marginBottom: 12 }}>
      {hover && (
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 10 }}>
          <div {...(dragHandleProps || {})} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', borderRadius: 5 }}>
            <Icon name="drag" size={13} color="#fff" />
          </div>
          <button onClick={onDelete} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(201,64,64,0.8)', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
            <Icon name="trash" size={12} color="#fff" />
          </button>
        </div>
      )}
      {block.type === 'image' && <ImageSlot label="img" ratio="16/9" sectionLabel="" onSectionLabel={() => {}} caption={block.caption || ''} onCaption={v => onChange({ ...block, caption: v })} imageUrl={block.imageUrl} onImageUrl={url => onChange({ ...block, imageUrl: url })} />}
      {block.type === 'gallery' && <GalleryBlock block={block} onChange={onChange} palette={palette} />}
      {block.type === 'video' && <VideoBlock block={block} onChange={onChange} palette={palette} />}
      {block.type === 'figma' && <FigmaBlock figmaUrl={block.figmaUrl} onFigmaUrl={url => onChange({ ...block, figmaUrl: url })} sectionLabel="" onSectionLabel={() => {}} />}
      {block.type === 'compare' && <CompareBlock beforeUrl={block.beforeUrl} afterUrl={block.afterUrl} onBefore={url => onChange({ ...block, beforeUrl: url })} onAfter={url => onChange({ ...block, afterUrl: url })} sectionLabel="" onSectionLabel={() => {}} />}
      {block.type === 'stat' && <StatBlock block={block} onChange={onChange} palette={palette} />}
      {block.type === 'text' && <TextBlock html={block.html || ''} onHtml={v => onChange({ ...block, html: v })} sectionLabel="" onSectionLabel={() => {}} />}
    </div>
  )
}

// ── Overview canvas ───────────────────────────────────────────────────────────
function OverviewCanvas({ data, onChange, palette, coverUrl, onCoverUrl }: {
  data: OverviewData; onChange: (d: OverviewData) => void; palette: P
  coverUrl: string | undefined; onCoverUrl: (url: string | undefined) => void
}) {
  const set = <K extends keyof OverviewData>(k: K, v: OverviewData[K]) => onChange({ ...data, [k]: v })
  return (
    <div>
      {/* Hero image */}
      <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 28, border: `1px solid ${palette.border}` }}>
        <div style={{ height: 240 }}>
          <ImageSlot label="cover" ratio="cover" enforceRatio sectionLabel="" onSectionLabel={() => {}} caption="" onCaption={() => {}} imageUrl={coverUrl} onImageUrl={onCoverUrl} />
        </div>
      </div>

      {/* Summary */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: palette.text3, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Project Summary</label>
        <textarea value={data.summary} onChange={e => set('summary', e.target.value)} placeholder="One sentence that captures what this project is and why it matters…"
          rows={2}
          style={{ width: '100%', fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.4, color: palette.text, background: 'transparent', border: 'none', borderBottom: `2px solid ${palette.border}`, outline: 'none', resize: 'none', fontFamily: 'var(--px-font)', paddingBottom: 8 }} />
      </div>

      {/* Metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
        {([['role', 'My Role', 'Lead Designer'], ['timeline', 'Timeline', '12 weeks'], ['team', 'Team', '4 people']] as const).map(([k, label, ph]) => (
          <div key={k} style={{ background: palette.surface2, borderRadius: 10, padding: '14px 16px', border: `1px solid ${palette.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: palette.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
            <input value={data[k]} onChange={e => set(k, e.target.value)} placeholder={ph}
              style={{ width: '100%', fontSize: 14, fontWeight: 600, color: palette.text, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--px-font)' }} />
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div>
        <label style={{ fontSize: 10, fontWeight: 700, color: palette.text3, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Key Outcomes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — leave blank if not applicable)</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {data.metrics.map((m, i) => (
            <div key={i} style={{ background: palette.surface2, borderRadius: 10, padding: '16px', border: `1px solid ${palette.border}`, textAlign: 'center' }}>
              <input value={m.value} onChange={e => { const ms = [...data.metrics]; ms[i] = { ...ms[i], value: e.target.value }; set('metrics', ms) }} placeholder="42%"
                style={{ display: 'block', width: '100%', fontSize: 32, fontWeight: 800, color: '#E53416', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--px-font)', letterSpacing: '-0.04em', textAlign: 'center', marginBottom: 4 }} />
              <input value={m.label} onChange={e => { const ms = [...data.metrics]; ms[i] = { ...ms[i], label: e.target.value }; set('metrics', ms) }} placeholder="Conversion increase"
                style={{ display: 'block', width: '100%', fontSize: 12, color: palette.text3, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--px-font)', textAlign: 'center' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Section canvas ────────────────────────────────────────────────────────────
const VISUAL_BTNS = [
  { type: 'image',   label: 'Image',          icon: 'image' },
  { type: 'gallery', label: 'Gallery',         icon: 'grid2' },
  { type: 'video',   label: 'Video / Loom',    icon: 'play' },
  { type: 'figma',   label: 'Figma embed',     icon: 'figma' },
  { type: 'compare', label: 'Before / After',  icon: 'compareH' },
  { type: 'stat',    label: 'Stat callout',    icon: 'hash' },
  { type: 'text',    label: 'Text block',      icon: 'text' },
] as const

function SectionCanvas({ section, onUpdate, palette, generating, onGenerate, canGenerate, discipline }: {
  section: CaseSection; onUpdate: (s: CaseSection) => void; palette: P
  generating: boolean; onGenerate: () => void; canGenerate: boolean; discipline: string
}) {
  const def = SECTION_DEFS[section.type]
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = useState(false)
  const [showExample, setShowExample] = useState(false)

  // Pull the matching sample narrative for this section type + discipline
  const exampleNarrative = React.useMemo(() => {
    if (section.type === 'overview' || section.type === 'custom') return null
    const sample = DISCIPLINE_SAMPLES[discipline as keyof typeof DISCIPLINE_SAMPLES]
    if (!sample) return null
    const matchingSection = sample.sections.find(s => s.type === section.type)
    return matchingSection?.narrative || null
  }, [discipline, section.type])

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.max(160, textareaRef.current.scrollHeight) + 'px'
    }
  }, [section.narrative])

  const addBlock = (type: BlockType) => onUpdate({ ...section, blocks: [...section.blocks, makeBlock(type)] })
  const updateBlock = (idx: number, b: Block) => onUpdate({ ...section, blocks: section.blocks.map((x, i) => i === idx ? b : x) })
  const deleteBlock = (idx: number) => onUpdate({ ...section, blocks: section.blocks.filter((_, i) => i !== idx) })
  const onBlockDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const next = Array.from(section.blocks)
    const [m] = next.splice(result.source.index, 1)
    next.splice(result.destination.index, 0, m)
    onUpdate({ ...section, blocks: next })
  }

  return (
    <div>
      {/* Sample banner — auto-dismisses on first edit */}
      {section.isSample && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#FFF8E6', borderRadius: 8, border: '1px solid #F5C842', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14 }}>✏️</span>
          <span style={{ fontSize: 13, color: '#7A5C00', lineHeight: 1.4, flex: 1 }}>
            Sample content — this is an example. Start typing to replace it with your own work.
          </span>
        </div>
      )}

      {/* Prompt — shown prominently when no content yet */}
      {!section.narrative && !focused && !section.isSample && (
        <div style={{ marginBottom: 20, padding: '16px 20px', background: `${def.color}0D`, borderRadius: 10, border: `1px solid ${def.color}25` }}>
          <p style={{ fontSize: 15, color: def.color, lineHeight: 1.7, margin: 0, fontStyle: 'italic', opacity: 0.85 }}>
            {def.prompt}
          </p>
        </div>
      )}

      {/* Collapsed "See an example" — reference without forcing */}
      {exampleNarrative && !section.isSample && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setShowExample(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: palette.text3, background: 'none', border: `1px dashed ${palette.border}`, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--px-font)', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = def.color; (e.currentTarget as HTMLButtonElement).style.borderColor = def.color }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = palette.text3; (e.currentTarget as HTMLButtonElement).style.borderColor = palette.border }}
          >
            {showExample ? '↑ Hide example' : '↓ See a strong example'}
          </button>

          {showExample && (
            <div style={{ marginTop: 10, padding: '16px 18px', background: `${def.color}08`, borderRadius: 10, border: `1px solid ${def.color}20`, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: def.color }}>
                  Example — {discipline === 'ux' ? 'Zomato checkout' : discipline === 'brand' ? 'Mamaearth rebrand' : discipline === 'motion' ? 'Swiggy loading' : 'Zepto campaign'}
                </span>
                <span style={{ fontSize: 10, color: palette.text3 }}>· Read only — for reference</span>
              </div>
              <p style={{ fontSize: 13, color: palette.text2, lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                {exampleNarrative.length > 600 ? exampleNarrative.slice(0, 600) + '…' : exampleNarrative}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Narrative textarea */}
      <textarea
        ref={textareaRef}
        value={section.narrative}
        onChange={e => onUpdate({ ...section, isSample: false, narrative: e.target.value })}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={focused ? '' : 'Start writing…'}
        style={{
          width: '100%', minHeight: 160, fontSize: 16, lineHeight: 1.75,
          color: palette.text, background: 'transparent', border: 'none', outline: 'none',
          resize: 'none', fontFamily: 'var(--px-font)', overflow: 'hidden',
          borderBottom: `1px solid ${focused ? def.color : palette.border}`,
          paddingBottom: 16, marginBottom: 24, transition: 'border-color 0.2s',
        }}
      />

      {/* AI generate button — inline, below textarea */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={onGenerate} disabled={generating || !canGenerate}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 14px', fontSize: 13, fontWeight: 600, borderRadius: 7, background: canGenerate ? `${def.color}15` : palette.surface2, color: canGenerate ? def.color : palette.text3, border: `1px solid ${canGenerate ? def.color + '40' : palette.border}`, cursor: canGenerate && !generating ? 'pointer' : 'not-allowed', fontFamily: 'var(--px-font)', transition: 'all 0.15s' }}>
          {generating ? <Spinner size={12} /> : <Icon name="sparkle" size={13} />}
          {generating ? 'Writing…' : 'Write with AI'}
        </button>
        {!canGenerate && <span style={{ marginLeft: 10, fontSize: 12, color: palette.text3 }}>Fill in AI Context (right panel) first</span>}
      </div>

      {/* Visual blocks */}
      {section.blocks.length > 0 && (
        <DragDropContext onDragEnd={onBlockDragEnd}>
          <Droppable droppableId={`b-${section.id}`}>
            {(prov) => (
              <div ref={prov.innerRef} {...prov.droppableProps} style={{ marginBottom: 16 }}>
                {section.blocks.map((block, idx) => (
                  <Draggable key={block.id} draggableId={block.id} index={idx}>
                    {(drag) => (
                      <VisualBlock block={block} onChange={b => updateBlock(idx, b)} onDelete={() => deleteBlock(idx)}
                        dragHandleProps={drag.dragHandleProps} innerRef={drag.innerRef} draggableProps={drag.draggableProps} palette={palette} />
                    )}
                  </Draggable>
                ))}
                {prov.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Add visual row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {VISUAL_BTNS.map(vb => (
          <button key={vb.type} onClick={() => addBlock(vb.type as BlockType)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', fontSize: 12, fontWeight: 500, borderRadius: 6, background: 'transparent', border: `1px dashed ${palette.border}`, color: palette.text3, cursor: 'pointer', fontFamily: 'var(--px-font)', transition: 'all 0.12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = def.color; (e.currentTarget as HTMLButtonElement).style.color = def.color }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = palette.border; (e.currentTarget as HTMLButtonElement).style.color = palette.text3 }}>
            <Icon name={vb.icon as any} size={13} /> {vb.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Story Check panel ─────────────────────────────────────────────────────────
function StoryCheckPanel({ sections, activeIdx, onJump, problem, setProblem, whatIDid, setWhatIDid, creditsLeft, palette }: {
  sections: CaseSection[]; activeIdx: number; onJump: (i: number) => void
  problem: string; setProblem: (v: string) => void
  whatIDid: string; setWhatIDid: (v: string) => void
  creditsLeft: number | null; palette: P
}) {
  const done = sections.filter(isSectionDone).length
  const pct = sections.length > 0 ? Math.round((done / sections.length) * 100) : 0
  const barColor = pct === 100 ? '#1A8A4A' : pct >= 60 ? '#B86E0A' : '#E53416'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${palette.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: palette.text, letterSpacing: '-0.01em' }}>Story Check</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: barColor, letterSpacing: '-0.02em' }}>{pct}%</span>
        </div>
        <div style={{ height: 5, background: palette.surface2, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 999, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {/* Section status */}
        <div style={{ marginBottom: 16 }}>
          {sections.map((s, i) => {
            const def = SECTION_DEFS[s.type]
            const done = isSectionDone(s)
            const warnings = getSectionWarnings(s)
            const hasWarnings = warnings.length > 0
            const isActive = i === activeIdx
            return (
              <div key={s.id} style={{ marginBottom: 2 }}>
                <button onClick={() => onJump(i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 6, background: isActive ? `${def.color}10` : 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--px-font)', textAlign: 'left', transition: 'background 0.1s' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: done ? def.color : palette.border, flexShrink: 0, transition: 'background 0.3s' }} />
                  <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? def.color : palette.text2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{s.title}</span>
                  {hasWarnings && <span style={{ fontSize: 10, color: '#B86E0A', fontWeight: 700 }}>⚠</span>}
                  {done && !hasWarnings && !isActive && <Icon name="checkCircle" size={12} color={def.color} />}
                </button>
                {/* Inline warnings on active section */}
                {isActive && hasWarnings && (
                  <div style={{ marginLeft: 24, marginBottom: 4 }}>
                    {warnings.map((w, wi) => (
                      <div key={wi} style={{ fontSize: 11, color: '#B86E0A', lineHeight: 1.4, padding: '3px 6px', background: 'rgba(184,110,10,0.08)', borderRadius: 4, marginBottom: 3 }}>
                        {w}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ height: 1, background: palette.border, marginBottom: 14 }} />

        {/* AI context */}
        <div style={{ fontSize: 10, fontWeight: 700, color: palette.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>AI Context</div>
        <p style={{ fontSize: 11, color: palette.text3, lineHeight: 1.55, marginBottom: 12 }}>
          The AI reads these to write narratives in your voice. Fill both before generating.
        </p>
        {[
          { k: 'p', label: 'Core Problem *', val: problem, set: setProblem, ph: 'What was the problem? Who felt it and why did it matter?', rows: 3 },
          { k: 'w', label: 'Your Approach *', val: whatIDid, set: setWhatIDid, ph: 'How did you tackle it? Key decisions, methods, trade-offs.', rows: 3 },
        ].map(f => (
          <div key={f.k} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: palette.text3, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>{f.label}</label>
            <textarea value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} rows={f.rows}
              style={{ width: '100%', fontSize: 12, lineHeight: 1.6, color: palette.text, background: palette.surface2, border: `1px solid ${palette.border}`, borderRadius: 7, padding: '7px 10px', resize: 'none', fontFamily: 'var(--px-font)', outline: 'none', transition: 'border-color 0.15s' }}
              onFocus={e => (e.target.style.borderColor = '#E53416')}
              onBlur={e => (e.target.style.borderColor = palette.border)} />
          </div>
        ))}

        {creditsLeft !== null && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: palette.surface2, borderRadius: 6, border: `1px solid ${palette.border}` }}>
            <span style={{ fontSize: 11, color: palette.text3 }}>AI credits</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: creditsLeft > 3 ? palette.text2 : '#B86E0A' }}>{creditsLeft} left</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Add section picker ────────────────────────────────────────────────────────
function AddSectionTab({ onAdd, palette }: { onAdd: (t: CaseSectionType) => void; palette: P }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, height: 40, padding: '0 14px', fontSize: 13, fontWeight: 600, color: open ? '#E53416' : palette.text3, background: 'transparent', border: 'none', borderBottom: `2px solid ${open ? '#E53416' : 'transparent'}`, cursor: 'pointer', fontFamily: 'var(--px-font)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
        <Icon name="plus" size={14} /> Add section
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, overflow: 'hidden', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200 }}>
          {ADDABLE.map(type => {
            const def = SECTION_DEFS[type]
            return (
              <button key={type} onClick={() => { onAdd(type); setOpen(false) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: `1px solid ${palette.border}`, cursor: 'pointer', fontFamily: 'var(--px-font)', textAlign: 'left', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = palette.surface2)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontSize: 16 }}>{def.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: def.color, letterSpacing: '-0.01em' }}>{def.title}</div>
                  <div style={{ fontSize: 11, color: palette.text3, marginTop: 1 }}>{def.prompt.slice(0, 50)}…</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [showStoryCheck, setShowStoryCheck] = useState(false)

  // Sync with the global light/dark preference set on the dashboard
  const [lightMode, setLightMode] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('px-dark') !== 'true'
  })
  const toggleLightMode = (next: boolean) => {
    setLightMode(next)
    try { localStorage.setItem('px-dark', String(!next)) } catch {}
  }
  const palette = lightMode ? LIGHT : DARK

  const [title, setTitle] = useState('Untitled')
  const [editTitle, setEditTitle] = useState(false)
  const [published, setPublished] = useState(false)
  const [ndaEnabled, setNdaEnabled] = useState(false)
  const [saved, setSaved] = useState(true)

  const [sections, setSections] = useState<CaseSection[]>([])
  const [overviewData, setOverviewData] = useState<OverviewData>({ summary: '', role: '', timeline: '', team: '', metrics: [{ label: '', value: '' }, { label: '', value: '' }, { label: '', value: '' }] })
  const [coverUrl, setCoverUrl] = useState<string | undefined>()
  const [discipline, setDiscipline] = useState<string>('ux')

  const [activeIdx, setActiveIdx] = useState(0)
  const [problem, setProblem] = useState('')
  const [whatIDid, setWhatIDid] = useState('')
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null)
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null)

  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const stateRef = useRef({ sections, overviewData, coverUrl, title, published, ndaEnabled, problem, whatIDid })
  useEffect(() => { stateRef.current = { sections, overviewData, coverUrl, title, published, ndaEnabled, problem, whatIDid } })

  const markDirty = useCallback(() => {
    setSaved(false)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveNow(), 20000)
  }, [])

  const saveNow = useCallback(async () => {
    const s = stateRef.current
    await fetch(`/api/case-studies/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: s.sections, overview_data: s.overviewData, cover_image_url: s.coverUrl || null, title: s.title, published: s.published, nda_enabled: s.ndaEnabled, problem: s.problem, what_i_did: s.whatIDid }),
    })
    setSaved(true)
  }, [id])

  useEffect(() => {
    fetch(`/api/case-studies/${id}`).then(async r => {
      if (!r.ok) { router.push('/dashboard'); return }
      const data: CaseStudy = await r.json()
      setTitle(data.title)
      setPublished(data.published)
      setNdaEnabled(data.nda_enabled)
      setCoverUrl(data.cover_image_url || undefined)
      if (data.discipline) setDiscipline(data.discipline)
      setProblem(data.problem || '')
      setWhatIDid(data.what_i_did || '')
      if (data.sections?.length) setSections(data.sections)
      if (data.overview_data) setOverviewData(data.overview_data)
    })
    fetch('/api/ai/credits').then(async r => { if (r.ok) { const d = await r.json(); setCreditsLeft(d.credits_remaining) } })
  }, [id, router])

  const updateSection = (updated: CaseSection) => { setSections(s => s.map(x => x.id === updated.id ? updated : x)); markDirty() }

  const addSection = (type: CaseSectionType) => {
    const s = makeSection(type)
    setSections(prev => [...prev, s])
    setActiveIdx(sections.length) // new section becomes active
    markDirty()
  }

  const deleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId))
    setActiveIdx(prev => Math.max(0, prev - 1))
    markDirty()
  }

  const generateForSection = async (section: CaseSection) => {
    if (!problem || !whatIDid) return
    setGeneratingSectionId(section.id)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseStudyId: id, sectionType: section.type, sectionTitle: section.title, problem, whatIDid }),
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
  const activeSection = sections[activeIdx]
  const activeDef = activeSection ? SECTION_DEFS[activeSection.type] : SECTION_DEFS.overview

  const goTo = (i: number) => setActiveIdx(Math.max(0, Math.min(sections.length - 1, i)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: palette.bg, color: palette.text, fontFamily: 'var(--px-font)', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: `1px solid ${palette.border}`, background: palette.surface, flexShrink: 0, gap: 12, zIndex: 10, overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button onClick={() => { saveNow(); router.push('/dashboard') }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: palette.text2, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--px-font)', fontWeight: 500, padding: '4px 6px', borderRadius: 5, flexShrink: 0 }}>
            <Icon name="arrowLeft" size={14} /> Builder
          </button>
          <div style={{ width: 1, height: 16, background: palette.border, flexShrink: 0 }} />
          {editTitle
            ? <input value={title} onChange={e => { setTitle(e.target.value); markDirty() }} onBlur={() => setEditTitle(false)} autoFocus
                style={{ fontSize: 14, fontWeight: 700, color: palette.text, background: 'transparent', border: 'none', borderBottom: `1px solid #E53416`, outline: 'none', fontFamily: 'var(--px-font)', letterSpacing: '-0.02em', width: 240, padding: '2px 0' }} />
            : <span onClick={() => setEditTitle(true)} style={{ fontSize: 14, fontWeight: 700, color: palette.text, letterSpacing: '-0.02em', cursor: 'text', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          }
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: saved ? '#3DBE6A' : palette.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name={saved ? 'checkCircle' : 'edit'} size={13} />{saved ? 'Saved' : 'Unsaved'}
          </span>
          {creditsLeft !== null && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, color: creditsLeft > 3 ? palette.text3 : '#B86E0A', background: creditsLeft > 3 ? palette.surface2 : '#FEF3E4', border: `1px solid ${creditsLeft > 3 ? palette.border : '#B86E0A'}` }}>
              {creditsLeft} credits
            </span>
          )}
          <button onClick={() => toggleLightMode(!lightMode)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', fontSize: 12, fontWeight: 600, borderRadius: 6, background: palette.surface2, color: palette.text2, border: `1px solid ${palette.border}`, cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
            <Icon name={lightMode ? 'moon' : 'sun'} size={13} /> {lightMode ? 'Dark' : 'Light'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: palette.surface2, border: `1px solid ${palette.border}`, borderRadius: 6 }}>
            <span style={{ fontSize: 12, color: palette.text2, fontWeight: 500 }}>{published ? 'Published' : 'Draft'}</span>
            <Toggle value={published} onChange={v => { setPublished(v); markDirty() }} size="sm" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: ndaEnabled ? 'rgba(229,52,22,0.08)' : palette.surface2, border: `1px solid ${ndaEnabled ? 'rgba(229,52,22,0.3)' : palette.border}`, borderRadius: 6 }}>
            <Icon name="lock" size={12} color={ndaEnabled ? '#E53416' : palette.text3} />
            <span style={{ fontSize: 12, color: ndaEnabled ? '#E53416' : palette.text2, fontWeight: 500 }}>NDA</span>
            <Toggle value={ndaEnabled} onChange={v => { setNdaEnabled(v); markDirty() }} size="sm" />
          </div>
          <button onClick={() => saveNow()}
            style={{ height: 30, padding: '0 16px', fontSize: 13, fontWeight: 600, borderRadius: 6, background: '#E53416', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
            Save
          </button>
        </div>
      </div>

      {/* ── Section tabs ── */}
      <div style={{ background: palette.surface, borderBottom: `1px solid ${palette.border}`, flexShrink: 0, overflowX: 'auto', display: 'flex', alignItems: 'stretch' }}>
        {sections.map((s, i) => {
          const def = SECTION_DEFS[s.type]
          const done = isSectionDone(s)
          const isActive = i === activeIdx
          return (
            <div key={s.id} style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'stretch' }}>
              <button onClick={() => setActiveIdx(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, height: 44, padding: '0 16px', fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? def.color : palette.text2, background: 'transparent', border: 'none', borderBottom: `2px solid ${isActive ? def.color : 'transparent'}`, cursor: 'pointer', fontFamily: 'var(--px-font)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                <div style={{ width: 8, height: 8, borderRadius: 999, background: done ? def.color : (isActive ? def.color + '50' : palette.border), flexShrink: 0, transition: 'background 0.2s' }} />
                {s.title}
              </button>
              {s.type !== 'overview' && i === activeIdx && (
                <button onClick={() => deleteSection(s.id)} title="Remove section"
                  style={{ display: 'flex', alignItems: 'center', paddingRight: 6, background: 'none', border: 'none', cursor: 'pointer', color: palette.text3, borderBottom: `2px solid ${def.color}` }}>
                  <Icon name="x" size={12} />
                </button>
              )}
            </div>
          )
        })}
        <AddSectionTab onAdd={addSection} palette={palette} />
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Canvas */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 16px 80px' : '40px 48px 80px' }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            {/* Section header */}
            {activeSection && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: `${activeDef.color}12`, borderRadius: 999, border: `1px solid ${activeDef.color}25`, marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: activeDef.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{activeDef.icon} {activeSection.type}</span>
                </div>
                {activeSection.type !== 'overview' ? (
                  <input
                    value={activeSection.title}
                    onChange={e => updateSection({ ...activeSection, title: e.target.value })}
                    placeholder={SECTION_TITLE_EXAMPLES[activeSection.type] || 'Section title'}
                    style={{ display: 'block', width: '100%', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: palette.text, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--px-font)', marginBottom: 0 }}
                  />
                ) : (
                  <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: palette.text, margin: 0 }}>Overview</h2>
                )}
              </div>
            )}

            {/* Content */}
            {activeSection?.type === 'overview' ? (
              <OverviewCanvas data={overviewData} onChange={d => { setOverviewData(d); markDirty() }} palette={palette} coverUrl={coverUrl} onCoverUrl={url => { setCoverUrl(url); markDirty() }} />
            ) : activeSection ? (
              <SectionCanvas section={activeSection} onUpdate={updateSection} palette={palette}
                generating={generatingSectionId === activeSection.id}
                onGenerate={() => generateForSection(activeSection)}
                canGenerate={canGenerate}
                discipline={discipline} />
            ) : (
              <div style={{ textAlign: 'center', paddingTop: 80, color: palette.text3 }}>
                <p style={{ fontSize: 15 }}>No sections yet. Add a section above to begin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Story Check — sidebar on desktop, bottom sheet on mobile */}
        {!isMobile && (
          <div style={{ width: 264, borderLeft: `1px solid ${palette.border}`, background: palette.surface, flexShrink: 0, overflow: 'hidden' }}>
            <StoryCheckPanel sections={sections} activeIdx={activeIdx} onJump={goTo}
              problem={problem} setProblem={v => { setProblem(v); markDirty() }}
              whatIDid={whatIDid} setWhatIDid={v => { setWhatIDid(v); markDirty() }}
              creditsLeft={creditsLeft} palette={palette} />
          </div>
        )}
        {isMobile && showStoryCheck && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column' }}>
            <div onClick={() => setShowStoryCheck(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} />
            <div style={{ background: palette.surface, borderTop: `1px solid ${palette.border}`, height: '70%', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${palette.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: palette.text }}>Story Check</span>
                <button onClick={() => setShowStoryCheck(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.text3, padding: 4 }}>
                  <Icon name="x" size={16} color={palette.text3} />
                </button>
              </div>
              <StoryCheckPanel sections={sections} activeIdx={activeIdx} onJump={i => { goTo(i); setShowStoryCheck(false) }}
                problem={problem} setProblem={v => { setProblem(v); markDirty() }}
                whatIDid={whatIDid} setWhatIDid={v => { setWhatIDid(v); markDirty() }}
                creditsLeft={creditsLeft} palette={palette} />
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom navigation ── */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 12px' : '0 32px', background: palette.surface, borderTop: `1px solid ${palette.border}`, flexShrink: 0, gap: 8 }}>
        {activeIdx > 0 ? (
          <button onClick={() => goTo(activeIdx - 1)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, height: 34, padding: '0 14px', fontSize: 13, fontWeight: 600, color: palette.text2, background: palette.surface2, border: `1px solid ${palette.border}`, borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--px-font)', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = palette.border)}
            onMouseLeave={e => (e.currentTarget.style.background = palette.surface2)}>
            <Icon name="arrowLeft" size={13} /> {sections[activeIdx - 1]?.title}
          </button>
        ) : <div />}

        {isMobile ? (
          <button onClick={() => setShowStoryCheck(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 34, padding: '0 12px', fontSize: 12, fontWeight: 600, color: palette.text2, background: palette.surface2, border: `1px solid ${palette.border}`, borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
            ✦ Story
          </button>
        ) : (
          <span style={{ fontSize: 12, color: palette.text3, fontWeight: 500 }}>
            {activeIdx + 1} / {sections.length}
          </span>
        )}

        {activeIdx < sections.length - 1 ? (
          <button onClick={() => goTo(activeIdx + 1)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, height: 34, padding: '0 14px', fontSize: 13, fontWeight: 700, color: '#fff', background: '#E53416', border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
            {sections[activeIdx + 1]?.title} <Icon name="chevronRight" size={13} color="#fff" />
          </button>
        ) : (
          <button onClick={() => saveNow()}
            style={{ display: 'flex', alignItems: 'center', gap: 7, height: 34, padding: '0 14px', fontSize: 13, fontWeight: 700, color: '#fff', background: '#1A8A4A', border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
            <Icon name="checkCircle" size={13} color="#fff" /> Done — Save
          </button>
        )}
      </div>
    </div>
  )
}
