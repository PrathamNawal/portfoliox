'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Btn, IconBtn } from '@/components/ui/Button'
import { Badge, Tag } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { PXLogo, SectionHead, Toggle, Spinner } from '@/components/ui/Misc'
import { Icon } from '@/components/ui/Icon'
import { TestimonialsSection } from '@/components/builder/TestimonialsSection'
import { ToolStackSection } from '@/components/builder/ToolStackSection'
import { WorkExperienceSection } from '@/components/builder/WorkExperienceSection'
import type { Profile, CaseStudy, Testimonial, WorkExperience, ToolStackItem } from '@/types'

const CASE_GRADS = [
  'linear-gradient(135deg,#2A1B4A 0%,#5B3FA6 60%,#7B5EE0 100%)',
  'linear-gradient(135deg,#0D2218 0%,#1A5C38 100%)',
  'linear-gradient(135deg,#1A1028 0%,#2D1B4A 50%,#3A1B5A 100%)',
  'linear-gradient(135deg,#2A1018 0%,#5A1A2A 100%)',
]

const DISCIPLINES: Record<string, string> = {
  ux: 'UX / Product Design', graphic: 'Graphic / Visual',
  motion: 'Motion Design', illustration: 'Illustration',
}

const ALL_SKILLS = [
  'UX Design','Product Design','Visual Design','Brand Design','Motion Design',
  'Interaction Design','User Research','Design Systems','Prototyping','Illustration',
  'Typography','Art Direction','Web Design','Mobile Design','UI Design',
  'Service Design','Information Architecture','3D Design','Figma','Framer',
]

// ── Publish Modal ─────────────────────────────────────────────────────────────
function PublishModal({ open, onClose, profile, onPublished }: {
  open: boolean; onClose: () => void
  profile: Profile | null; onPublished: (slug: string) => void
}) {
  const [slug, setSlug] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [publishing, setPublishing] = useState(false)
  const liveSlug = profile?.slug

  useEffect(() => {
    if (!slug || liveSlug) { setAvailable(null); return }
    setChecking(true)
    const t = setTimeout(async () => {
      const res = await fetch(`/api/publish/check-slug?slug=${encodeURIComponent(slug)}`)
      const d = await res.json()
      setAvailable(d.available)
      setChecking(false)
    }, 400)
    return () => clearTimeout(t)
  }, [slug, liveSlug])

  const normalized = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  const validFormat = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(normalized)

  const handlePublish = async () => {
    setPublishing(true)
    const res = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: liveSlug || normalized }) })
    if (res.ok) { const d = await res.json(); onPublished(d.slug) }
    setPublishing(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={liveSlug ? 'Portfolio published' : 'Publish your portfolio'} width={460}>
      {liveSlug ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--px-success-subtle)', borderRadius: 'var(--px-r)', border: '1px solid var(--px-success)' }}>
            <Icon name="checkCircle" size={16} color="var(--px-success)" />
            <span style={{ fontSize: 13, color: 'var(--px-success)', fontWeight: 600 }}>Live at {liveSlug}.portfoliox.me</span>
          </div>
          <Btn variant="primary" size="lg" onClick={handlePublish} disabled={publishing} style={{ width: '100%', justifyContent: 'center' }}>
            {publishing ? 'Updating…' : 'Push latest changes'}
          </Btn>
          <a href={`https://${liveSlug}.portfoliox.me`} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: 'var(--px-text-3)', textDecoration: 'none' }}>
            <Icon name="externalLink" size={13} /> Open portfolio
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--px-text-2)', lineHeight: 1.5 }}>Choose your portfolio URL. This cannot be changed after publishing.</p>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r)', overflow: 'hidden', background: 'var(--px-surface)' }}>
              <span style={{ padding: '0 10px', fontSize: 13, color: 'var(--px-text-3)', background: 'var(--px-surface-2)', borderRight: '1px solid var(--px-border)', height: 40, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>portfoliox.me/</span>
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} placeholder="yourname" maxLength={30}
                style={{ flex: 1, height: 40, padding: '0 12px', fontSize: 14, border: 'none', outline: 'none', fontFamily: 'var(--px-font)', color: 'var(--px-text)', background: 'transparent' }} autoFocus />
              {checking && <span style={{ marginRight: 12 }}><Spinner size={14} color="var(--px-text-3)" /></span>}
              {!checking && available === true && <Icon name="checkCircle" size={16} color="var(--px-success)" style={{ marginRight: 12 }} />}
              {!checking && available === false && <Icon name="x" size={16} color="#C94040" style={{ marginRight: 12 }} />}
            </div>
            {available === false && <p style={{ fontSize: 12, color: '#C94040', marginTop: 6 }}>This name is taken or reserved.</p>}
            {slug && !validFormat && <p style={{ fontSize: 12, color: '#C94040', marginTop: 6 }}>3–30 chars, letters/numbers/hyphens only.</p>}
          </div>
          <Btn variant="primary" size="lg" icon="globe" onClick={handlePublish} disabled={!validFormat || available !== true || publishing} style={{ width: '100%', justifyContent: 'center' }}>
            {publishing ? 'Publishing…' : 'Publish portfolio'}
          </Btn>
        </div>
      )}
    </Modal>
  )
}

