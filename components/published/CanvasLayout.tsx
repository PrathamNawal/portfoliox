import Link from 'next/link'
import { AnalyticsTracker } from './AnalyticsTracker'
import type { Profile, CaseStudy, Testimonial, WorkExperience, ToolStackItem } from '@/types'

const TOOL_COLORS: Record<string, string> = {
  Figma: '#A259FF', FigJam: '#F24E1E', Framer: '#0099FF', Sketch: '#F7B500',
  'Adobe XD': '#FF61F6', Miro: '#FFD02F', Maze: '#FF5A5F', Dovetail: '#7B5EE0',
  Zeplin: '#FDBD39', Principle: '#4251FF', Whimsical: '#9B51E0',
  'Adobe Illustrator': '#FF9A00', 'Adobe Photoshop': '#31A8FF', Spline: '#3D80FF',
  Protopie: '#5C5CE6', Notion: '#9A978E', Jira: '#2684FF',
  Confluence: '#2684FF', Slack: '#7C3085', Loom: '#625DF5',
  Linear: '#A47EFF', GitHub: '#9A978E', 'VS Code': '#0078D4',
  'Adobe After Effects': '#9999FF', 'Adobe Premiere': '#EA77FF',
  Blender: '#E87D0D', 'Cinema 4D': '#0168B3',
}
const GRAD = [
  'linear-gradient(135deg,#2A1B4A 0%,#5B3FA6 60%,#7B5EE0 100%)',
  'linear-gradient(135deg,#0D2218 0%,#1A5C38 100%)',
  'linear-gradient(135deg,#1A1028 0%,#2D1B4A 50%,#3A1B5A 100%)',
  'linear-gradient(135deg,#2A1018 0%,#5A1A2A 100%)',
]

// Profile discipline → large hero display headline
const HERO_DISCIPLINE: Record<string, string> = {
  ux: 'Product Designer',
  graphic: 'Visual Designer',
  brand: 'Brand Designer',
  motion: 'Motion Designer',
  illustration: 'Illustrator',
}

// Case study discipline → card pill
const CASE_DISCIPLINE_LABELS: Record<string, string> = {
  ux: 'UX / Product',
  brand: 'Brand & Identity',
  motion: 'Motion',
  illustration: 'Illustration',
  graphic: 'Graphic / Visual',
  custom: 'Custom',
}

interface Props {
  profile: Profile
  caseStudies: Partial<CaseStudy>[]
  testimonials: Testimonial[]
  experience: WorkExperience[]
  tools: ToolStackItem[]
}

