import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ThemeScope } from '@/components/published/ThemeScope'
import { ShoppingScene } from '@/components/scene/ShoppingScene'
import { THEMES, resolveTheme } from '@/lib/themes'

// Dev-only: the shopping scene on its own, on any theme, live, pinned to a moment of the 10s loop, or as one Still frame.
//   /dev/shopping?theme=papercut             live loop
//   /dev/shopping?theme=papercut&freeze=0.74 pinned at 74% of the loop (order placed)
//   /dev/shopping?theme=papercut&still=1     Motion: Still (one calm frame)
export const dynamic = 'force-dynamic'

interface Props { searchParams: Promise<{ theme?: string; freeze?: string; still?: string; clean?: string }> }

const MOMENTS: { at: number; label: string }[] = [
  { at: 0.08, label: 'typing' }, { at: 0.24, label: 'scrolling' }, { at: 0.325, label: 'found it' }, { at: 0.5, label: 'product' },
  { at: 0.585, label: 'add to cart' }, { at: 0.67, label: 'checkout' }, { at: 0.74, label: 'order placed' }, { at: 0.8, label: 'cheer' }, { at: 0.88, label: 'confetti' }, { at: 0.97, label: 'reset' },
]

export default async function ShoppingPage({ searchParams }: Props) {
  if (process.env.NODE_ENV === 'production') notFound()
  const { theme, freeze, still, clean } = await searchParams
  const id = resolveTheme(theme)
  const f = freeze === undefined ? undefined : Math.min(1, Math.max(0, Number(freeze) || 0))
  const animate = still === undefined
  if (clean !== undefined) {
    // just the scene, for rendering frames (GIF) and screenshots
    return <ThemeScope theme={id}><div style={{ padding: '8px 14px' }}><ShoppingScene animate={animate} freeze={f} /></div></ThemeScope>
  }
  const q = (extra: string) => `/dev/shopping?theme=${id}${extra}`
  return (
    <ThemeScope theme={id}>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px 120px' }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 28, fontWeight: 800, color: 'var(--px-text)' }}>Shopping scene</h1>
        <ShoppingScene animate={animate} freeze={f} />
        <nav aria-label="Controls" style={{ position: 'fixed', left: 12, bottom: 12, right: 12, display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8, borderRadius: 12, background: '#16151a', font: '600 11px system-ui, sans-serif', zIndex: 99999 }}>
          {THEMES.map(t => (
            <Link key={t.id} href={`/dev/shopping?theme=${t.id}${f !== undefined ? `&freeze=${f}` : ''}${animate ? '' : '&still=1'}`} style={{ padding: '5px 9px', borderRadius: 999, color: '#fff', background: t.id === id ? '#e53416' : '#2a2930', textDecoration: 'none' }}>{t.label}</Link>
          ))}
          <Link href={q('')} style={{ padding: '5px 9px', borderRadius: 999, background: animate && f === undefined ? '#7dd3fc' : '#d6d4dc', color: '#16151a', textDecoration: 'none' }}>live</Link>
          <Link href={q('&still=1')} style={{ padding: '5px 9px', borderRadius: 999, background: !animate ? '#7dd3fc' : '#d6d4dc', color: '#16151a', textDecoration: 'none' }}>still</Link>
          {MOMENTS.map(m => (
            <Link key={m.at} href={q(`&freeze=${m.at}`)} style={{ padding: '5px 9px', borderRadius: 999, background: f === m.at ? '#7dd3fc' : '#d6d4dc', color: '#16151a', textDecoration: 'none' }}>{m.at} {m.label}</Link>
          ))}
        </nav>
      </main>
    </ThemeScope>
  )
}