// ── Profile Edit Modal (with social links + resume) ───────────────────────────
function ProfileEditModal({ open, onClose, profile, onSaved }: {
  open: boolean; onClose: () => void
  profile: Profile | null; onSaved: (p: Profile) => void
}) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [avatarUrl, setAvatarUrl] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [social, setSocial] = useState({ linkedin: '', dribbble: '', behance: '', twitter: '', website: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [tab, setTab] = useState<'profile' | 'social'>('profile')
  const avatarRef = useRef<HTMLInputElement>(null)
  const resumeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(profile?.name || ''); setBio(profile?.bio || '')
      setSkills(profile?.skills || []); setAvatarUrl(profile?.avatar_url || '')
      setResumeUrl(profile?.resume_url || ''); setTab('profile')
      setSocial({ linkedin: (profile?.social_links as any)?.linkedin || '', dribbble: (profile?.social_links as any)?.dribbble || '', behance: (profile?.social_links as any)?.behance || '', twitter: (profile?.social_links as any)?.twitter || '', website: (profile?.social_links as any)?.website || '' })
    }
  }, [open, profile])

  const handleAvatar = async (file: File) => {
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) { alert('Please upload a PNG, JPG or WEBP under 2MB'); return }
    setUploading(true)
    try {
      const { default: compress } = await import('browser-image-compression')
      const compressed = await compress(file, { maxSizeMB: 1, maxWidthOrHeight: 400, useWebWorker: true })
      const res = await fetch('/api/upload/presign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, contentType: file.type, bucket: 'avatars' }) })
      const { url, publicUrl } = await res.json()
      await fetch(url, { method: 'PUT', body: compressed, headers: { 'Content-Type': file.type } })
      setAvatarUrl(publicUrl)
    } finally { setUploading(false) }
  }

  const handleResume = async (file: File) => {
    if (file.type !== 'application/pdf') { alert('Please upload a PDF file'); return }
    if (file.size > 5 * 1024 * 1024) { alert('File exceeds 5MB limit'); return }
    setUploadingResume(true)
    try {
      const res = await fetch('/api/upload/presign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, contentType: file.type, bucket: 'resumes' }) })
      const { url, publicUrl } = await res.json()
      await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      setResumeUrl(publicUrl)
    } finally { setUploadingResume(false) }
  }

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    const cleanSocial = Object.fromEntries(Object.entries(social).filter(([, v]) => v.trim()))
    const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), bio, skills, avatar_url: avatarUrl || null, resume_url: resumeUrl || null, social_links: cleanSocial }) })
    if (res.ok) { onSaved(await res.json()); onClose() }
    setSaving(false)
  }

  const TabBtn = ({ id, label }: { id: 'profile' | 'social'; label: string }) => (
    <button onClick={() => setTab(id)} style={{ flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 600, borderRadius: 'var(--px-r)', background: tab === id ? 'var(--px-surface)' : 'transparent', color: tab === id ? 'var(--px-text)' : 'var(--px-text-3)', border: tab === id ? '1px solid var(--px-border)' : '1px solid transparent', cursor: 'pointer', fontFamily: 'var(--px-font)', boxShadow: tab === id ? 'var(--px-shadow-sm)' : 'none' }}>{label}</button>
  )

  return (
    <Modal open={open} onClose={onClose} title="Edit profile" width={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--px-surface-2)', borderRadius: 'var(--px-r)', padding: 3 }}>
          <TabBtn id="profile" label="Profile" />
          <TabBtn id="social" label="Social & Resume" />
        </div>

        {tab === 'profile' && (
          <>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <Avatar name={name || 'User'} src={avatarUrl || null} size={64} editable onClick={() => avatarRef.current?.click()} />
                {uploading && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={18} /></div>}
                <input ref={avatarRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatar(f); e.target.value = '' }} />
              </div>
              <div>
                <Btn variant="secondary" size="sm" icon="upload" onClick={() => avatarRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading…' : 'Change photo'}</Btn>
                <p style={{ fontSize: 11, color: 'var(--px-text-3)', marginTop: 5 }}>PNG, JPG or WEBP · Max 2MB</p>
              </div>
            </div>
            <Input label="Full name *" value={name} onChange={setName} maxLength={60} />
            <Textarea label="Short bio" value={bio} onChange={setBio} maxLength={200} rows={3} placeholder="Product designer focused on thoughtful digital experiences..." />
            {/* Skills */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)', letterSpacing: '-0.01em', display: 'block', marginBottom: 6 }}>
                Skills <span style={{ fontSize: 12, color: 'var(--px-text-3)', fontWeight: 400 }}>({skills.length}/8)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ALL_SKILLS.map(s => {
                  const sel = skills.includes(s)
                  return (
                    <Tag key={s} selected={sel} onClick={(skills.length >= 8 && !sel) ? undefined : () => setSkills(sel ? skills.filter(x => x !== s) : [...skills, s])}>
                      {s}
                    </Tag>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {tab === 'social' && (
          <>
            {[
              { key: 'linkedin', label: 'LinkedIn', ph: 'linkedin.com/in/yourname', hint: 'linkedin.com/in/ format' },
              { key: 'dribbble', label: 'Dribbble', ph: 'dribbble.com/yourname' },
              { key: 'behance',  label: 'Behance',  ph: 'behance.net/yourname' },
              { key: 'twitter',  label: 'Twitter / X', ph: 'twitter.com/yourname' },
              { key: 'website',  label: 'Personal website', ph: 'https://yoursite.com' },
            ].map(f => (
              <Input key={f.key} label={f.label} value={(social as any)[f.key]} onChange={v => setSocial(s => ({ ...s, [f.key]: v }))} placeholder={f.ph} hint={f.hint} />
            ))}
            {/* Resume */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)', letterSpacing: '-0.01em', display: 'block', marginBottom: 8 }}>Resume / CV</label>
              {resumeUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--px-surface-2)', borderRadius: 'var(--px-r)', border: '1px solid var(--px-border)' }}>
                  <Icon name="check" size={14} color="var(--px-success)" />
                  <span style={{ fontSize: 13, color: 'var(--px-text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Resume uploaded</span>
                  <button onClick={() => setResumeUrl('')} style={{ fontSize: 12, color: '#C94040', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>Remove</button>
                  <Btn variant="secondary" size="xs" icon="upload" onClick={() => resumeRef.current?.click()} disabled={uploadingResume}>Replace</Btn>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Btn variant="secondary" size="sm" icon="upload" onClick={() => resumeRef.current?.click()} disabled={uploadingResume}>
                    {uploadingResume ? 'Uploading…' : 'Upload PDF'}
                  </Btn>
                  <span style={{ fontSize: 12, color: 'var(--px-text-3)' }}>PDF only · Max 5MB · Opens in new tab on published site</span>
                </div>
              )}
              <input ref={resumeRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleResume(f); e.target.value = '' }} />
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={save} disabled={!name.trim() || saving}>{saving ? 'Saving…' : 'Save changes'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ── Upgrade Modal ─────────────────────────────────────────────────────────────
function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} width={500} noPad>
      <div style={{ padding: '28px 28px 24px', textAlign: 'center', borderBottom: '1px solid var(--px-border)' }}>
        <div style={{ width: 48, height: 48, background: 'var(--px-accent-subtle)', borderRadius: 'var(--px-r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--px-accent)' }}>
          <Icon name="zap" size={22} color="var(--px-accent)" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Free case study limit reached</h2>
        <p style={{ fontSize: 14, color: 'var(--px-text-2)', lineHeight: 1.5 }}>Free accounts can publish up to <strong>6 case studies</strong>. Upgrade to Pro for unlimited.</p>
      </div>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Free', price: '$0', features: ['6 case studies', 'Canvas + Spotlight', 'Basic analytics', 'Subdomain'], highlight: false },
            { label: 'Pro', price: '$12/mo', features: ['Unlimited case studies', 'All layouts', 'Advanced analytics', 'Custom domain (soon)'], highlight: true },
          ].map(plan => (
            <div key={plan.label} style={{ padding: 16, borderRadius: 'var(--px-r-lg)', border: `1.5px solid ${plan.highlight ? 'var(--px-accent)' : 'var(--px-border)'}`, background: plan.highlight ? 'var(--px-accent-subtle)' : 'var(--px-surface-2)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: plan.highlight ? 'var(--px-accent)' : 'var(--px-text-2)', marginBottom: 4 }}>{plan.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--px-text)', marginBottom: 12 }}>{plan.price}</div>
              {plan.features.map(f => <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}><Icon name="check" size={13} color={plan.highlight ? 'var(--px-accent)' : 'var(--px-text-3)'} /><span style={{ fontSize: 12, color: plan.highlight ? 'var(--px-text)' : 'var(--px-text-2)' }}>{f}</span></div>)}
            </div>
          ))}
        </div>
        <Btn variant="primary" size="lg" icon="zap" style={{ width: '100%', justifyContent: 'center' }}>Upgrade to Pro — $12/mo</Btn>
        <button onClick={onClose} style={{ display: 'block', width: '100%', marginTop: 10, fontSize: 13, color: 'var(--px-text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--px-font)', textAlign: 'center' }}>Maybe later</button>
      </div>
    </Modal>
  )
}

// ── Case Study Card ───────────────────────────────────────────────────────────
function CaseStudyCard({ cs, onEdit, onDelete }: { cs: CaseStudy; onEdit: () => void; onDelete: () => void }) {
  const [hover, setHover] = useState(false)
  const grad = CASE_GRADS[cs.id.charCodeAt(0) % CASE_GRADS.length]
  const bg = cs.cover_image_url ? `url(${cs.cover_image_url}) center/cover` : grad

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', overflow: 'hidden', transition: `box-shadow var(--dur-base) var(--ease-hover), transform var(--dur-base) var(--ease-hover)`, boxShadow: hover ? 'var(--px-shadow-md)' : 'var(--px-shadow-sm)', transform: hover ? 'translateY(-3px)' : 'none' }}>
      <div style={{ height: 140, background: bg, position: 'relative' }}>
        {cs.nda_enabled && (
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.55)', borderRadius: 999, padding: '4px 10px', backdropFilter: 'blur(4px)' }}>
            <Icon name="lock" size={12} color="#fff" />
            <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>NDA</span>
          </div>
        )}
        {!cs.published && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 999, padding: '4px 10px', backdropFilter: 'blur(4px)' }}>
            <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, letterSpacing: '0.02em' }}>DRAFT</span>
          </div>
        )}
        {hover && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, animation: 'px-fadein 0.12s ease' }}>
            <Btn variant="primary" size="sm" icon="edit" onClick={onEdit}>Edit</Btn>
            <button onClick={onDelete} style={{ height: 32, padding: '0 12px', fontSize: 13, fontWeight: 600, background: 'rgba(201,64,64,0.7)', color: '#fff', border: '1px solid rgba(201,64,64,0.4)', borderRadius: 'var(--px-r)', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>Delete</button>
          </div>
        )}
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--px-text)', lineHeight: 1.35, flex: 1 }}>{cs.title}</h3>
          {cs.nda_enabled && <Icon name="lock" size={14} color="var(--px-text-3)" style={{ flexShrink: 0, marginTop: 2 }} />}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {!cs.published ? <Badge color="orange">Draft</Badge> : <Badge color="green">Published</Badge>}
        </div>
      </div>
    </div>
  )
}

