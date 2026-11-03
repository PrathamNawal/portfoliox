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
import { CountUp } from '@/components/published/CountUp'
import { resolveMotion } from '@/lib/motion'
import { skimOf, stageOf, type Band } from '@/lib/case-copy'
import { structure } from '@/lib/case-structure'
import { SECTION_DEFS } from '@/lib/case-study-templates'
import type { Profile, CaseStudy, CaseSection, OverviewData } from '@/types'

interface Props {
  profile: Profile
  caseStudy: CaseStudy
  ndaLocked: boolean
  slug: string
}

// ── Narrative renderer ────────────────────────────────────────────────────────
// The narrative is plain text with paragraphs and **bold**/*italic* markers. lib/case-structure.ts reads its
// patterns (numbered titles, term - description runs, label: text runs, short titles, one-line lists) into typed
// nodes, so they render as steps, cards, sub-headings and lists instead of a run of paragraphs.
function renderNarrative(text: string): React.ReactNode {
  if (!text?.trim()) return null
  return structure(text).map((node, i) => {
    switch (node.k) {
      case 'ul': return <ul key={i} className="px-ul">{node.items.map((l, li) => <li key={li}><InlineMarkdown text={l} /></li>)}</ul>
      case 'ol': return <ol key={i} className="px-ol">{node.items.map((l, li) => <li key={li}><InlineMarkdown text={l} /></li>)}</ol>
      case 'step': return <h3 key={i} className="px-step"><span>{node.n}</span>{node.title}</h3>
      case 'h3': return <h3 key={i} className="px-h3">{node.text}</h3>
      case 'label': return <p key={i} className="px-label">{node.text}</p>
      case 'defs':
        return (
          <div key={i} className="px-defs">
            {node.items.map((d, di) => (
              <div key={di} className="px-def">
                {d.n && <span className="px-def__n" aria-hidden="true">{d.n}</span>}
                <h4>{d.term}</h4>
                <p><InlineMarkdown text={d.text} /></p>
              </div>
            ))}
          </div>
        )
      default: return <p key={i} className={node.lead ? 'px-p px-p--lead' : 'px-p'}><InlineMarkdown text={node.text} /></p>
    }
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

// ── Overview: lead statement, meta strip, big metrics ─────────────────────────
function OverviewSection({ data, summary, animate }: { data: OverviewData; summary?: string; animate: boolean }) {
  // a metric needs a figure to be a metric: a label alone is not shown
  const metrics = data.metrics?.filter(m => m.value?.trim()) || []
  const meta = [['Role', data.role], ['Timeline', data.timeline], ['Team', data.team]].filter(([, v]) => v?.trim())

  return (
    <div className="px-ov">
      {(summary || data.summary) && <p className="px-ov__lead">{summary || data.summary}</p>}
      {meta.length > 0 && (
        <dl className="px-meta">
          {meta.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
      )}
      {metrics.length > 0 && (
        <ul className="px-metrics">
          {metrics.map((m, i) => <li key={i}><b><CountUp value={m.value} animate={animate} /></b><span>{m.label}</span></li>)}
        </ul>
      )}
    </div>
  )
}

// ── Content section ───────────────────────────────────────────────────────────
function hasContent(section: CaseSection) {
  return section.narrative?.trim().length > 0 || section.blocks?.length > 0
}

function BandView({ band, animate }: { band: Band; animate: boolean }) {
  if (band.kind === 'stats') {
    return (
      <aside className="px-band px-band--stats" aria-label={band.label}>
        <ul>{band.stats?.map((st, i) => <li key={i}><b><CountUp value={st.value} animate={animate} /></b><span>{st.text}</span></li>)}</ul>
      </aside>
    )
  }
  return (
    <aside className={`px-band px-band--${band.kind}`}>
      <span>{band.label}</span>
      <p>{band.text}</p>
    </aside>
  )
}

function ContentSection({ section, n, animate }: { section: CaseSection; n: number; animate: boolean }) {
  const def = SECTION_DEFS[section.type] || SECTION_DEFS.custom
  const hasNarrative = section.narrative?.trim().length > 0
  const hasBlocks = section.blocks?.length > 0

  if (!hasNarrative && !hasBlocks) return null
  const { layout, band } = stageOf(section)

  const visuals = hasBlocks && (
    <div className="px-ch__visuals">
      {mergeImageBlocks(section.blocks).map((block, i) => {
        if (block.type === 'image' && !block.imageUrl) return null
        if (block.type === 'compare' && (!block.beforeUrl || !block.afterUrl)) return null
        if (block.type === 'figma' && !block.figmaUrl) return null
        return <BlockRenderer key={block.id || i} block={block} accent="var(--px-text-3)" />
      })}
    </div>
  )

  return (
    <section className={`px-ch px-ch--${layout} px-rise`} aria-labelledby={`cs-${section.id}`}>
      {/* Chapter header: a large numeral, the title */}
      <header className="px-ch__head">
        <span className="px-ch__n" aria-hidden="true">{String(n).padStart(2, '0')}</span>
        <h2 id={`cs-${section.id}`}>{section.title || def.title}</h2>
      </header>

      {/* Split: the text stays in view beside the images. Otherwise: text, then visuals. */}
      <div className="px-ch__body">
        {hasNarrative && <div className="px-prose-col">{renderNarrative(section.narrative)}</div>}
        {visuals}
      </div>

      {band && <BandView band={band} animate={animate} />}
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
  // scroll motion follows the portfolio's Motion setting (Still is the default); reduced motion is handled per effect and in CSS
  const motionOn = resolveMotion((profile as { motion?: string }).motion) !== 'still'
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
          <div className="px-cs" data-motion={motionOn ? 'on' : 'off'}>

            {/* Title */}
            <h1 className="px-cs__title">{cs.title}</h1>

            {/* Overview: metrics + meta */}
            {overviewData && (overviewData.summary || overviewData.role || overviewData.metrics?.some(m => m.value)) && (
              <OverviewSection data={overviewData} summary={overviewSection?.narrative || overviewData.summary} animate={motionOn} />
            )}

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

            <div className="px-cs__grid" data-rail={chapters.length > 1 || undefined}>
              <CaseRail chapters={chapters} animate={motionOn} />
              <div className="px-cs__main">

                {/* Content sections */}
                {contentSections.filter(hasContent).map((section, i) => (
                  <ContentSection key={section.id} section={section} n={i + 1} animate={motionOn} />
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
