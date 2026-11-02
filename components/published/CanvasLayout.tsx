import Link from 'next/link'
import dynamic from 'next/dynamic'
import { AnalyticsTracker } from './AnalyticsTracker'
import { ScrollReveal } from './ScrollReveal'
import { Marquee } from './Marquee'
import { ThemeScope } from './ThemeScope'
import { CoverImage } from './CoverImage'
import { HeroMotion } from './HeroMotion'
import { ExperienceStory } from './ExperienceStory'
import { parseMonthYear, sortExperience, durationMonths, formatDuration, formatRange, highlightMetrics, splitBullets } from '@/lib/experience'
import type { MotionLevel } from '@/lib/motion'

// The designer scene (SVG + a large generated stylesheet) is only loaded for portfolios that turn it on.
// Moment of the loop shown when Motion is Still: seated at the desk, board filled, screen built.
const STILL_FRAME = 0.7
const DesignerScene = dynamic(() => import('@/components/scene/DesignerScene').then(m => m.DesignerScene))
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

const HERO_DISCIPLINE: Record<string, string> = {
  ux: 'Product Designer',
  graphic: 'Visual Designer',
  brand: 'Brand Designer',
  motion: 'Motion Designer',
  illustration: 'Illustrator',
}

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
  /** false for in-editor previews and the dev gallery, so they never record analytics. */
  trackViews?: boolean
  /** Motion level; 'still' (default) leaves the page exactly as before. */
  motion?: MotionLevel
  /** Show the designer illustration under the hero buttons. At motion 'still' it is one still frame. */
  scene?: boolean
  /** Work Experience as a story (career arc, big chapters, screenshots). Off keeps the classic list. */
  expStory?: boolean
  /** Show "~N years" next to the Experience kicker. Off by default. */
  expYears?: boolean
}

