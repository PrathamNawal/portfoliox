import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ThemeScope } from '@/components/published/ThemeScope'
import { DesignerScene } from '@/components/scene/DesignerScene'
import { THEMES, resolveTheme } from '@/lib/themes'

// Dev-only: the designer scene on its own, on any theme, live or pinned to a moment of the loop.
//   /dev/scene?theme=papercut             live loop
//   /dev/scene?theme=papercut&freeze=0.55 pinned at 55% of the 18s loop (typing)
export const dynamic = 'force-dynamic'

interface Props { searchParams: Promise<{ theme?: string; freeze?: string; clean?: string }> }

const MOMENTS: { at: number; label: string }[] = [
  { at: 0.1, label: 'writing' }, { at: 0.2, label: 'bulb' }, { at: 0.4, label: 'walking' }, { at: 0.55, label: 'typing' }, { at: 0.8, label: 'sparkle' }, { at: 0.93, label: 'return' },
]

export default async function ScenePage({ searchParams }: Props) {
  if (process.env.NODE_ENV === 'production') notFound()
  const { theme, freeze, clean } = await searchParams
  const id = resolveTheme(theme)
  const f = freeze === undefined ? undefined : Math.min(1, Math.max(0, Number(freeze) || 0))
  if (clean !== undefined) {
    // just the scene, for rendering frames (GIF) and screenshots
    return <ThemeScope theme={id}><div style={{ padding: '8px 14px' }}><DesignerScene freeze={f} /></div></ThemeScope>
  }
  return (
    <ThemeScope theme={id}>
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 120px' }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 28, fontWeight: 800, color: 'var(--px-text)' }}>Designer scene</h1>
        <DesignerScene freeze={f} />
        <nav aria-label="Controls" style={{ position: 'fixed', left: 12, bottom: 12, right: 12, display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8, borderRadius: 12, background: '#16151a', font: '600 11px system-ui, sans-serif', zIndex: 99999 }}>
          {THEMES.map(t => (
            <Link key={t.id} href={`/dev/scene?theme=${t.id}${f !== undefined ? `&freeze=${f}` : ''}`} style={{ padding: '5px 9px', borderRadius: 999, color: '#fff', background: t.id === id ? '#e53416' : '#2a2930', textDecoration: 'none' }}>{t.label}</Link>
          ))}
          <Link href={`/dev/scene?theme=${id}`} style={{ padding: '5px 9px', borderRadius: 999, background: f === undefined ? '#7dd3fc' : '#d6d4dc', color: '#16151a', textDecoration: 'none' }}>live</Link>
          {MOMENTS.map(m => (
            <Link key={m.at} href={`/dev/scene?theme=${id}&freeze=${m.at}`} style={{ padding: '5px 9px', borderRadius: 999, background: f === m.at ? '#7dd3fc' : '#d6d4dc', color: '#16151a', textDecoration: 'none' }}>{m.at} {m.label}</Link>
          ))}
        </nav>
      </main>
    </ThemeScope>
  )
}
