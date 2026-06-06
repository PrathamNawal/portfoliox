'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { BlockRenderer } from '@/components/published/BlockRenderer'
import { NDAGate } from '@/components/published/NDAGate'
import { AnalyticsTracker } from '@/components/published/AnalyticsTracker'
import type { Profile, CaseStudy, Block } from '@/types'

const TOOL_COLORS: Record<string, string> = { Figma: '#A259FF', Framer: '#0099FF', Notion: '#1C1B18', Miro: '#FFD02F', Maze: '#FF5A5F' }

interface Props {
  profile: Profile
  caseStudy: CaseStudy
  ndaLocked: boolean
  slug: string
}

export function CaseStudyPageClient({ profile, caseStudy: initialCs, ndaLocked: initialLocked, slug }: Props) {
  const [locked, setLocked] = useState(initialLocked)
  const [cs, setCs] = useState(initialCs)

  const handleUnlock = async () => {
    // Reload the page to get server to re-render with the new cookie
    window.location.reload()
  }

  const meta = (cs.metadata || {}) as Record<string, string>
  const generated = (cs.ai_generated || {}) as Record<string, string>
  const blocks: Block[] = cs.blocks || []

  const accent = '#E53416'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--px-bg)', color: 'var(--px-text)' }}>
      <AnalyticsTracker userId={profile.id} caseStudyId={cs.id} eventType="case_study_view" />

      {/* Back nav */}
      <nav style={{ background: 'var(--px-surface)', borderBottom: '1px solid var(--px-border)', padding: '0 40px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href={`/${slug}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--px-text-3)', textDecoration: 'none', fontWeight: 500 }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <line x1="16" y1="10" x2="4" y2="10"/><polyline points="9 15 4 10 9 5"/>
          </svg>
          {profile.name}
        </Link>
        {!locked && (
          <span style={{ fontSize: 12, color: 'var(--px-text-3)' }}>{profile.name} / {cs.title}</span>
        )}
      </nav>

      {/* NDA gate */}
      {locked ? (
        <NDAGate caseStudyId={cs.id} title={cs.title} onUnlocked={handleUnlock} />
      ) : (
        <>
          {/* Hero */}
          {cs.cover_image_url ? (
            <div style={{ width: '100%', aspectRatio: '16/9', maxHeight: 560, overflow: 'hidden', background: '#1A1028' }}>
              <img src={cs.cover_image_url} alt={cs.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ) : (
            <div style={{ width: '100%', height: 320, background: 'linear-gradient(135deg,#2A1B4A 0%,#5B3FA6 60%,#7B5EE0 100%)' }} />
          )}

          {/* Content */}
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 96px' }}>
            {/* Title + metadata */}
            <div style={{ marginBottom: 40 }}>
              <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--px-text)', lineHeight: 1.15, marginBottom: 16 }}>{cs.title}</h1>
              {/* Meta pills */}
              {(meta.role || meta.duration || meta.platform || meta.client) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                  {meta.role && <MetaPill label="Role" value={meta.role} />}
                  {meta.client && <MetaPill label="Client" value={meta.client} />}
                  {meta.duration && <MetaPill label="Duration" value={meta.duration} />}
                  {meta.platform && <MetaPill label="Platform" value={meta.platform} />}
                </div>
              )}
              {/* Intro narrative */}
              {generated.intro && (
                <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--px-text-2)', fontWeight: 400 }}>{generated.intro}</p>
              )}
            </div>

            {/* All blocks */}
            {blocks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
                {blocks.map((block, i) => (
                  block.type === 'image' ? (
                    // Only render if image exists
                    block.imageUrl ? <BlockRenderer key={block.id || i} block={block} accent={accent} /> : null
                  ) : (
                    <BlockRenderer key={block.id || i} block={block} accent={accent} />
                  )
                ))}
              </div>
            )}

            {/* Process + Outcome narrative */}
            {(generated.process || generated.outcome) && (
              <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 24 }}>
                {generated.process && (
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent, display: 'block', marginBottom: 10 }}>Process</span>
                    <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--px-text-2)' }}>{generated.process}</p>
                  </div>
                )}
                {generated.outcome && (
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent, display: 'block', marginBottom: 10 }}>Outcome</span>
                    <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--px-text-2)' }}>{generated.outcome}</p>
                  </div>
                )}
              </div>
            )}

            {/* Back to portfolio */}
            <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--px-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link href={`/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--px-text-2)', textDecoration: 'none' }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                  <line x1="16" y1="10" x2="4" y2="10"/><polyline points="9 15 4 10 9 5"/>
                </svg>
                Back to {profile.name}&apos;s portfolio
              </Link>
              <a href={`mailto:?subject=Let's work together`} style={{ display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 16px', fontSize: 13, fontWeight: 600, background: accent, color: '#fff', borderRadius: 8, textDecoration: 'none' }}>
                Get in touch
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--px-text-3)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)' }}>{value}</span>
    </div>
  )
}
