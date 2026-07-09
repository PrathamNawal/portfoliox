'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { BlockRenderer } from '@/components/published/BlockRenderer'
import { NDAGate } from '@/components/published/NDAGate'
import { AnalyticsTracker } from '@/components/published/AnalyticsTracker'
import { SECTION_DEFS } from '@/lib/case-study-templates'
import type { Profile, CaseStudy, CaseSection, OverviewData } from '@/types'

interface Props {
  profile: Profile
  caseStudy: CaseStudy
  ndaLocked: boolean
  slug: string
}

// ── Narrative renderer ────────────────────────────────────────────────────────
// Narrative is plain text with \n\n paragraphs and **bold** / *italic* markers
function renderNarrative(text: string): React.ReactNode {
  if (!text?.trim()) return null
  return text.split(/\n\n+/).map((para, pi) => {
    const trimmed = para.trim()
    if (!trimmed) return null
    // Detect numbered list paragraph (lines starting with digit.)
    const lines = trimmed.split('\n')
    const isList = lines.every(l => /^\d+\./.test(l.trim()) || l.trim() === '')
    if (isList) {
      return (
        <ol key={pi} style={{ paddingLeft: 22, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {lines.filter(l => l.trim()).map((l, li) => (
            <li key={li} style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--px-text-2)' }}>
              <InlineMarkdown text={l.replace(/^\d+\.\s*/, '')} />
            </li>
          ))}
        </ol>
      )
    }
    return (
      <p key={pi} style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--px-text-2)', margin: '0 0 18px', whiteSpace: 'pre-wrap' }}>
        <InlineMarkdown text={trimmed} />
      </p>
    )
  })
}

function InlineMarkdown({ text }: { text: string }) {
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ color: 'var(--px-text)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>
        }
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </>
  )
}