// ── Main Builder Client ───────────────────────────────────────────────────────
interface Props {
  initialProfile: Profile | null
  initialCaseStudies: CaseStudy[]
  initialTestimonials: Testimonial[]
  initialExperience: WorkExperience[]
  initialTools: ToolStackItem[]
  freeLimit: number
}

export function BuilderClient({ initialProfile, initialCaseStudies, initialTestimonials, initialExperience, initialTools, freeLimit }: Props) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [cases, setCases] = useState<CaseStudy[]>(initialCaseStudies)
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials)
  const [experience, setExperience] = useState<WorkExperience[]>(initialExperience)
  const [tools, setTools] = useState<ToolStackItem[]>(initialTools)
  const [darkMode, setDarkMode] = useState(() => { try { return localStorage.getItem('px-dark') === 'true' } catch { return false } })
  const [showPublish, setShowPublish] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CaseStudy | null>(null)
  const [addingCase, setAddingCase] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    try { localStorage.setItem('px-dark', String(darkMode)) } catch {}
  }, [darkMode])

  const handleAddCase = async () => {
    if (profile?.plan === 'free' && cases.length >= freeLimit) { setShowUpgrade(true); return }
    setAddingCase(true)
    const res = await fetch('/api/case-studies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Untitled' }) })
    if (res.ok) { const cs = await res.json(); router.push(`/case-study/${cs.id}`) }
    else { const d = await res.json(); if (d.upgrade) setShowUpgrade(true); setAddingCase(false) }
  }

  const handleDeleteCase = async () => {
    if (!deleteTarget) return
    await fetch(`/api/case-studies/${deleteTarget.id}`, { method: 'DELETE' })
    setCases(c => c.filter(x => x.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const slugUrl = profile?.slug ? `${profile.slug}.portfoliox.me` : null

  return (
    <div className="px-screen" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top nav */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--px-border)', background: 'var(--px-surface)', flexShrink: 0, gap: 12 }}>
        <PXLogo size={24} />
        {slugUrl ? (
          <button onClick={() => { navigator.clipboard.writeText(slugUrl) }} title="Copy URL"
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', background: 'var(--px-surface-2)', border: '1px solid var(--px-border)', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
            <Icon name="globe" size={12} color="var(--px-success)" />
            <span style={{ fontSize: 12, color: 'var(--px-text-3)', fontWeight: 500 }}>{slugUrl}</span>
            <Icon name="copy" size={12} color="var(--px-text-3)" />
          </button>
        ) : <div style={{ fontSize: 12, color: 'var(--px-text-3)', fontStyle: 'italic' }}>Not published yet</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          <IconBtn name="barChart" size={34} iconSize={17} title="Admin" onClick={() => router.push('/admin')} />
          <IconBtn name="palette" size={34} iconSize={17} title="Themes" />
          <IconBtn name={darkMode ? 'sun' : 'moon'} size={34} iconSize={17} onClick={() => setDarkMode(d => !d)} title={darkMode ? 'Light mode' : 'Dark mode'} />
          <div style={{ width: 1, height: 20, background: 'var(--px-border)', margin: '0 4px' }} />
          <Btn variant="secondary" size="sm" icon="eye" onClick={() => router.push('/preview')}>Preview</Btn>
          <Btn variant="primary" size="sm" icon="globe" onClick={() => setShowPublish(true)}>{profile?.slug ? 'Update' : 'Publish'}</Btn>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0 64px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>

          {/* Profile hero */}
          <div style={{ background: 'var(--px-surface)', borderRadius: 'var(--px-r-xl)', border: '1px solid var(--px-border)', padding: '32px 32px 28px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
              <Avatar name={profile?.name || 'You'} src={profile?.avatar_url} size={72} editable onClick={() => setShowProfileEdit(true)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--px-text)' }}>{profile?.name || 'Your Name'}</h1>
                  {profile?.discipline && <Badge>{DISCIPLINES[profile.discipline]}</Badge>}
                  <IconBtn name="edit" size={26} iconSize={13} title="Edit profile" onClick={() => setShowProfileEdit(true)} />
                </div>
                <p style={{ fontSize: 14, color: profile?.bio ? 'var(--px-text-2)' : 'var(--px-text-3)', lineHeight: 1.6, cursor: 'text', fontStyle: profile?.bio ? 'normal' : 'italic' }}
                  onClick={() => setShowProfileEdit(true)}>
                  {profile?.bio || 'Click to add your bio…'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {(profile?.skills || []).map(s => <Tag key={s}>{s}</Tag>)}
              <Tag onClick={() => setShowProfileEdit(true)}>+ {(profile?.skills || []).length === 0 ? 'Add skills' : 'Edit skills'}</Tag>
            </div>
            {/* Social + Resume links */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {(profile?.social_links as any)?.linkedin && <Btn variant="ghost" size="sm" icon="linkedin" style={{ color: 'var(--px-text-3)', fontSize: 12 }}>{(profile?.social_links as any).linkedin}</Btn>}
              {(profile?.social_links as any)?.dribbble && <Btn variant="ghost" size="sm" icon="dribbble" style={{ color: 'var(--px-text-3)', fontSize: 12 }}>{(profile?.social_links as any).dribbble}</Btn>}
              {(profile?.social_links as any)?.website && <Btn variant="ghost" size="sm" icon="globe" style={{ color: 'var(--px-text-3)', fontSize: 12 }}>{(profile?.social_links as any).website}</Btn>}
              {profile?.resume_url && <Btn variant="ghost" size="sm" style={{ color: 'var(--px-text-3)', fontSize: 12 }}>Resume uploaded ✓</Btn>}
              <Btn variant="ghost" size="sm" onClick={() => setShowProfileEdit(true)} style={{ color: 'var(--px-text-3)', fontSize: 12 }}>Edit links & resume</Btn>
            </div>
          </div>

          {/* Case Studies */}
          <div style={{ marginBottom: 24 }}>
            <SectionHead title="Case Studies" count={cases.length}
              action={
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Btn variant="primary" size="sm" icon="plus" onClick={handleAddCase} disabled={addingCase}>
                    {addingCase ? 'Creating…' : 'Add case study'}
                  </Btn>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 7px', letterSpacing: '0.02em', borderRadius: 4, color: cases.length >= freeLimit && profile?.plan === 'free' ? 'var(--px-warning)' : 'var(--px-text-3)', background: cases.length >= freeLimit && profile?.plan === 'free' ? 'var(--px-warning-subtle)' : 'var(--px-surface-2)', border: `1px solid ${cases.length >= freeLimit && profile?.plan === 'free' ? 'var(--px-warning)' : 'var(--px-border)'}` }}>
                    {cases.length}/{freeLimit}
                  </span>
                </div>
              }
            />
            {cases.length === 0 ? (
              <div style={{ border: '2px dashed var(--px-border)', borderRadius: 'var(--px-r-xl)', padding: '56px 24px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20, opacity: 0.35 }}>
                  {['Cover', 'Process', 'Outcome'].map((label, i) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                      <div style={{ width: i === 0 ? 100 : 64, height: i === 0 ? 58 : 44, borderRadius: 6, background: 'var(--px-surface-3)', border: '1.5px dashed var(--px-border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="image" size={18} color="var(--px-text-3)" />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--px-text-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
                    </div>
                  ))}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--px-text)', marginBottom: 6, letterSpacing: '-0.02em' }}>Add your first case study</h3>
                <p style={{ fontSize: 14, color: 'var(--px-text-3)', marginBottom: 20, lineHeight: 1.5 }}>Upload your visuals. PortfolioX wraps the narrative around them.</p>
                <Btn variant="primary" icon="plus" onClick={handleAddCase} disabled={addingCase}>{addingCase ? 'Creating…' : 'Add case study'}</Btn>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {cases.map((cs, i) => (
                  <div key={cs.id} style={{ animation: `px-fadein var(--dur-base) var(--ease-out) ${i * 60}ms both` }}>
                    <CaseStudyCard cs={cs} onEdit={() => router.push(`/case-study/${cs.id}`)} onDelete={() => setDeleteTarget(cs)} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Remaining sections */}
          <TestimonialsSection testimonials={testimonials} onChange={setTestimonials} />
          <ToolStackSection tools={tools} onChange={setTools} />
          <WorkExperienceSection experience={experience} onChange={setExperience} />

          {/* Footer CTA */}
          <div style={{ background: 'var(--px-text)', borderRadius: 'var(--px-r-xl)', padding: '36px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--px-bg)', marginBottom: 6 }}>Ready to share?</h2>
              <p style={{ fontSize: 14, color: 'rgba(240,238,233,0.5)', lineHeight: 1.5 }}>{slugUrl ? `Live at ${slugUrl}` : 'Publish your portfolio to get a link.'}</p>
            </div>
            <Btn variant="primary" size="lg" onClick={() => setShowPublish(true)}>{profile?.slug ? 'View live' : 'Publish now'}</Btn>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PublishModal open={showPublish} onClose={() => setShowPublish(false)} profile={profile} onPublished={slug => setProfile(p => p ? { ...p, slug } : p)} />
      <ProfileEditModal open={showProfileEdit} onClose={() => setShowProfileEdit(false)} profile={profile} onSaved={setProfile} />
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete case study" width={400}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--px-text-2)', lineHeight: 1.55 }}>Delete <strong>{deleteTarget?.title}</strong>? This permanently removes the case study and cannot be undone.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleDeleteCase}>Delete</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
