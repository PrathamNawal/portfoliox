'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BlockRenderer } from '@/components/published/BlockRenderer'
import { NDAGate } from '@/components/published/NDAGate'
import { AnalyticsTracker } from '@/components/published/AnalyticsTracker'
import { ThemeScope } from '@/components/published/ThemeScope'
import { CoverImage } from '@/components/published/CoverImage'
import { ViewTransitionGate } from '@/components/published/ViewTransitionGate'
import { transitionClick } from '@/lib/view-transition'
import { mergeImageBlocks } from '@/lib/image-shape'
import { CaseRail } from '@/components/published/CaseRail'
import { asLabel, asStat, asStep, skimOf } from '@/lib/case-copy'
import { SECTION_DEFS } from '@/lib/case-study-templates'
import type { Profile, CaseStudy, CaseSection, OverviewData } from '@/types'

interface Props {
  profile: Profile
  caseStudy: CaseStudy
  ndaLocked: boolean
  slug: string
}

// ── Narrative renderer ────────────────────────────────────────────────────────
// Narrative is plain text with paragraphs, **bold**/*italic* markers, and
// "- " / "1. " list lines — which can appear right after a bold label line
// with no blank line in between, so we parse line-by-line rather than by
// blank-line-separated paragraph, and group consecutive list lines together.
const BODY_TEXT_STYLE: React.CSSProperties = { fontSize: 16, lineHeight: 1.75, color: 'var(--px-text-2)', fontFamily: 'var(--px-font-body)' }

const BULLET_RE = /^[-*•]\s+/
const NUMBERED_RE = /^\d+\.\s+/

type NarrativeBlock = { kind: 'ul' | 'ol' | 'p'; lines: string[] }

function parseNarrativeBlocks(text: string): NarrativeBlock[] {
  const lines = text.split('\n')
  const blocks: NarrativeBlock[] = []
  let i = 0
  while (i < lines.length) {
    if (lines[i].trim() === '') { i++; continue }
    if (BULLET_RE.test(lines[i].trim())) {
      const items: string[] = []
      while (i < lines.length && BULLET_RE.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(BULLET_RE, ''))
        i++
      }
      blocks.push({ kind: 'ul', lines: items })
      continue
    }
    if (NUMBERED_RE.test(lines[i].trim())) {
      const items: string[] = []
      while (i < lines.length && NUMBERED_RE.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(NUMBERED_RE, ''))
        i++
      }
      blocks.push({ kind: 'ol', lines: items })
      continue
    }
    const paraLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !BULLET_RE.test(lines[i].trim()) && !NUMBERED_RE.test(lines[i].trim())) {
      paraLines.push(lines[i])
      i++
    }
    blocks.push({ kind: 'p', lines: paraLines })
  }
  return blocks
}

