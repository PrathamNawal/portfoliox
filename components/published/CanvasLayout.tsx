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
    <div style={{ minHeight: '100vh', background: '#F8F7F4' }}>
      <AnalyticsTracker userId={profile.id} eventType="page_view" />

      {/* Sticky header */}
      <header className="px-canvas-header" style={{ background: 'var(--px-surface)', borderBottom: '1px solid var(--px-border)', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E53416', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{profile.name[0]}</span></div>
          }
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--px-text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</span>
            {profile.discipline && <span style={{ fontSize: 12, color: 'var(--px-text-3)', marginLeft: 0 }}>{DISCIPLINE[profile.discipline] || ''}</span>}
          </div>
        </div>
        <div className="px-canvas-header-links" style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {social.linkedin && <SocialLink href={`https://linkedin.com/in/${social.linkedin}`} label="LinkedIn" />}
          {social.dribbble && <SocialLink href={`https://dribbble.com/${social.dribbble}`} label="Dribbble" />}
          {social.website && <SocialLink href={social.website} label="Website" />}
          {profile.resume_url && <SocialLink href={profile.resume_url} label="Resume" />}
          <CTALink>Get in touch</CTALink>
        </div>
      </header>

      <main className="px-canvas-main" style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>
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
            <SectionLabel>Work Experience</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
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

        {/* Tool Stack */}
        {tools.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <SectionLabel>Tool Stack</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
              {tools.map(t => <PublishedToolIcon key={t.id} name={t.tool_name} />)}
            </div>
          </div>
        )}

        {/* Let's work together */}
        <div style={{ borderTop: '1px solid var(--px-border)', paddingTop: 48, marginTop: 8 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--px-text)', textAlign: 'center', marginBottom: 32 }}>Let&apos;s work together</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {profile.resume_url && (
              <a href={profile.resume_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--px-text-3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--px-border)')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 22 }}>📄</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--px-text)' }}>View Resume</span>
                </div>
                <span style={{ fontSize: 20, color: 'var(--px-text-3)' }}>↗</span>
              </a>
            )}
            <div className="px-cta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {(social as Record<string,string>).linkedin && (
                <a href={`https://linkedin.com/in/${(social as Record<string,string>).linkedin}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--px-text-3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--px-border)')}>
                  <span style={{ fontSize: 22 }}>💼</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--px-text)' }}>LinkedIn</span>
                </a>
              )}
              {(social as Record<string,string>).dribbble && (
                <a href={`https://dribbble.com/${(social as Record<string,string>).dribbble}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--px-text-3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--px-border)')}>
                  <span style={{ fontSize: 22 }}>🎯</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--px-text)' }}>Dribbble</span>
                </a>
              )}
              {(social as Record<string,string>).website && (
                <a href={(social as Record<string,string>).website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--px-text-3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--px-border)')}>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 8 }}>
      {slug
        ? <img src={`https://cdn.simpleicons.org/${slug}`} alt={name} width={16} height={16} style={{ display: 'block' }} />
        : <div style={{ width: 16, height: 16, borderRadius: 3, background: TOOL_COLORS[name] || '#888', flexShrink: 0 }} />
      }
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--px-text)' }}>{name}</span>
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