export function CanvasLayout({ profile, caseStudies, testimonials, experience, tools }: Props) {
  const social = profile.social_links || {}
  const heroTitle = (profile.discipline ? HERO_DISCIPLINE[profile.discipline] : null) || 'Designer'

  return (
    <div style={{ minHeight: '100vh', background: '#F8F7F4' }}>
      <AnalyticsTracker userId={profile.id} eventType="page_view" />

      {/* Sticky header — navigation context once scrolled past hero */}
      <header className="px-canvas-header" style={{ background: 'var(--px-surface)', borderBottom: '1px solid var(--px-border)', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E53416', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{profile.name[0]}</span></div>
          }
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--px-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</span>
        </div>
        <div className="px-canvas-header-links" style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {social.linkedin && <SocialLink href={`https://linkedin.com/in/${social.linkedin}`} label="LinkedIn" />}
          {social.dribbble && <SocialLink href={`https://dribbble.com/${social.dribbble}`} label="Dribbble" />}
          {social.website && <SocialLink href={social.website} label="Website" />}
          {profile.resume_url && <SocialLink href={profile.resume_url} label="Resume" />}
          <CTALink>Get in touch</CTALink>
        </div>
      </header>

      {/* ── Hero — editorial identity moment ─────────────────────────────── */}
      <section className="px-canvas-hero" style={{
        background: 'var(--px-surface)',
        borderBottom: '1px solid var(--px-border)',
        padding: 'clamp(72px, 10vw, 120px) clamp(20px, 5vw, 60px) clamp(60px, 8vw, 96px)',
        textAlign: 'center',
      }}>
        {/* Avatar — rounded rectangle, grows on hover */}
        {profile.avatar_url
          ? <img src={profile.avatar_url} alt={profile.name} className="px-hero-avatar" style={{ width: 100, height: 100, borderRadius: 28, objectFit: 'cover', display: 'block', margin: '0 auto 20px' }} />
          : <div className="px-hero-avatar" style={{ width: 100, height: 100, borderRadius: 28, background: '#E53416', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span style={{ fontSize: 38, fontWeight: 700, color: '#fff' }}>{profile.name[0]}</span>
            </div>
        }

        {/* Identity label — small, spaced, mono */}
        <p style={{
          fontSize: 14, fontWeight: 600, letterSpacing: '0.15em',
          textTransform: 'uppercase', color: 'var(--px-text-3)',
          marginBottom: 14, fontFamily: "'Courier New', Courier, monospace",
        }}>
          {profile.name},
        </p>

        {/* Large display heading */}
        <h1 style={{
          fontSize: 'clamp(44px, 7.5vw, 84px)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          color: 'var(--px-text)',
          lineHeight: 1.0,
          margin: '0 auto 24px',
          maxWidth: 800,
        }}>
          {heroTitle}
        </h1>

        {/* Bio */}
        {profile.bio && (
          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: 'var(--px-text-2)',
            lineHeight: 1.75,
            maxWidth: 520,
            margin: '0 auto 32px',
            fontWeight: 400,
          }}>
            {profile.bio}
          </p>
        )}

        {/* Social + CTA row */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {social.linkedin && <OutlineBtn href={`https://linkedin.com/in/${social.linkedin}`}>LinkedIn</OutlineBtn>}
          {social.dribbble && <OutlineBtn href={`https://dribbble.com/${social.dribbble}`}>Dribbble</OutlineBtn>}
          {social.behance  && <OutlineBtn href={`https://behance.net/${social.behance}`}>Behance</OutlineBtn>}
          {social.website  && <OutlineBtn href={social.website}>Website</OutlineBtn>}
          {profile.resume_url && <OutlineBtn href={profile.resume_url}>Resume ↗</OutlineBtn>}
          <a href="mailto:?subject=Hello" style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 20px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--px-r)', background: '#E53416', color: '#fff', textDecoration: 'none' }}>
            Get in touch
          </a>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="px-canvas-main" style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 40px 80px' }}>

        {/* Skills — marquee */}
        {profile.skills?.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <SectionLabel>Skills</SectionLabel>
            <div style={{ overflow: 'hidden', marginTop: 20, maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
              <div style={{ display: 'flex', gap: 8, width: 'max-content', animation: 'px-marquee 22s linear infinite' }}>
                {[...profile.skills, ...profile.skills].map((s, i) => (
                  <span key={i} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 500, borderRadius: 999, background: 'var(--px-surface)', border: '1px solid var(--px-border)', color: 'var(--px-text-2)', whiteSpace: 'nowrap', flexShrink: 0 }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Case studies */}
        {caseStudies.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--px-text)', lineHeight: 1 }}>Case Studies</h2>
              <span style={{ fontSize: 13, color: 'var(--px-text-3)' }}>{caseStudies.length} project{caseStudies.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {caseStudies.map((cs, i) => <CanvasCaseCard key={cs.id} cs={cs as CaseStudy} index={i} slug={profile.slug!} />)}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <SectionLabel>What people say</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginTop: 24 }}>
              {testimonials.map(t => (
                <div key={t.id} style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', padding: '22px 24px' }}>
                  <p style={{ fontSize: 14, color: 'var(--px-text)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 16 }}>&quot;{t.quote}&quot;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {t.photo_url
                      ? <img src={t.photo_url} alt={t.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#7B5EE0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{t.name[0]}</span></div>
                    }
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--px-text)', letterSpacing: '-0.01em' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--px-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 1 }}>{t.title_and_company}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work experience */}
        {experience.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <SectionLabel>Work Experience</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
              {experience.map(exp => (
                <div key={exp.id} style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: exp.description ? 8 : 0 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--px-text)', letterSpacing: '-0.02em', marginBottom: 2 }}>{exp.role}</div>
                      <div style={{ fontSize: 13, color: 'var(--px-text-2)' }}>{exp.company}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {exp.discipline_tag && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'var(--px-surface-2)', color: 'var(--px-text-3)', border: '1px solid var(--px-border)' }}>{exp.discipline_tag}</span>}
                      <span style={{ fontSize: 12, color: 'var(--px-text-3)', whiteSpace: 'nowrap' }}>{exp.start_month} – {exp.is_current ? 'Present' : exp.end_month}</span>
                    </div>
                  </div>
                  {exp.description && (
                    <div style={{ fontSize: 13, color: 'var(--px-text-3)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: exp.description }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool Stack — marquee */}
        {tools.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <SectionLabel>Tool Stack</SectionLabel>
            <div style={{ overflow: 'hidden', marginTop: 24, maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
              <div style={{ display: 'flex', gap: 10, width: 'max-content', animation: 'px-marquee 28s linear infinite' }}>
                {[...tools, ...tools].map((t, i) => <PublishedToolIcon key={i} name={t.tool_name} />)}
              </div>
            </div>
          </div>
        )}

        {/* Let's work together */}
        <div style={{ borderTop: '1px solid var(--px-border)', paddingTop: 56, marginTop: 8 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--px-text)', textAlign: 'center', marginBottom: 32 }}>Let&apos;s work together</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {profile.resume_url && (
              <a href={profile.resume_url} target="_blank" rel="noreferrer" className="px-work-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', textDecoration: 'none', transition: 'border-color 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 22 }}>📄</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--px-text)' }}>View Resume</span>
                </div>
                <span style={{ fontSize: 20, color: 'var(--px-text-3)' }}>↗</span>
              </a>
            )}
            <div className="px-cta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {(social as Record<string,string>).linkedin && (
                <a href={`https://linkedin.com/in/${(social as Record<string,string>).linkedin}`} target="_blank" rel="noreferrer" className="px-work-link" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', textDecoration: 'none', transition: 'border-color 0.15s' }}>
                  <span style={{ fontSize: 22 }}>💼</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--px-text)' }}>LinkedIn</span>
                </a>
              )}
              {(social as Record<string,string>).dribbble && (
                <a href={`https://dribbble.com/${(social as Record<string,string>).dribbble}`} target="_blank" rel="noreferrer" className="px-work-link" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', textDecoration: 'none', transition: 'border-color 0.15s' }}>
                  <span style={{ fontSize: 22 }}>🎯</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--px-text)' }}>Dribbble</span>
                </a>
              )}
              {(social as Record<string,string>).website && (
                <a href={(social as Record<string,string>).website} target="_blank" rel="noreferrer" className="px-work-link" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', textDecoration: 'none', transition: 'border-color 0.15s' }}>
                  <span style={{ fontSize: 22 }}>🔗</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--px-text)' }}>Website</span>
                </a>
              )}
              <a href={`mailto:${(profile as any).email || ''}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', background: '#E53416', border: '1px solid #E53416', borderRadius: 'var(--px-r-lg)', textDecoration: 'none' }}>
                <span style={{ fontSize: 22 }}>✉️</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Get in touch</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Case study card ───────────────────────────────────────────────────────────
function CanvasCaseCard({ cs, index, slug }: { cs: CaseStudy; index: number; slug: string }) {
  const grad = GRAD[index % GRAD.length]
  const disciplineLabel = cs.discipline ? CASE_DISCIPLINE_LABELS[cs.discipline] : null
  const summary = (cs.overview_data as any)?.summary as string | undefined

  return (
    <Link href={`/${slug}/case/${cs.id}`} className="px-canvas-case-card" style={{ display: 'block', background: 'var(--px-surface)', borderRadius: 16, border: '1px solid var(--px-border)', overflow: 'hidden', textDecoration: 'none', transition: 'box-shadow 0.18s, transform 0.18s' }}>
      {/* Cover area */}
      <div style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
        {cs.cover_image_url ? (
          /* Real cover photo */
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${cs.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        ) : (
          /* Typography-forward placeholder — the title becomes the visual */
          <div style={{ position: 'absolute', inset: 0, background: grad, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '20px 22px' }}>
            {/* Subtle dot grid */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            {/* Project number */}
            <span style={{ position: 'absolute', top: 18, right: 22, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
              {String(index + 1).padStart(2, '0')}
            </span>
            {/* Large title on gradient */}
            <div style={{ position: 'relative' }}>
              {disciplineLabel && (
                <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  {disciplineLabel}
                </span>
              )}
              <p style={{ fontSize: 'clamp(17px, 2.2vw, 22px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.25, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {cs.title}
              </p>
            </div>
          </div>
        )}

        {/* NDA overlay */}
        {cs.nda_enabled && (
          <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.2)' }}>
              <svg viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect x="4" y="9.5" width="12" height="8.5" rx="2"/><path d="M7.5 9.5V7a2.5 2.5 0 0 1 5 0v2.5"/></svg>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.04em' }}>NDA PROTECTED</span>
          </div>
        )}
      </div>

      {/* Card body — shown for all cards (pills + summary below the cover) */}
      <div style={{ padding: '16px 20px 20px' }}>
        {/* Discipline pill — only when image exists (gradient already shows it) */}
        {disciplineLabel && cs.cover_image_url && !cs.nda_enabled && (
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', padding: '3px 9px', borderRadius: 999,
            background: 'var(--px-surface-2)', color: 'var(--px-text-3)',
            border: '1px solid var(--px-border)', marginBottom: 10,
          }}>
            {disciplineLabel}
          </span>
        )}

        {/* Title */}
        <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--px-text)', lineHeight: 1.35, marginBottom: summary && !cs.nda_enabled ? 6 : 0 }}>
          {cs.title}
        </h3>

        {/* Summary — 2 lines max */}
        {summary && !cs.nda_enabled && (
          <p style={{ fontSize: 13, color: 'var(--px-text-3)', lineHeight: 1.55, margin: '0 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {summary}
          </p>
        )}

        {cs.nda_enabled && (
          <p style={{ fontSize: 12, color: 'var(--px-text-3)', fontStyle: 'italic', margin: 0 }}>Password required to view</p>
        )}

        {/* View arrow */}
        {!cs.nda_enabled && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#E53416' }}>View project</span>
            <span style={{ fontSize: 12, color: '#E53416' }}>→</span>
          </div>
        )}
      </div>
    </Link>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const TOOL_ICON_SLUGS: Record<string, string> = {
  'Figma': 'figma', 'FigJam': 'figma', 'Framer': 'framer', 'Sketch': 'sketch',
  'Adobe XD': 'adobexd', 'Miro': 'miro', 'Maze': 'maze', 'Zeplin': 'zeplin',
  'Whimsical': 'whimsical', 'Spline': 'spline', 'Dovetail': 'dovetail',
  'Adobe Illustrator': 'adobeillustrator', 'Adobe Photoshop': 'adobephotoshop',
  'Adobe After Effects': 'adobeaftereffects', 'Adobe Premiere': 'adobepremierepro',
  'Notion': 'notion', 'Jira': 'jira', 'Confluence': 'confluence',
  'Slack': 'slack', 'Linear': 'linear', 'GitHub': 'github',
  'VS Code': 'visualstudiocode', 'Blender': 'blender', 'Protopie': 'protopie',
  'Loom': 'loom', 'Cinema 4D': 'maxon', 'Principle': 'principle',
}

function PublishedToolIcon({ name }: { name: string }) {
  const slug = TOOL_ICON_SLUGS[name]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 8 }}>
      {slug
        ? <img src={`https://cdn.simpleicons.org/${slug}`} alt={name} width={16} height={16} style={{ display: 'block' }} />
        : <div style={{ width: 16, height: 16, borderRadius: 3, background: TOOL_COLORS[name] || '#888', flexShrink: 0 }} />
      }
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--px-text)' }}>{name}</span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--px-text)', lineHeight: 1, marginBottom: 0 }}>
      {children}
    </h2>
  )
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="px-social-link" style={{ fontSize: 12, color: 'var(--px-text-3)', textDecoration: 'none', fontWeight: 500, padding: '4px 8px', borderRadius: 5, transition: 'background 0.12s' }}>
      {label}
    </a>
  )
}

function OutlineBtn({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 16px', fontSize: 13, fontWeight: 500, borderRadius: 'var(--px-r)', border: '1px solid var(--px-border)', color: 'var(--px-text-2)', background: 'transparent', textDecoration: 'none' }}>
      {children}
    </a>
  )
}

function CTALink({ children }: { children: React.ReactNode }) {
  return (
    <a href="mailto:?subject=Hello" style={{ display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 14px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--px-r)', background: 'var(--px-accent)', color: '#fff', textDecoration: 'none' }}>{children}</a>
  )
}
