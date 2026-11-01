import React from 'react'
import Link from 'next/link'
import { AnalyticsTracker } from './AnalyticsTracker'
import { ThemeScope } from './ThemeScope'
import { CoverImage } from './CoverImage'
import type { MotionLevel } from '@/lib/motion'
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
  /** false for in-editor previews and the dev gallery, so they never record analytics. */
  trackViews?: boolean
  motion?: MotionLevel
}

export function SpotlightLayout({ profile, caseStudies, testimonials, tools, trackViews = true, motion = 'still' }: Props) {
  const social = (profile.social_links || {}) as Record<string, string>

  return (
    <ThemeScope theme={profile.theme} layout="spotlight" motion={motion}>
      {trackViews && <AnalyticsTracker userId={profile.id} eventType="page_view" />}

      <header className="pxp-hero pxp-spot-hero">
        {profile.avatar_url
          ? <img className="pxp-avatar" src={profile.avatar_url} alt={profile.name} />
          : <div className="pxp-avatar pxp-avatar--fallback" aria-hidden="true">{profile.name[0]}</div>}
        <h1 className="pxp-spot-name">{profile.name}</h1>
        {profile.discipline && <p className="pxp-spot-role">{DISCIPLINE[profile.discipline]}</p>}
        {profile.bio && <p className="pxp-spot-bio">{profile.bio}</p>}
        {profile.skills?.length > 0 && (
          <ul className="pxp-spot-chips" aria-label="Skills" style={{ listStyle: 'none', padding: 0 }}>
            {profile.skills.map((s, i) => <li key={s} className="pxp-chip" data-tint={i % 4}>{s}</li>)}
          </ul>
        )}
        <div className="pxp-actions">
          {social.linkedin && <OutlineBtn href={`https://linkedin.com/in/${social.linkedin}`}>LinkedIn</OutlineBtn>}
          {social.dribbble && <OutlineBtn href={`https://dribbble.com/${social.dribbble}`}>Dribbble</OutlineBtn>}
          {social.behance && <OutlineBtn href={`https://behance.net/${social.behance}`}>Behance</OutlineBtn>}
          {social.website && <OutlineBtn href={social.website}>Website</OutlineBtn>}
          {profile.resume_url && <OutlineBtn href={profile.resume_url}>Resume</OutlineBtn>}
          <a href="mailto:?subject=Hello" className="pxp-btn">Get in touch</a>
        </div>
      </header>

      <main className="pxp-spot-main">
        {caseStudies.length > 0 && (
          <>
            <div className="pxp-spot-rule"><span>Selected work</span></div>
            <div className="pxp-spot-list">
              {caseStudies.map((cs, i) => <SpotlightCaseCard key={cs.id} cs={cs as CaseStudy} index={i} slug={profile.slug!} />)}
            </div>
          </>
        )}

        {testimonials.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <div className="pxp-spot-rule"><span>What people say</span></div>
            {testimonials.map((t, i) => (
              <figure key={t.id} className="pxp-surface pxp-spot-quote pxp-quote" data-i={i % 2} style={{ width: 'auto' }}>
                <blockquote style={{ margin: 0 }}><p>&quot;{t.quote}&quot;</p></blockquote>
                <figcaption style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: 'var(--t-on-surface-2)' }}>
                  {t.photo_url
                    ? <img className="pxp-quote__photo" src={t.photo_url} alt="" style={{ width: 32, height: 32 }} />
                    : <div className="pxp-quote__photo pxp-quote__photo--fallback" aria-hidden="true" style={{ width: 32, height: 32, fontSize: 12 }}>{t.name[0]}</div>}
                  <span>{t.name} — {t.title_and_company}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className="pxp-spot-foot">
          <p>Open to full-time and freelance opportunities</p>
          <a href="mailto:?subject=Hello" className="pxp-btn">Say hello →</a>
          {tools.length > 0 && (
            <ul className="pxp-spot-tools" aria-label="Tools" style={{ listStyle: 'none', padding: 0 }}>
              {tools.map(t => (
                <li key={t.id} className="pxp-spot-tool">
                  <i style={{ background: TOOL_COLORS[t.tool_name] || '#888' }} aria-hidden="true" />{t.tool_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </ThemeScope>
  )
}

function SpotlightCaseCard({ cs, index, slug }: { cs: CaseStudy; index: number; slug: string }) {
  const meta = (cs.metadata || {}) as Record<string, string>

  return (
    <Link href={`/${slug}/case/${cs.id}`} className="pxp-spot-card">
      <div className="pxp-spot-card__cover" style={cs.cover_image_url ? undefined : { backgroundImage: GRAD[index % GRAD.length] }}>
        {cs.cover_image_url && <CoverImage url={cs.cover_image_url} fit={cs.cover_fit} label={`${cs.title} cover`} />}
        {cs.nda_enabled && (
          <div className="pxp-card__nda">
            <svg viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true"><rect x="4" y="9.5" width="12" height="8.5" rx="2"/><path d="M7.5 9.5V7a2.5 2.5 0 0 1 5 0v2.5"/></svg>
            <span className="pxp-card__nda-label">NDA</span>
          </div>
        )}
      </div>
      <div className="pxp-spot-card__body">
        <h3 className="pxp-spot-card__title">{cs.title}</h3>
        {cs.nda_enabled
          ? <p className="pxp-card__note">Password protected — request access</p>
          : <span className="pxp-spot-card__cta">Read case study →</span>}
        {(meta.role || meta.duration) && (
          <div className="pxp-spot-card__meta">
            {meta.role && <span>{meta.role}</span>}
            {meta.duration && <span>{meta.duration}</span>}
          </div>
        )}
      </div>
    </Link>
  )
}

function OutlineBtn({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="pxp-btn pxp-btn--ghost">{children}</a>
}
