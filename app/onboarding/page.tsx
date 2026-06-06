'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Btn } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Tag } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { PXLogo, ProgressBar, Spinner } from '@/components/ui/Misc'
import { Icon } from '@/components/ui/Icon'

const DISCIPLINES = [
  { id: 'ux',           label: 'UX / Product Design',  icon: '⬡', desc: 'User flows, prototypes, research' },
  { id: 'graphic',      label: 'Graphic / Visual',      icon: '◈', desc: 'Brand, identity, print, layout' },
  { id: 'motion',       label: 'Motion Design',         icon: '◎', desc: 'Animation, video, kinetic type' },
  { id: 'illustration', label: 'Illustration',          icon: '◇', desc: 'Editorial, digital, character' },
]

const ALL_SKILLS = [
  'UX Design','Product Design','Visual Design','Brand Design','Motion Design',
  'Interaction Design','User Research','Design Systems','Prototyping','Illustration',
  'Typography','Art Direction','Web Design','Mobile Design','UI Design',
  'Service Design','Information Architecture','Copywriting','3D Design','Figma',
]

function CanvasPreview() {
  return (
    <svg viewBox="0 0 200 140" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <rect width="200" height="140" fill="#F8F7F4"/>
      <rect x="12" y="10" width="60" height="8" rx="2" fill="#1C1B18" opacity="0.7"/>
      <rect x="140" y="10" width="48" height="8" rx="2" fill="#E53416" opacity="0.9"/>
      <circle cx="26" cy="42" r="12" fill="#E53416" opacity="0.7"/>
      <rect x="44" y="36" width="50" height="6" rx="1.5" fill="#1C1B18" opacity="0.6"/>
      <rect x="44" y="46" width="35" height="4" rx="1.5" fill="#1C1B18" opacity="0.25"/>
      <rect x="12" y="62" width="28" height="6" rx="3" fill="#1C1B18" opacity="0.12"/>
      <rect x="44" y="62" width="36" height="6" rx="3" fill="#1C1B18" opacity="0.12"/>
      <rect x="84" y="62" width="28" height="6" rx="3" fill="#1C1B18" opacity="0.12"/>
      <rect x="12" y="76" width="82" height="52" rx="4" fill="#E5E3DE"/>
      <rect x="12" y="76" width="82" height="30" rx="4" fill="#7B5EE0" opacity="0.7"/>
      <rect x="106" y="76" width="82" height="52" rx="4" fill="#E5E3DE"/>
      <rect x="106" y="76" width="82" height="30" rx="4" fill="#E53416" opacity="0.5"/>
    </svg>
  )
}

function SpotlightPreview() {
  return (
    <svg viewBox="0 0 200 140" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <rect width="200" height="140" fill="#FAFAF8"/>
      <circle cx="100" cy="28" r="16" fill="#E53416" opacity="0.7"/>
      <rect x="68" y="50" width="64" height="7" rx="2" fill="#1C1B18" opacity="0.65"/>
      <rect x="76" y="62" width="48" height="4" rx="1.5" fill="#1C1B18" opacity="0.25"/>
      <rect x="55" y="72" width="26" height="5" rx="2.5" fill="#1C1B18" opacity="0.1"/>
      <rect x="85" y="72" width="32" height="5" rx="2.5" fill="#1C1B18" opacity="0.1"/>
      <rect x="121" y="72" width="24" height="5" rx="2.5" fill="#1C1B18" opacity="0.1"/>
      <rect x="20" y="84" width="160" height="22" rx="4" fill="#E5E3DE"/>
      <rect x="20" y="84" width="64" height="22" rx="4" fill="#7B5EE0" opacity="0.6"/>
      <rect x="20" y="110" width="160" height="22" rx="4" fill="#E5E3DE"/>
      <rect x="20" y="110" width="64" height="22" rx="4" fill="#E53416" opacity="0.45"/>
    </svg>
  )
}

