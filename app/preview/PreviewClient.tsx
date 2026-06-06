'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CanvasLayout } from '@/components/published/CanvasLayout'
import { SpotlightLayout } from '@/components/published/SpotlightLayout'
import { Btn } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import type { Profile, CaseStudy, Testimonial, ToolStackItem, WorkExperience } from '@/types'

interface Props {
  profile: Profile
  caseStudies: CaseStudy[]
  tools: ToolStackItem[]
  testimonials: Testimonial[]
}

export function PreviewClient({ profile, caseStudies, tools, testimonials }: Props) {
  const router = useRouter()
  const [layout, setLayout] = useState<'canvas' | 'spotlight'>(profile.layout as 'canvas' | 'spotlight')

  const sharedProps = {
    profile,
    caseStudies,
    tools,
    testimonials,
    experience: [] as WorkExperience[],
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Preview chrome bar — stripped from published view */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--px-border)', background: 'var(--px-surface)', flexShrink: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--px-text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--px-font)', fontWeight: 500 }}>
          <Icon name="arrowLeft" size={13} /> Back to builder
        </button>
        {/* Layout toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--px-surface-2)', border: '1px solid var(--px-border)', borderRadius: 8, padding: 3 }}>
          {(['canvas', 'spotlight'] as const).map(l => (
            <button key={l} onClick={() => setLayout(l)}
              style={{ padding: '4px 14px', fontSize: 12, fontWeight: 600, borderRadius: 5, background: layout === l ? 'var(--px-surface)' : 'transparent', color: layout === l ? 'var(--px-text)' : 'var(--px-text-3)', border: layout === l ? '1px solid var(--px-border)' : '1px solid transparent', cursor: 'pointer', fontFamily: 'var(--px-font)', transition: 'all 0.15s', textTransform: 'capitalize', boxShadow: layout === l ? 'var(--px-shadow-sm)' : 'none' }}>
              {l}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {profile.slug && (
            <span style={{ fontSize: 11, color: 'var(--px-text-3)' }}>{profile.slug}.portfoliox.me</span>
          )}
          <Btn variant="secondary" size="xs" icon="externalLink"
            onClick={() => profile.slug && window.open(`https://${profile.slug}.portfoliox.me`, '_blank')}>
            Open live
          </Btn>
        </div>
      </div>

      {/* Scrollable preview — no builder chrome */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {layout === 'spotlight'
          ? <SpotlightLayout {...sharedProps} />
          : <CanvasLayout {...sharedProps} />
        }
      </div>
    </div>
  )
}
