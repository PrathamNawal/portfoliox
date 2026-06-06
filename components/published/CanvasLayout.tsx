import React from 'react'
import Link from 'next/link'
import { AnalyticsTracker } from './AnalyticsTracker'
import type { Profile, CaseStudy, Testimonial, WorkExperience, ToolStackItem } from '@/types'

const TOOL_COLORS: Record<string, string> = {
  Figma: '#A259FF', Framer: '#0099FF', Notion: '#1C1B18',
  Miro: '#FFD02F', Maze: '#FF5A5F', FigJam: '#F24E1E',
}
const GRAD = [
  'linear-gradient(135deg,#2A1B4A 0%,#5B3FA6 60%,#7B5EE0 100%)',
  'linear-gradient(135deg,#0D2218 0%,#1A5C38 100%)',
  'linear-gradient(135deg,#1A1028 0%,#2D1B4A 50%,#3A1B5A 100%)',
  'linear-gradient(135deg,#2A1018 0%,#5A1A2A 100%)',
]

const DISCIPLINE: Record<string, string> = { ux: 'UX / Product Designer', graphic: 'Graphic Designer', motion: 'Motion Designer', illustration: 'Illustrator' }

interface Props {
  profile: Profile
  caseStudies: Partial<CaseStudy>[]
  testimonials: Testimonial[]
  experience: WorkExperience[]
  tools: ToolStackItem[]
}