const TOTAL = 4
const LABELS = ['Your profile', 'Your discipline', 'Your skills', 'Choose your layout']

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>()
  const [uploading, setUploading] = useState(false)
  const avatarInput = useRef<HTMLInputElement>(null)

  const [data, setData] = useState({
    name: '',
    bio: '',
    discipline: '',
    skills: [] as string[],
    layout: 'canvas' as 'canvas' | 'spotlight',
  })
  const set = <K extends keyof typeof data>(k: K, v: typeof data[K]) => setData(d => ({ ...d, [k]: v }))

  const canProceed = [
    data.name.trim().length > 1,
    data.discipline !== '',
    data.skills.length >= 2,
    true,
  ][step]

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) { alert('Avatar must be under 2MB'); return }
    setUploading(true)
    try {
      const { default: compress } = await import('browser-image-compression')
      const compressed = await compress(file, { maxSizeMB: 1, maxWidthOrHeight: 400, useWebWorker: true })
      const res = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, bucket: 'avatars' }),
      })
      const { url, publicUrl } = await res.json()
      await fetch(url, { method: 'PUT', body: compressed, headers: { 'Content-Type': file.type } })
      setAvatarUrl(publicUrl)
    } finally {
      setUploading(false)
    }
  }

  const next = async () => {
    if (step < TOTAL - 1) {
      setDir('fwd'); setStep(s => s + 1)
    } else {
      setSaving(true)
      try {
        const res = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, avatar_url: avatarUrl }),
        })
        if (res.ok) router.push('/dashboard')
        else setSaving(false)
      } catch { setSaving(false) }
    }
  }

  const back = () => { setDir('back'); setStep(s => s - 1) }

  // Left decorative panel
  const leftPanel = (
    <div style={{ width: 360, flexShrink: 0, background: '#0D0D0B', display: 'flex', flexDirection: 'column', padding: 40, position: 'relative', overflow: 'hidden' }}>
      <PXLogo light wordmark size={26} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#F0EEE9', lineHeight: 1.15, marginBottom: 16 }}>
          Your portfolio<br />starts with<br /><span style={{ color: '#E53416' }}>your work.</span>
        </div>
        <p style={{ fontSize: 14, color: '#56534D', lineHeight: 1.6, maxWidth: 240 }}>
          Upload visuals first. PortfolioX wraps the words around them.
        </p>
      </div>
      {/* Floating cards */}
      <div style={{ position: 'absolute', bottom: 40, right: -20, display: 'flex', flexDirection: 'column', gap: 8, opacity: 0.6 }}>
        {[
          { bg: 'linear-gradient(135deg,#7B5EE0,#4A3F8A)', t: 'Case Study 01', anim: 'px-float-a 8s ease-in-out infinite' },
          { bg: 'linear-gradient(135deg,#E53416,#A02310)', t: 'Case Study 02', anim: 'px-float-b 10s ease-in-out 1.5s infinite' },
          { bg: 'linear-gradient(135deg,#1A6A5A,#0D3D33)', t: 'Case Study 03', anim: 'px-float-c 12s ease-in-out 3s infinite' },
        ].map((c, i) => (
          <div key={i} style={{ width: 140, height: 80, background: c.bg, borderRadius: 10, display: 'flex', alignItems: 'flex-end', padding: 10, animation: c.anim }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{c.t}</span>
          </div>
        ))}
      </div>
      {/* Step dots */}
      <div style={{ display: 'flex', gap: 5 }}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 999, background: i === step ? '#E53416' : i < step ? '#3A3834' : '#2A2926', transition: 'all 0.3s' }} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="px-screen" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {leftPanel}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--px-bg)', overflowY: 'auto' }}>
        {/* Progress */}
        <div style={{ padding: '24px 48px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--px-text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {LABELS[step]}
            </span>
            <span style={{ fontSize: 12, color: 'var(--px-text-3)' }}>{step + 1} / {TOTAL}</span>
          </div>
          <ProgressBar steps={TOTAL} current={step} />
        </div>

        {/* Step content */}
        <div key={step} className={dir === 'fwd' ? 'px-step-fwd' : 'px-step-back'} style={{ flex: 1, padding: '40px 48px', display: 'flex', flexDirection: 'column' }}>

          {/* Step 0: Profile */}
          {step === 0 && (
            <div style={{ maxWidth: 400 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--px-text)', marginBottom: 8 }}>Tell us about yourself</h1>
              <p style={{ fontSize: 14, color: 'var(--px-text-2)', marginBottom: 32, lineHeight: 1.5 }}>This becomes your public profile header.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Avatar upload */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar name={data.name || 'User'} src={avatarUrl} size={72} editable onClick={() => avatarInput.current?.click()} />
                    {uploading && (
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Spinner size={20} />
                      </div>
                    )}
                    <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f) }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)', marginBottom: 6 }}>Profile photo</div>
                    <Btn variant="secondary" size="sm" icon="upload" onClick={() => avatarInput.current?.click()} disabled={uploading}>
                      {uploading ? 'Uploading…' : 'Upload image'}
                    </Btn>
                    <div style={{ fontSize: 11, color: 'var(--px-text-3)', marginTop: 6 }}>PNG, JPG or WEBP · Max 2MB</div>
                  </div>
                </div>
                <Input label="Full name *" value={data.name} onChange={v => set('name', v)} placeholder="Priya Mehta" maxLength={60} />
                <Textarea label="Short bio *" value={data.bio} onChange={v => set('bio', v)} placeholder="Product designer focused on thoughtful digital experiences..." maxLength={200} rows={3} />
              </div>
            </div>
          )}

          {/* Step 1: Discipline */}
          {step === 1 && (
            <div style={{ maxWidth: 520 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 8 }}>What do you design?</h1>
              <p style={{ fontSize: 14, color: 'var(--px-text-2)', marginBottom: 32 }}>Choose your primary discipline.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {DISCIPLINES.map(d => {
                  const sel = data.discipline === d.id
                  return (
                    <button key={d.id} onClick={() => set('discipline', d.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: '20px', background: sel ? 'var(--px-accent-subtle)' : 'var(--px-surface)', border: `1.5px solid ${sel ? 'var(--px-accent)' : 'var(--px-border)'}`, borderRadius: 'var(--px-r-lg)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', fontFamily: 'var(--px-font)' }}>
                      <span style={{ fontSize: 22 }}>{d.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: sel ? 'var(--px-accent)' : 'var(--px-text)', letterSpacing: '-0.02em', marginBottom: 3 }}>{d.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--px-text-3)', lineHeight: 1.4 }}>{d.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Skills */}
          {step === 2 && (
            <div style={{ maxWidth: 480 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 8 }}>Your skills</h1>
              <p style={{ fontSize: 14, color: 'var(--px-text-2)', marginBottom: 8 }}>Select up to 8 that best describe your work.</p>
              <p style={{ fontSize: 12, color: 'var(--px-text-3)', marginBottom: 28 }}>Selected: {data.skills.length} / 8</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_SKILLS.map(skill => {
                  const sel = data.skills.includes(skill)
                  const atMax = data.skills.length >= 8 && !sel
                  return (
                    <Tag key={skill} selected={sel} onClick={atMax ? undefined : () => set('skills', sel ? data.skills.filter(s => s !== skill) : [...data.skills, skill])}>
                      {skill}
                    </Tag>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Layout picker */}
          {step === 3 && (
            <div style={{ maxWidth: 580 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 8 }}>How should it look?</h1>
              <p style={{ fontSize: 14, color: 'var(--px-text-2)', marginBottom: 32 }}>Pick a layout — you can always switch later.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { id: 'canvas',    label: 'Canvas',    desc: 'Card grid — structured and dense',      Preview: CanvasPreview },
                  { id: 'spotlight', label: 'Spotlight', desc: 'Centered editorial — personal and airy', Preview: SpotlightPreview },
                ].map(l => {
                  const sel = data.layout === l.id
                  return (
                    <button key={l.id} onClick={() => set('layout', l.id as 'canvas' | 'spotlight')} style={{ display: 'flex', flexDirection: 'column', background: sel ? 'var(--px-accent-subtle)' : 'var(--px-surface)', border: `1.5px solid ${sel ? 'var(--px-accent)' : 'var(--px-border)'}`, borderRadius: 'var(--px-r-lg)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', fontFamily: 'var(--px-font)' }}>
                      <div style={{ background: 'var(--px-surface-2)', borderBottom: `1px solid ${sel ? 'var(--px-accent)' : 'var(--px-border)'}`, padding: 12 }}>
                        <l.Preview />
                      </div>
                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: sel ? 'var(--px-accent)' : 'var(--px-text)', letterSpacing: '-0.02em' }}>{l.label}</span>
                          {sel && <Icon name="checkCircle" size={16} color="var(--px-accent)" />}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--px-text-3)' }}>{l.desc}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div style={{ padding: '0 48px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          {step > 0 ? (
            <button onClick={back} style={{ fontSize: 13, color: 'var(--px-text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--px-font)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="arrowLeft" size={14} /> Back
            </button>
          ) : <div />}
          <Btn variant="primary" size="lg" onClick={next} disabled={!canProceed || saving} iconRight={step < TOTAL - 1 ? 'chevronRight' : undefined}>
            {saving ? 'Saving…' : step === TOTAL - 1 ? 'Start building' : 'Continue'}
          </Btn>
        </div>
      </div>
    </div>
  )
}
