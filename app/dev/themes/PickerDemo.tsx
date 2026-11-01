'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ThemePicker } from '@/components/builder/ThemePicker'
import type { ThemeId } from '@/lib/themes'

/** Dev-only: the real editor ThemePicker, wired to the gallery URL, for keyboard/a11y checks. */
export function PickerDemo({ value }: { value: ThemeId }) {
  const router = useRouter()
  const params = useSearchParams()
  return (
    <div style={{ position: 'fixed', zIndex: 99999, left: 12, bottom: 12, padding: 8, borderRadius: 12, background: '#16151a', color: '#fff', font: '600 11px system-ui, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>Editor picker</span>
      <div style={{ ['--px-surface' as string]: '#1f1e24', ['--px-border' as string]: '#3a3942', ['--px-border-strong' as string]: '#55535f', ['--px-text' as string]: '#fff', ['--px-text-2' as string]: '#d6d4dc', ['--px-text-3' as string]: '#a9a7b2', ['--px-accent' as string]: '#ff6a4a', ['--px-accent-subtle' as string]: 'rgba(255,106,74,.14)' }}>
        <ThemePicker value={value} onChange={id => router.push(`/dev/themes?theme=${id}&layout=${params.get('layout') ?? 'canvas'}`)} />
      </div>
    </div>
  )
}
