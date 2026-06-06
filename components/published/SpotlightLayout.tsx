import React from 'react'
import Link from 'next/link'
import { AnalyticsTracker } from './AnalyticsTracker'
import type { Profile, CaseStudy, Testimonial, WorkExperience, ToolStackItem } from '@/types'

const GRAD = [
  'linear-gradient(135deg,#2A1B4A 0%,#5B3FA6 60%,#7B5EE0 100%)',
  'linear-gradient(135deg,#0D2218 0%,#1A5C38 100%)',
  'linear-gradient(135deg,#1A1028 0%,#2D1B4A 50%,#3A1B5A 100%)',
  'linear-gradient(135deg,#2A1018 0%,#5A1A2A 100%)',
]
const TOOL_COLORS: Record<string, string> = { Figma: '#A259FF', Framer: '#0099FF', Notion: '#1C1B18', Miro: '#FFD02F', Maze: '#FF5A5F' }
const DISCIPLINE: Record<string, string> = { ux: 'UX / Product Designer', graphic: 'Graphic Designer', motion: 'Motion Designer', illustration: 'Illustrator' }

interface Props {
  profile: Profile
  caseStudies: Partial<CaseStudy>[]
  testimonials: Testimonial[]
  experience: WorkExperience[]
  tools: ToolStackItem[]
}

export function SpotlightLayout({ profile, caseStudies, testimonials, tools }: Props) {
  const social = profile.social_links || {}

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC' }}>
      <AnalyticsTracker userId={profile.id} eventType="page_view" />

      {/* Hero — centered editorial */}
      <header style={{ background: '#FAF8F4', borderBottom: '1px solid #E8E4DC', padding: '64px 24px 52px', textAlign: 'center' }}>
        {profile.avatar_url
          ? <img src={profile.avatar_url} alt={profile.name} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 24px', display: 'block' }} />
          : <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#E53416', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><span style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>{profile.name[0]}</span></div>
        }
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.045em', color: '#1C1B18', marginBottom: 10 }}>{profile.name}</h1>
        {profile.discipline && (
          <p style={{ fontSize: 14, fontWeight: 600, color: '#9A978E', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>{DISCIPLINE[profile.discipline]}</p>
        )}
        {profile.bio && (
          <p style={{ fontSize: 17, color: '#6C6960', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 20px' }}>{profile.bio}</p>
        )}
        {/* Skills */}
        {profile.skills?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginBottom: 28 }}>
            {profile.skills.map(s => (
              <span key={s} style={{ padding: '5px 13px', fontSize: 12, fontWeight: 500, borderRadius: 999, background: 'transparent', border: '1px solid #D8D4CC', color: '#6C6960', letterSpacing: '-0.01em' }}>{s}</span>
            ))}
          </div>
        )}
        {/* Social + CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {social.linkedin && <OutlineBtn href={`https://linkedin.com/in/${social.linkedin}`}>LinkedIn</OutlineBtn>}
          {social.dribbble && <OutlineBtn href={`https://dribbble.com/${social.dribbble}`}>Dribbble</OutlineBtn>}
          {social.behance && <OutlineBtn href={`https://behance.net/${social.behance}`}>Behance</OutlineBtn>}
          {social.website && <OutlineBtn href={social.website}>Website</OutlineBtn>}
          {profile.resume_url && <OutlineBtn href={profile.resume_url}>Resume</OutlineBtn>}
          <a href="mailto:?subject=Hello" style={{ display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 16px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--px-r)', background: '#E53416', color: '#fff', textDecoration: 'none' }}>Get in touch</a>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Divider */}
        {caseStudies.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <div style={{ flex: 1, height: 1, background: '#D8D4CC' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A978E', fontStyle: 'italic' }}>Selected work</span>
              <div style={{ flex: 1, height: 1, background: '#D8D4CC' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {caseStudies.map((cs, i) => <SpotlightCaseCard key={cs.id} cs={cs as CaseStudy} index={i} slug={profile.slug!} />)}
            </div>
          </>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: '#D8D4CC' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A978E', fontStyle: 'italic' }}>What people say</span>
              <div style={{ flex: 1, height: 1, background: '#D8D4CC' }} />
            </div>
            {testimonials.map(t => (
              <blockquote key={t.id} style={{ margin: '0 0 20px', padding: '22px 26px', background: '#FAF8F4', border: '1px solid #E8E4DC', borderRadius: 'var(--px-r-lg)' }}>
                <p style={{ fontSize: 15, color: '#1C1B18', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 14 }}>&quot;{t.quote}&quot;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {t.photo_url ? <img src={t.photo_url} alt={t.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#7B5EE0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{t.name[0]}</span></div>}
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#6C6960' }}>{t.name} — {t.title_and_company}</span>
                </div>
              </blockquote>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 56, padding: '36px 0', borderTop: '1px solid #D8D4CC', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#9A978E', marginBottom: 16, lineHeight: 1.6 }}>Open to full-time and freelance opportunities</p>
          <a href="mailto:?subject=Hello" style={{ display: 'inline-flex', alignItems: 'center', height: 44, padding: '0 22px', fontSize: 15, fontWeight: 600, borderRadius: 'var(--px-r)', background: '#E53416', color: '#fff', textDecoration: 'none' }}>Say hello →</a>
          {tools.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16, marginTop: 24 }}>
              {tools.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9A978E', fontWeight: 500 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: TOOL_COLORS[t.tool_name] || '#888', flexShrink: 0 }} />{t.tool_name}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function SpotlightCaseCard({ cs, index, slug }: { cs: CaseStudy; index: number; slug: string }) {
  const grad = GRAD[index % GRAD.length]
  const bg = cs.cover_image_url ? `url(${cs.cover_image_url}) center/cover` : grad

  return (
    <Link href={`/${slug}/case/${cs.id}`} style={{ display: 'grid', gridTemplateColumns: '220px 1fr', background: 'var(--px-surface)', borderRadius: 'var(--px-r-xl)', border: '1px solid var(--px-border)', overflow: 'hidden', textDecoration: 'none', transition: 'box-shadow 0.18s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--px-shadow-lg)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = ''}>
      <div style={{ background: bg, position: 'relative', minHeight: 160 }}>
        {cs.nda_enabled && (
          <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="4" y="9.5" width="12" height="8.5" rx="2"/><path d="M7.5 9.5V7a2.5 2.5 0 0 1 5 0v2.5"/></svg>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: '0.08em' }}>NDA</span>
          </div>
        )}
      </div>
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--px-text)', lineHeight: 1.3, marginBottom: 10 }}>{cs.title}</h3>
        {cs.nda_enabled
          ? <p style={{ fontSize: 13, color: 'var(--px-text-3)', fontStyle: 'italic' }}>Password protected — request access</p>
          : <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--px-accent)', letterSpacing: '-0.01em' }}>Read case study →</span>
        }
        {((cs.metadata as Record<string, string>)?.role || (cs.metadata as Record<string, string>)?.duration) && (
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {(cs.metadata as Record<string, string>)?.role && <span style={{ fontSize: 11, color: 'var(--px-text-3)', fontWeight: 500 }}>{(cs.metadata as Record<string, string>).role}</span>}
            {(cs.metadata as Record<string, string>)?.duration && <span style={{ fontSize: 11, color: 'var(--px-text-3)', fontWeight: 500 }}>{(cs.metadata as Record<string, string>).duration}</span>}
          </div>
        )}
      </div>
    </Link>
  )
}

function OutlineBtn({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 14px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--px-r)', border: '1px solid #D8D4CC', color: '#6C6960', background: 'transparent', textDecoration: 'none' }}>{children}</a>
  )
}