export function CanvasLayout({ profile, caseStudies, testimonials, experience, tools }: Props) {
  const social = profile.social_links || {}

  return (
    <div style={{ minHeight: '100vh', background: 'var(--px-bg)' }}>
      <AnalyticsTracker userId={profile.id} eventType="page_view" />

      {/* Sticky header */}
      <header style={{ background: 'var(--px-surface)', borderBottom: '1px solid var(--px-border)', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E53416', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{profile.name[0]}</span></div>
          }
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--px-text)' }}>{profile.name}</span>
            {profile.discipline && <span style={{ fontSize: 12, color: 'var(--px-text-3)', marginLeft: 8 }}>{DISCIPLINE[profile.discipline] || ''}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {social.linkedin && <SocialLink href={`https://linkedin.com/in/${social.linkedin}`} label="LinkedIn" />}
          {social.dribbble && <SocialLink href={`https://dribbble.com/${social.dribbble}`} label="Dribbble" />}
          {social.website && <SocialLink href={social.website} label="Website" />}
          {profile.resume_url && <SocialLink href={profile.resume_url} label="Resume" />}
          <CTALink>Get in touch</CTALink>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>
        {/* Bio */}
        {profile.bio && (
          <p style={{ fontSize: 17, color: 'var(--px-text-2)', lineHeight: 1.7, maxWidth: 640, marginBottom: 28 }}>{profile.bio}</p>
        )}

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <SectionLabel>Skills</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {profile.skills.map(s => (
                <span key={s} style={{ padding: '6px 14px', fontSize: 13, fontWeight: 500, borderRadius: 999, background: 'var(--px-surface)', border: '1px solid var(--px-border)', color: 'var(--px-text-2)' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Case studies */}
        {caseStudies.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--px-text)' }}>Work</h2>
              <span style={{ fontSize: 13, color: 'var(--px-text-3)' }}>{caseStudies.length} project{caseStudies.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {caseStudies.map((cs, i) => <CanvasCaseCard key={cs.id} cs={cs as CaseStudy} index={i} slug={profile.slug!} />)}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <SectionLabel>What people say</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginTop: 16 }}>
              {testimonials.map(t => (
                <div key={t.id} style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', padding: '20px 22px' }}>
                  <p style={{ fontSize: 14, color: 'var(--px-text)', lineHeight: 1.65, fontStyle: 'italic', marginBottom: 14 }}>&quot;{t.quote}&quot;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {t.photo_url
                      ? <img src={t.photo_url} alt={t.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#7B5EE0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{t.name[0]}</span></div>
                    }
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--px-text)', letterSpacing: '-0.01em' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--px-text-3)' }}>{t.title_and_company}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work experience */}
        {experience.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <SectionLabel>Experience</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', overflow: 'hidden', marginTop: 16 }}>
              {experience.map((exp, i) => (
                <div key={exp.id} style={{ padding: '16px 20px', borderBottom: i < experience.length - 1 ? '1px solid var(--px-border)' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--px-r)', background: 'var(--px-surface-2)', border: '1px solid var(--px-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--px-text-3)' }}>{exp.company[0]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--px-text)', letterSpacing: '-0.01em' }}>{exp.role}</div>
                    <div style={{ fontSize: 12, color: 'var(--px-text-2)' }}>{exp.company} · {exp.start_month} – {exp.is_current ? 'Present' : exp.end_month}</div>
                    {exp.description && <p style={{ fontSize: 13, color: 'var(--px-text-3)', marginTop: 4, lineHeight: 1.5 }}>{exp.description}</p>}
                  </div>
                  {exp.discipline_tag && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'var(--px-surface-2)', color: 'var(--px-text-3)', border: '1px solid var(--px-border)', whiteSpace: 'nowrap' }}>{exp.discipline_tag}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools + Contact */}
        <div style={{ display: 'grid', gridTemplateColumns: tools.length > 0 ? '1fr 1fr' : '1fr', gap: 16 }}>
          {tools.length > 0 && (
            <div style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', padding: '20px 24px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--px-text)', letterSpacing: '-0.01em', marginBottom: 12 }}>Tool Stack</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tools.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--px-surface-2)', borderRadius: 6, fontSize: 12, fontWeight: 600, color: 'var(--px-text)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: TOOL_COLORS[t.tool_name] || '#888', flexShrink: 0 }} />{t.tool_name}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ background: 'var(--px-text)', borderRadius: 'var(--px-r-lg)', padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--px-bg)', letterSpacing: '-0.03em', marginBottom: 6 }}>Open to work</h3>
              <p style={{ fontSize: 13, color: 'rgba(240,238,233,0.5)', lineHeight: 1.5 }}>Full-time and freelance opportunities.</p>
            </div>
            <a href="mailto:?subject=Hello" style={{ marginTop: 16, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 14px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--px-r)', background: '#E53416', color: '#fff', textDecoration: 'none' }}>Get in touch</a>
          </div>
        </div>
      </main>
    </div>
  )
}

function CanvasCaseCard({ cs, index, slug }: { cs: CaseStudy; index: number; slug: string }) {
  const grad = GRAD[index % GRAD.length]
  const bg = cs.cover_image_url ? `url(${cs.cover_image_url}) center/cover` : grad

  return (
    <Link href={`/${slug}/case/${cs.id}`} style={{ display: 'block', background: 'var(--px-surface)', borderRadius: 'var(--px-r-lg)', border: '1px solid var(--px-border)', overflow: 'hidden', textDecoration: 'none', transition: 'box-shadow 0.18s, transform 0.18s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--px-shadow-lg)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = '' }}>
      <div style={{ height: 180, background: bg, position: 'relative' }}>
        {cs.nda_enabled && (
          <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.2)' }}>
              <svg viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect x="4" y="9.5" width="12" height="8.5" rx="2"/><path d="M7.5 9.5V7a2.5 2.5 0 0 1 5 0v2.5"/></svg>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.04em' }}>NDA PROTECTED</span>
          </div>
        )}
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--px-text)', lineHeight: 1.35, marginBottom: cs.nda_enabled ? 6 : 0 }}>{cs.title}</h3>
        {cs.nda_enabled && <p style={{ fontSize: 12, color: 'var(--px-text-3)', fontStyle: 'italic' }}>Password required to view</p>}
      </div>
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--px-text-3)' }}>{children}</span>
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--px-text-3)', textDecoration: 'none', fontWeight: 500, padding: '4px 8px', borderRadius: 5, transition: 'background 0.12s' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--px-surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      {label}
    </a>
  )
}

function CTALink({ children }: { children: React.ReactNode }) {
  return (
    <a href="mailto:?subject=Hello" style={{ display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 14px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--px-r)', background: 'var(--px-accent)', color: '#fff', textDecoration: 'none' }}>{children}</a>
  )
}