function renderNarrative(text: string): React.ReactNode {
  if (!text?.trim()) return null
  return parseNarrativeBlocks(text).map((block, bi) => {
    if (block.kind === 'ul') {
      return (
        <ul key={bi} className="px-ul">
          {block.lines.map((l, li) => {
            const stat = asStat(l)
            return stat ? (
              <li key={li} className="px-ul__stat"><b>{stat.value}</b><span><InlineMarkdown text={stat.text} /></span></li>
            ) : (
              <li key={li}><InlineMarkdown text={l} /></li>
            )
          })}
        </ul>
      )
    }
    if (block.kind === 'ol') {
      return (
        <ol key={bi} className="px-ol">
          {block.lines.map((l, li) => <li key={li}><InlineMarkdown text={l} /></li>)}
        </ol>
      )
    }
    if (block.lines.length === 1) {
      const step = asStep(block.lines[0])
      if (step) return <h3 key={bi} className="px-step"><span>{step.n}</span>{step.title}</h3>
      const label = asLabel(block.lines[0])
      if (label) return <p key={bi} className="px-label">{label}</p>
    }
    // a section that opens with a paragraph gets a lead; one that opens with a step or label does not
    const isLead = bi === 0 && block.lines.join(' ').length >= 60
    return (
      <p key={bi} className={isLead ? 'px-p px-p--lead' : 'px-p'}>
        <InlineMarkdown text={block.lines.join('\n')} />
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
        <p style={{ fontSize: 20, lineHeight: 1.65, color: 'var(--px-text)', fontWeight: 500, letterSpacing: '-0.01em', marginBottom: 36, maxWidth: 620, fontFamily: 'var(--px-font-body)' }}>
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
function hasContent(section: CaseSection) {
  return section.narrative?.trim().length > 0 || section.blocks?.length > 0
}

function ContentSection({ section, n }: { section: CaseSection; n: number }) {
  const def = SECTION_DEFS[section.type] || SECTION_DEFS.custom
  const hasNarrative = section.narrative?.trim().length > 0
  const hasBlocks = section.blocks?.length > 0

  if (!hasNarrative && !hasBlocks) return null

  return (
    <section className="px-ch px-rise" aria-labelledby={`cs-${section.id}`}>
      {/* Chapter header: number, title, hairline */}
      <header className="px-ch__head">
        <span className="px-ch__n" aria-hidden="true">{String(n).padStart(2, '0')}</span>
        <h2 id={`cs-${section.id}`}>{section.title || def.title}</h2>
      </header>

      {/* Narrative: a readable line length even though the canvas is wide */}
      {hasNarrative && (
        <div className="px-prose-col" style={{ marginBottom: hasBlocks ? 32 : 0 }}>
          {renderNarrative(section.narrative)}
        </div>
      )}

      {/* Visual blocks */}
      {hasBlocks && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {mergeImageBlocks(section.blocks).map((block, i) => {
            if (block.type === 'image' && !block.imageUrl) return null
            if (block.type === 'compare' && (!block.beforeUrl || !block.afterUrl)) return null
            if (block.type === 'figma' && !block.figmaUrl) return null
            return <BlockRenderer key={block.id || i} block={block} accent="var(--px-text-3)" />
          })}
        </div>
      )}
    </section>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function CaseStudyPageClient({ profile, caseStudy: initialCs, ndaLocked: initialLocked, slug }: Props) {
  const [locked, setLocked] = useState(initialLocked)
  const cs = initialCs
  const router = useRouter()
  // Going back shrinks the hero into this project's card on the portfolio.
  const back = (e: React.MouseEvent) => transitionClick(e, router, `/${slug}`, document.querySelector<HTMLElement>('[data-vt-hero]'))

  const handleUnlock = () => window.location.reload()

  const sections = cs.sections || []
  const overviewSection = sections.find(s => s.type === 'overview')
  const contentSections = sections.filter(s => s.type !== 'overview')
  const chapters = contentSections.filter(hasContent).map(s => ({ id: s.id, title: s.title || (SECTION_DEFS[s.type] || SECTION_DEFS.custom).title }))
  const skim = skimOf(contentSections)
  const overviewData = cs.overview_data

  return (
    <ThemeScope theme={profile.theme}>
      <ViewTransitionGate mode="hero" />
      <div className="px-progress" aria-hidden="true" />
      <AnalyticsTracker userId={profile.id} caseStudyId={cs.id} eventType="case_study_view" />

      {/* Sticky nav */}
      <nav style={{ background: 'var(--px-surface)', borderBottom: '1px solid var(--px-border)', padding: '0 clamp(16px, 4vw, 40px)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href={`/${slug}`} onClick={back} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--px-text-3)', textDecoration: 'none', fontWeight: 500 }}>
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
          {/* Hero: the whole cover, never cropped. A blurred copy of it fills whatever the image's shape leaves over. */}
          {cs.cover_image_url ? (
            <div data-vt-hero style={{ position: 'relative', width: '100%', height: 'min(560px, 56vw)' }}>
              <CoverImage url={cs.cover_image_url} fit="fit" label={cs.title} />
            </div>
          ) : (
            <div data-vt-hero style={{ width: '100%', height: 300, background: 'linear-gradient(135deg,#2A1B4A 0%,#5B3FA6 60%,#7B5EE0 100%)' }} />
          )}

          {/* Content: a header (title, skim cards, overview) over a grid of chapter rail + chapters */}
          <div className="px-cs">

            {/* Title */}
            <h1 className="px-cs__title">{cs.title}</h1>

            {/* Skim: problem / approach / outcome in a few seconds */}
            {skim.length > 0 && (
              <div className="px-skim" role="group" aria-label="At a glance">
                {skim.map(k => (
                  <a key={k.id} href={`#cs-${k.id}`} className="px-skim__card" onClick={e => { const el = document.getElementById(`cs-${k.id}`); if (el) { e.preventDefault(); el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) } }}>
                    <span>{k.label}</span>
                    <p>{k.text}</p>
                  </a>
                ))}
              </div>
            )}

            {/* Overview: metrics + meta */}
            {overviewData && (overviewData.summary || overviewData.role || overviewData.metrics?.some(m => m.value)) && (
              <OverviewSection data={overviewData} summary={overviewSection?.narrative || overviewData.summary} />
            )}

            <div className="px-cs__grid" data-rail={chapters.length > 1 || undefined}>
              <CaseRail chapters={chapters} />
              <div className="px-cs__main">

                {/* Content sections */}
                {contentSections.filter(hasContent).map((section, i) => (
                  <ContentSection key={section.id} section={section} n={i + 1} />
                ))}

            {/* Footer */}
            <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--px-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <Link href={`/${slug}`} onClick={back} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--px-text-2)', textDecoration: 'none' }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                  <line x1="16" y1="10" x2="4" y2="10"/><polyline points="9 15 4 10 9 5"/>
                </svg>
                Back to {profile.name}&apos;s portfolio
              </Link>
              <a href="mailto:?subject=Let's work together" style={{ display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 16px', fontSize: 13, fontWeight: 600, background: 'var(--px-accent)', color: 'var(--px-accent-fg)', borderRadius: 8, textDecoration: 'none' }}>
                Get in touch
              </a>
            </div>
              </div>
            </div>
          </div>
        </>
      )}
    </ThemeScope>
  )
}
