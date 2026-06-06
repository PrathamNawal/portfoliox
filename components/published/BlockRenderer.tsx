'use client'

import React, { useState, useRef, useCallback } from 'react'
import type { Block } from '@/types'

// ── Before/After slider (client-side interactive) ─────────────────────────────
function CompareSlider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const [pos, setPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const move = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)))
  }, [])

  return (
    <div ref={containerRef}
      style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: 8, cursor: 'col-resize', userSelect: 'none' }}
      onMouseDown={() => (dragging.current = true)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onMouseMove={e => { if (dragging.current) move(e.clientX) }}
      onTouchMove={e => move(e.touches[0].clientX)}
      onTouchStart={e => move(e.touches[0].clientX)}>
      {/* After (full) */}
      <img src={afterUrl} alt="After" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      {/* Before (clipped) */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${pos}%` }}>
        <img src={beforeUrl} alt="Before" style={{ width: containerRef.current?.offsetWidth || '100%', height: '100%', objectFit: 'cover', minWidth: '100%' }} />
      </div>
      {/* Handle */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, transform: 'translateX(-50%)', width: 2, background: '#fff', boxShadow: '0 0 8px rgba(0,0,0,0.4)' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 36, height: 36, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M4.5 2L1 7l3.5 5M9.5 2l3.5 5-3.5 5" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
      </div>
      <span style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.45)', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.04em', pointerEvents: 'none' }}>BEFORE</span>
      <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.45)', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.04em', pointerEvents: 'none' }}>AFTER</span>
    </div>
  )
}

// ── Figma embed ───────────────────────────────────────────────────────────────
function FigmaEmbed({ url }: { url: string }) {
  const [active, setActive] = useState(false)
  const embedUrl = `https://www.figma.com/embed?embed_host=portfoliox&url=${encodeURIComponent(url)}`
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#1a1028', borderRadius: 8, overflow: 'hidden' }}>
      {active ? (
        <iframe src={embedUrl} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen title="Figma prototype" />
      ) : (
        <div style={{ inset: 0, position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'linear-gradient(135deg,#1A1028,#2D1B4A)', cursor: 'pointer' }} onClick={() => setActive(true)}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(229,52,22,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="8,5 19,12 8,19"/></svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', margin: '0 0 4px' }}>Figma Prototype</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Click to interact</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main block renderer ───────────────────────────────────────────────────────
interface Props {
  block: Block
  accent?: string
}

export function BlockRenderer({ block, accent = '#E53416' }: Props) {
  const labelStyle: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: accent,
    marginBottom: 10,
    padding: '2px 8px',
    background: `${accent}10`,
    borderRadius: 4,
    border: `1px solid ${accent}20`,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <span style={labelStyle}>{block.sectionLabel}</span>

      {/* Image */}
      {block.type === 'image' && block.imageUrl && (
        <div>
          <img src={block.imageUrl} alt={block.caption || block.sectionLabel} style={{ width: '100%', borderRadius: 8, display: 'block', maxHeight: 600, objectFit: 'cover' }} />
          {block.caption && <p style={{ fontSize: 13, color: 'var(--px-text-3)', marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>{block.caption}</p>}
        </div>
      )}

      {/* Gallery */}
      {block.type === 'gallery' && block.images && block.images.some(i => i.url) && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${block.images.filter(i => i.url).length}, 1fr)`, gap: 10 }}>
            {block.images.filter(i => i.url).map((img, idx) => (
              <div key={idx}>
                <img src={img.url} alt={img.caption || ''} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                {img.caption && <p style={{ fontSize: 12, color: 'var(--px-text-3)', marginTop: 6, fontStyle: 'italic' }}>{img.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Figma */}
      {block.type === 'figma' && block.figmaUrl && <FigmaEmbed url={block.figmaUrl} />}

      {/* Compare */}
      {block.type === 'compare' && block.beforeUrl && block.afterUrl && (
        <CompareSlider beforeUrl={block.beforeUrl} afterUrl={block.afterUrl} />
      )}

      {/* Text */}
      {block.type === 'text' && block.html && (
        <div className="px-prose" dangerouslySetInnerHTML={{ __html: block.html }}
          style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--px-text)', maxWidth: '65ch' }} />
      )}
    </div>
  )
}