// ── Overview section ──────────────────────────────────────────────────────────
function OverviewSection({ data, summary }: { data: OverviewData; summary?: string }) {
  const filledMetrics = data.metrics?.filter(m => m.label || m.value) || []
  const hasMeta = data.role || data.timeline || data.team

  return (
    <div style={{ marginBottom: 56 }}>
      {/* Summary */}
      {(summary || data.summary) && (
        <p style={{ fontSize: 20, lineHeight: 1.65, color: 'var(--px-text)', fontWeight: 500, letterSpacing: '-0.01em', marginBottom: 36, maxWidth: 640 }}>
          {summary || data.summary}
        </p>
      )}

      {/* Metrics */}
      {filledMetrics.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(filledMetrics.length, 3)}, 1fr)`, gap: 12, marginBottom: hasMeta ? 24 : 0 }}>
          {filledMetrics.map((m, i) => (
            <div key={i} style={{ padding: '18px 20px', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#E53416', marginBottom: 4 }}>{m.value}</div>
              <div style={{ fontSize: 12, color: 'var(--px-text-3)', fontWeight: 500 }}>{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Role / Timeline / Team */}
      {hasMeta && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {data.role && <MetaPill label="Role" value={data.role} />}
          {data.timeline && <MetaPill label="Timeline" value={data.timeline} />}
          {data.team && <MetaPill label="Team" value={data.team} />}
        </div>
      )}
    </div>
  )
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 16px', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 10 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--px-text-3)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)' }}>{value}</span>
    </div>
  )
}

// ── Content section ───────────────────────────────────────────────────────────
function ContentSection({ section }: { section: CaseSection }) {
  const def = SECTION_DEFS[section.type] || SECTION_DEFS.custom
  const hasNarrative = section.narrative?.trim().length > 0
  const hasBlocks = section.blocks?.length > 0

  if (!hasNarrative && !hasBlocks) return null

  return (
    <div style={{ marginBottom: 64 }}>
      {/* Section type — quiet, no pill chrome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--px-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
          {def.icon} {section.type}
        </span>
      </div>

      {/* Section title — the actual heading */}
      <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--px-text)', lineHeight: 1.2, marginBottom: 20 }}>
        {section.title || def.title}
      </h2>

      {/* Narrative — kept to a readable line length even though the canvas is wide */}
      {hasNarrative && (
        <div style={{ maxWidth: 680, marginBottom: hasBlocks ? 32 : 0 }}>
          {renderNarrative(section.narrative)}
        </div>
      )}

      {/* Visual blocks */}
      {hasBlocks && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {section.blocks.map((block, i) => {
            if (block.type === 'image' && !block.imageUrl) return null
            if (block.type === 'compare' && (!block.beforeUrl || !block.afterUrl)) return null
            if (block.type === 'figma' && !block.figmaUrl) return null
            return <BlockRenderer key={block.id || i} block={block} accent="var(--px-text-3)" />
          })}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function CaseStudyPageClient({ profile, caseStudy: initialCs, ndaLocked: initialLocked, slug }: Props) {
  const [locked, setLocked] = useState(initialLocked)
  const cs = initialCs

  const handleUnlock = () => window.location.reload()

  const sections = cs.sections || []
  const overviewSection = sections.find(s => s.type === 'overview')
  const contentSections = sections.filter(s => s.type !== 'overview')
  const overviewData = cs.overview_data

  return (
    <div style={{ minHeight: '100vh', background: 'var(--px-bg)', color: 'var(--px-text)' }}>
      <AnalyticsTracker userId={profile.id} caseStudyId={cs.id} eventType="case_study_view" />

      {/* Sticky nav */}
      <nav style={{ background: 'var(--px-surface)', borderBottom: '1px solid var(--px-border)', padding: '0 clamp(16px, 4vw, 40px)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href={`/${slug}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--px-text-3)', textDecoration: 'none', fontWeight: 500 }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <line x1="16" y1="10" x2="4" y2="10"/><polyline points="9 15 4 10 9 5"/>
          </svg>
          {profile.name}
        </Link>
        {!locked && (
          <span style={{ fontSize: 12, color: 'var(--px-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }}>
            {cs.title}
          </span>
        )}
      </nav>

      {/* NDA gate */}
      {locked ? (
        <NDAGate caseStudyId={cs.id} title={cs.title} onUnlocked={handleUnlock} />
      ) : (
        <>
          {/* Hero */}
          {cs.cover_image_url ? (
            <div style={{ width: '100%', maxHeight: 520, overflow: 'hidden' }}>
              <img src={cs.cover_image_url} alt={cs.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', maxHeight: 520 }} />
            </div>
          ) : (
            <div style={{ width: '100%', height: 300, background: 'linear-gradient(135deg,#2A1B4A 0%,#5B3FA6 60%,#7B5EE0 100%)' }} />
          )}

          {/* Content — wide canvas so visual blocks have room; prose stays narrow within it */}
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 5vw, 56px) clamp(16px, 4vw, 40px) 96px' }}>

            {/* Title */}
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--px-text)', lineHeight: 1.15, marginBottom: 32 }}>
              {cs.title}
            </h1>

            {/* Overview: metrics + meta */}
            {overviewData && (overviewData.summary || overviewData.role || overviewData.metrics?.some(m => m.value)) && (
              <OverviewSection data={overviewData} summary={overviewSection?.narrative || overviewData.summary} />
            )}

            {/* Divider before sections */}
            {contentSections.length > 0 && (
              <div style={{ height: 1, background: 'var(--px-border)', marginBottom: 48 }} />
            )}

            {/* Content sections */}
            {contentSections.map(section => (
              <ContentSection key={section.id} section={section} />
            ))}

            {/* Footer */}
            <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--px-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <Link href={`/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--px-text-2)', textDecoration: 'none' }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                  <line x1="16" y1="10" x2="4" y2="10"/><polyline points="9 15 4 10 9 5"/>
                </svg>
                Back to {profile.name}&apos;s portfolio
              </Link>
              <a href="mailto:?subject=Let's work together" style={{ display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 16px', fontSize: 13, fontWeight: 600, background: '#E53416', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>
                Get in touch
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
