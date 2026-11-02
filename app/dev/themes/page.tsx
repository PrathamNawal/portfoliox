import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CanvasLayout } from '@/components/published/CanvasLayout'
import { SpotlightLayout } from '@/components/published/SpotlightLayout'
import { THEMES, resolveTheme } from '@/lib/themes'
import { MOTION_LEVELS, resolveMotion } from '@/lib/motion'
import { PickerDemo } from './PickerDemo'
import { FIXTURE_PROFILE, FIXTURE_CASE_STUDIES, FIXTURE_TESTIMONIALS, FIXTURE_EXPERIENCE, FIXTURE_TOOLS } from '@/lib/theme-fixtures'

// Dev-only gallery: every theme x layout on fixture data, no auth, no database, no analytics.
// /dev/themes?theme=glass&layout=spotlight&motion=expressive
// /dev/themes?theme=neon&exp=story   (Work Experience as a story; exp=classic, the default, is the list)
// (motion defaults to expressive here; live pages default to still)
export const dynamic = 'force-dynamic'

interface Props { searchParams: Promise<{ theme?: string; layout?: string; motion?: string; scene?: string; exp?: string }> }

export default async function ThemeGallery({ searchParams }: Props) {
  if (process.env.NODE_ENV === 'production') notFound()
  const { theme, layout, motion: motionParam, scene: sceneParam, exp: expParam } = await searchParams
  const scene = sceneParam !== '0'
  const expStory = expParam === 'story'
  const motion = resolveMotion(motionParam ?? 'expressive')
  const layoutName = layout === 'spotlight' ? 'spotlight' : 'canvas'
  const id = resolveTheme(theme)
  const spotlight = layout === 'spotlight'
  const props = {
    profile: { ...FIXTURE_PROFILE, theme: id, layout: spotlight ? ('spotlight' as const) : ('canvas' as const) },
    caseStudies: FIXTURE_CASE_STUDIES,
    testimonials: FIXTURE_TESTIMONIALS,
    experience: FIXTURE_EXPERIENCE,
    tools: FIXTURE_TOOLS,
    trackViews: false,
    motion,
    scene,
    expStory,
  }
  return (
    <>
      <nav aria-label="Theme gallery" style={{ position: 'fixed', zIndex: 99999, right: 12, bottom: 12, display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 'min(560px, calc(100vw - 24px))', padding: 8, borderRadius: 12, background: '#16151a', font: '600 11px system-ui, sans-serif' }}>
        {THEMES.map(t => (
          <Link key={t.id} href={`/dev/themes?theme=${t.id}&layout=${layoutName}&motion=${motion}&scene=${scene ? 1 : 0}&exp=${expStory ? 'story' : 'classic'}`} aria-current={t.id === id ? 'page' : undefined}
            style={{ padding: '5px 9px', borderRadius: 999, color: '#fff', background: t.id === id ? '#e53416' : '#2a2930', textDecoration: 'none' }}>{t.label}</Link>
        ))}
        <Link href={`/dev/themes?theme=${id}&layout=${spotlight ? 'canvas' : 'spotlight'}&motion=${motion}&scene=${scene ? 1 : 0}&exp=${expStory ? 'story' : 'classic'}`} style={{ padding: '5px 9px', borderRadius: 999, color: '#16151a', background: '#fff', textDecoration: 'none' }}>
          {spotlight ? 'Canvas' : 'Spotlight'} layout
        </Link>
        {MOTION_LEVELS.map(m => (
          <Link key={m} href={`/dev/themes?theme=${id}&layout=${layoutName}&motion=${m}&scene=${scene ? 1 : 0}&exp=${expStory ? 'story' : 'classic'}`} aria-current={m === motion ? 'page' : undefined}
            style={{ padding: '5px 9px', borderRadius: 999, color: '#16151a', background: m === motion ? '#7dd3fc' : '#d6d4dc', textDecoration: 'none' }}>motion: {m}</Link>
        ))}
      </nav>
      <PickerDemo value={id} motion={motion} scene={scene} />
      {spotlight ? <SpotlightLayout {...props} /> : <CanvasLayout {...props} />}
    </>
  )
}