export function CanvasLayout({ profile, caseStudies, testimonials, experience, tools, trackViews = true, motion = 'still', scene = false, expStory = false, expYears = false }: Props) {
  const wallCovers = caseStudies
    .filter(cs => cs.cover_image_url && !cs.nda_enabled)
    .map(cs => ({ id: cs.id!, title: cs.title || '', url: cs.cover_image_url!, fit: cs.cover_fit }))
  const social = (profile.social_links || {}) as Record<string, string>
  const heroTitle = (profile.discipline ? HERO_DISCIPLINE[profile.discipline] : null) || 'Designer'
  const skills = profile.skills || []
  const links: { href: string; label: string }[] = []
  if (social.linkedin) links.push({ href: `https://linkedin.com/in/${social.linkedin}`, label: 'LinkedIn' })
  if (social.dribbble) links.push({ href: `https://dribbble.com/${social.dribbble}`, label: 'Dribbble' })
  if (social.behance) links.push({ href: `https://behance.net/${social.behance}`, label: 'Behance' })
  if (social.website) links.push({ href: social.website, label: 'Website' })

  return (
    <ThemeScope theme={profile.theme} motion={motion}>
      {trackViews && <AnalyticsTracker userId={profile.id} eventType="page_view" />}

      <header className="pxp-header">
        <div className="pxp-brand">
          {profile.avatar_url
            ? <img className="pxp-brand__avatar" src={profile.avatar_url} alt="" />
            : <div className="pxp-brand__avatar pxp-brand__avatar--fallback" aria-hidden="true">{profile.name[0]}</div>}
          <span className="pxp-brand__name">{profile.name}</span>
        </div>
        <nav className="pxp-nav" aria-label="Profile links">
          {links.filter(l => l.label !== 'Behance').map(l => <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="pxp-navlink">{l.label}</a>)}
          {profile.resume_url && <a href={profile.resume_url} target="_blank" rel="noreferrer" className="pxp-navlink">Resume</a>}
          <a href="mailto:?subject=Hello" className="pxp-btn pxp-btn--sm">Get in touch</a>
        </nav>
      </header>

      <section className="pxp-hero">
        {motion !== 'still' && <HeroMotion covers={wallCovers} slug={profile.slug!} level={motion} />}
        {profile.avatar_url
          ? <img className="pxp-avatar" src={profile.avatar_url} alt={profile.name} />
          : <div className="pxp-avatar pxp-avatar--fallback" aria-hidden="true">{profile.name[0]}</div>}
        <p className="pxp-eyebrow">{profile.name},</p>
        <h1 className="pxp-h1">{heroTitle}</h1>
        {profile.bio && <p className="pxp-bio">{profile.bio}</p>}
        <div className="pxp-actions">
          {links.map(l => <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="pxp-btn pxp-btn--ghost">{l.label}</a>)}
          {profile.resume_url && <a href={profile.resume_url} target="_blank" rel="noreferrer" className="pxp-btn pxp-btn--ghost">Resume ↗</a>}
          <a href="mailto:?subject=Hello" className="pxp-btn">Get in touch</a>
        </div>
        {scene && <div className="pxp-scene-wrap"><DesignerScene freeze={motion === 'still' ? STILL_FRAME : undefined} /></div>}
      </section>

      <main className="pxp-main">
        {skills.length > 0 && (
          <ScrollReveal>
            <section className="pxp-section" aria-labelledby="pxp-skills">
              <h2 id="pxp-skills" className="pxp-h2">Skills</h2>
              <Marquee seconds={22} marginTop={20} label="Skills">
                {skills.map((s, i) => <span key={i} className="pxp-chip" data-tint={i % 4}>{s}</span>)}
              </Marquee>
            </section>
          </ScrollReveal>
        )}

        {caseStudies.length > 0 && (
          <ScrollReveal delay={60} className="pxp-first">
            <section className="pxp-section" aria-labelledby="pxp-cases">
              <div className="pxp-heading-row">
                <h2 id="pxp-cases" className="pxp-h2 pxp-h2--lg">Case Studies</h2>
                <span className="pxp-count">{caseStudies.length} project{caseStudies.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="pxp-grid">
                {caseStudies.map((cs, i) => <CanvasCaseCard key={cs.id} cs={cs as CaseStudy} index={i} slug={profile.slug!} />)}
              </div>
            </section>
          </ScrollReveal>
        )}

        {testimonials.length > 0 && (
          <ScrollReveal delay={80}>
            <section className="pxp-section" aria-label="Recommendations">
              <p className="pxp-kicker pxp-kicker--center">Recommendations</p>
              <Marquee seconds={48} gap={20} bleed padding="4px 40px 4px" label="Recommendations">
                {testimonials.map((t, i) => (
                  <figure key={i} className="pxp-surface pxp-quote" data-i={i % 2} style={{ margin: 0 }}>
                    <blockquote className="pxp-quote__text" style={{ margin: '0 0 28px' }}>&ldquo;{t.quote}&rdquo;</blockquote>
                    <figcaption className="pxp-quote__by">
                      {t.photo_url
                        ? <img className="pxp-quote__photo" src={t.photo_url} alt="" />
                        : <div className="pxp-quote__photo pxp-quote__photo--fallback" aria-hidden="true">{t.name[0]}</div>}
                      <div>
                        <div className="pxp-quote__name">{t.name}</div>
                        <div className="pxp-quote__role">{t.title_and_company}</div>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </Marquee>
            </section>
          </ScrollReveal>
        )}

        {experience.length > 0 && (
          <ScrollReveal delay={100}>
            <section className="pxp-section" aria-labelledby="pxp-work">
              <div style={{ marginBottom: 32 }}>
                <p className="pxp-kicker">Experience{expYears && ` ${calcTotalExperience(experience)}`}</p>
                <h2 id="pxp-work" className="pxp-h2">Work Experience</h2>
              </div>
              {expStory ? <ExperienceStory experience={experience} /> : (
                <div className="pxp-exp-list">
                  {groupByCompany(experience).map(({ company, entries }, gi) => (
                    <div key={company}>
                      <div className="pxp-exp-company">
                        <CompanyLogo company={company} logoUrl={entries[0]?.logo_url} />
                        <span className="pxp-exp-company__name">{company}</span>
                        <span className="pxp-exp-company__tenure">{formatDuration(entries.reduce((n, e) => n + durationMonths(e), 0))}</span>
                      </div>
                      <div className="pxp-exp-roles">
                        {entries.map((exp, ri) => <ExperienceRole key={exp.id} exp={exp} open={gi === 0 && ri === 0} />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </ScrollReveal>
        )}

        {tools.length > 0 && (
          <ScrollReveal delay={120}>
            <section className="pxp-section" aria-labelledby="pxp-tools">
              <h2 id="pxp-tools" className="pxp-h2">Tool Stack</h2>
              <Marquee seconds={36} gap={16} bleed marginTop={28} padding="8px 0 16px" label="Tool stack">
                {tools.map((t, i) => <PublishedToolIcon key={i} name={t.tool_name} index={i} />)}
              </Marquee>
            </section>
          </ScrollReveal>
        )}

        <section className="pxp-cta" aria-labelledby="pxp-contact">
          <h2 id="pxp-contact" className="pxp-h2 pxp-h2--cta">Let&apos;s work together</h2>
          <div className="pxp-cta__stack">
            {profile.resume_url && (
              <a href={profile.resume_url} target="_blank" rel="noreferrer" className="pxp-surface pxp-linkcard pxp-linkcard--between">
                <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span className="pxp-linkcard__icon" aria-hidden="true">📄</span>
                  <span className="pxp-linkcard__label">View Resume</span>
                </span>
                <span className="pxp-linkcard__arrow" aria-hidden="true">↗</span>
              </a>
            )}
            <div className="pxp-cta__grid">
              {social.linkedin && <LinkCard href={`https://linkedin.com/in/${social.linkedin}`} icon="💼" label="LinkedIn" />}
              {social.dribbble && <LinkCard href={`https://dribbble.com/${social.dribbble}`} icon="🎯" label="Dribbble" />}
              {social.website && <LinkCard href={social.website} icon="🔗" label="Website" />}
              <a href={`mailto:${(profile as unknown as { email?: string }).email || ''}`} className="pxp-linkcard pxp-linkcard--accent">
                <span className="pxp-linkcard__icon" aria-hidden="true">✉️</span>
                <span className="pxp-linkcard__label">Get in touch</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </ThemeScope>
  )
}

function LinkCard({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="pxp-surface pxp-linkcard">
      <span className="pxp-linkcard__icon" aria-hidden="true">{icon}</span>
      <span className="pxp-linkcard__label">{label}</span>
    </a>
  )
}

// ── Case study card ───────────────────────────────────────────────────────────
function CanvasCaseCard({ cs, index, slug }: { cs: CaseStudy; index: number; slug: string }) {
  const grad = GRAD[index % GRAD.length]
  const disciplineLabel = cs.discipline ? CASE_DISCIPLINE_LABELS[cs.discipline] : null
  const summary = (cs.overview_data as { summary?: string } | null)?.summary

  return (
    <Link href={`/${slug}/case/${cs.id}`} className="pxp-card" data-i={index % 4}>
      <div className="pxp-card__media">
        {cs.cover_image_url ? (
          <CoverImage url={cs.cover_image_url} fit={cs.cover_fit} label={`${cs.title} cover`} />
        ) : (
          <div className="pxp-card__ph" style={{ background: grad }}>
            <span className="pxp-card__num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            {disciplineLabel && <span className="pxp-card__kind">{disciplineLabel}</span>}
            <p className="pxp-card__ph-title">{cs.title}</p>
          </div>
        )}
        {cs.nda_enabled && (
          <div className="pxp-card__nda">
            <div className="pxp-card__nda-icon">
              <svg viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true"><rect x="4" y="9.5" width="12" height="8.5" rx="2"/><path d="M7.5 9.5V7a2.5 2.5 0 0 1 5 0v2.5"/></svg>
            </div>
            <span className="pxp-card__nda-label">NDA PROTECTED</span>
          </div>
        )}
      </div>

      <div className="pxp-card__body">
        {disciplineLabel && cs.cover_image_url && !cs.nda_enabled && <span className="pxp-tag">{disciplineLabel}</span>}
        <h3 className={`pxp-card__title${summary && !cs.nda_enabled ? '' : ' pxp-card__title--flush'}`}>{cs.title}</h3>
        {summary && !cs.nda_enabled && <p className="pxp-card__summary">{summary}</p>}
        {cs.nda_enabled && <p className="pxp-card__note">Password required to view</p>}
        {!cs.nda_enabled && (
          <div className="pxp-card__cta"><span>View project</span><span aria-hidden="true">→</span></div>
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

function PublishedToolIcon({ name, index }: { name: string; index: number }) {
  const slug = TOOL_ICON_SLUGS[name]
  const color = TOOL_COLORS[name] || '#888'

  return (
    <div className="pxp-tile" data-tint={index % 4} data-parity={index % 2 ? 'even' : 'odd'} title={name}>
      {slug
        ? <img className="pxp-tile__img" src={`https://cdn.simpleicons.org/${slug}`} alt={name} width={36} height={36} />
        : <div className="pxp-tile__fallback" style={{ background: color }} role="img" aria-label={name}>{name[0]}</div>}
      <div className="pxp-tile__name" aria-hidden="true"><span>{name}</span></div>
    </div>
  )
}

// ── One role: dates in the rail, title and bullets beside it ─────────────────
function ExperienceRole({ exp, open }: { exp: WorkExperience; open: boolean }) {
  const parts = exp.description ? splitBullets(exp.description) : null
  const html = (h: string) => ({ __html: highlightMetrics(h) })
  return (
    <div className="pxp-exp-role">
      <div className="pxp-exp-rail">
        <div className="pxp-exp-range">{formatRange(exp)}</div>
        <div className="pxp-exp-dur">{formatDuration(durationMonths(exp))}</div>
      </div>
      <div className="pxp-exp-content">
        <h3 className="pxp-exp-title">{exp.role}</h3>
        {exp.description && (parts ? (
          <>
            <div className="pxp-exp-desc" dangerouslySetInnerHTML={html(parts.head)} />
            <details className="pxp-exp-more" open={open}>
              <summary>
                <span className="pxp-exp-more__show">Show {parts.restCount} more</span>
                <span className="pxp-exp-more__hide">Show less</span>
              </summary>
              <div className="pxp-exp-desc" dangerouslySetInnerHTML={html(parts.rest)} />
            </details>
          </>
        ) : (
          <div className="pxp-exp-desc" dangerouslySetInnerHTML={html(exp.description)} />
        ))}
      </div>
    </div>
  )
}

// ── Work experience helpers ───────────────────────────────────────────────────

function calcTotalExperience(experience: WorkExperience[]): string {
  try {
    let total = 0
    for (const exp of experience) {
      const s = parseMonthYear(exp.start_month)
      const e = exp.is_current || !exp.end_month ? new Date() : parseMonthYear(exp.end_month)
      total += Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()))
    }
    const years = Math.round(total / 12)
    return years < 1 ? '' : `~${years} year${years !== 1 ? 's' : ''}`
  } catch { return '' }
}

// Companies appear in order of their most recent role; roles inside a company are latest first.
function groupByCompany(experience: WorkExperience[]): { company: string; entries: WorkExperience[] }[] {
  const map = new Map<string, WorkExperience[]>()
  for (const exp of sortExperience(experience)) {
    const list = map.get(exp.company) ?? []
    list.push(exp)
    map.set(exp.company, list)
  }
  return Array.from(map.entries()).map(([company, entries]) => ({ company, entries }))
}

const COMPANY_DOMAINS: Record<string, string> = {
  'Google': 'google.com', 'Apple': 'apple.com', 'Meta': 'meta.com',
  'Microsoft': 'microsoft.com', 'Amazon': 'amazon.com', 'Netflix': 'netflix.com',
  'Spotify': 'spotify.com', 'Figma': 'figma.com', 'Notion': 'notion.so',
  'Swiggy': 'swiggy.in', 'Zomato': 'zomato.com', 'Hiver': 'hiverhq.com',
  'Rocketium': 'rocketium.com', 'Adobe': 'adobe.com', 'Atlassian': 'atlassian.com',
  'Slack': 'slack.com', 'Airbnb': 'airbnb.com', 'Uber': 'uber.com',
  'LinkedIn': 'linkedin.com', 'Twitter': 'twitter.com', 'Flipkart': 'flipkart.com',
  'Razorpay': 'razorpay.com', 'Zepto': 'zeptonow.com', 'Meesho': 'meesho.com',
  'Cred': 'cred.club', 'PhonePe': 'phonepe.com', 'Paytm': 'paytm.com',
}

const LOGO_COLORS = ['#E53416','#7B5EE0','#1A5C38','#2A5298','#C45C26','#1B7A6E']

function CompanyLogo({ company, logoUrl }: { company: string; logoUrl?: string | null }) {
  const domain = COMPANY_DOMAINS[company] ?? `${company.toLowerCase().replace(/\s+/g,'')}.com`
  const color = LOGO_COLORS[company.charCodeAt(0) % LOGO_COLORS.length]
  // Prefer stored logo_url, fall back to Clearbit guess
  const src = logoUrl || `https://logo.clearbit.com/${domain}`
  return (
    <div className="pxp-logo">
      <span className="pxp-logo__initial" style={{ color }}>{company[0]}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pxp-logo__img" src={src} alt="" aria-hidden />
    </div>
  )
}
