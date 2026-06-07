'use client'

import React, { useState, useRef } from 'react'
import { Btn, IconBtn } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { SectionHead, Spinner } from '@/components/ui/Misc'
import type { Testimonial } from '@/types'

function TestimonialModal({ open, onClose, initial, onSaved }: {
  open: boolean; onClose: () => void
  initial?: Testimonial | null
  onSaved: (t: Testimonial) => void
}) {
  const [name, setName] = useState(initial?.name || '')
  const [company, setCompany] = useState(initial?.title_and_company || '')
  const [linkedin, setLinkedin] = useState(initial?.linkedin_url || '')
  const [quote, setQuote] = useState(initial?.quote || '')
  const [photoUrl, setPhotoUrl] = useState(initial?.photo_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      setName(initial?.name || ''); setCompany(initial?.title_and_company || '')
      setLinkedin(initial?.linkedin_url || ''); setQuote(initial?.quote || '')
      setPhotoUrl(initial?.photo_url || ''); setError('')
    }
  }, [open, initial])

  const uploadPhoto = async (file: File) => {
    if (!file.type.match(/image\/(jpeg|png)/)) { setError('Please upload a PNG or JPG file'); return }
    setUploading(true)
    try {
      const { default: compress } = await import('browser-image-compression')
      const compressed = await compress(file, { maxSizeMB: 0.5, maxWidthOrHeight: 200 })
      const res = await fetch('/api/upload/presign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, contentType: file.type, bucket: 'avatars' }) })
      const { url, publicUrl } = await res.json()
      await fetch(url, { method: 'PUT', body: compressed, headers: { 'Content-Type': file.type } })
      setPhotoUrl(publicUrl)
    } finally { setUploading(false) }
  }

  const validate = () => {
    if (!name.trim()) return 'Name is required'
    if (!company.trim()) return 'Title + Company is required'
    if (!quote.trim()) return 'Quote is required'
    if (quote.length < 20) return 'Quote must be at least 20 characters'
    if (quote.length > 300) return 'Quote must be under 300 characters'
    if (linkedin && !linkedin.includes('linkedin.com/in/')) return 'LinkedIn URL must be a linkedin.com/in/ link'
    return ''
  }

  const save = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true)
    try {
      const url = initial ? `/api/testimonials/${initial.id}` : '/api/testimonials'
      const method = initial ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), title_and_company: company.trim(), linkedin_url: linkedin.trim() || null, quote: quote.trim(), photo_url: photoUrl || null }) })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Save failed'); return }
      onSaved(await res.json()); onClose()
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit testimonial' : 'Add testimonial'} width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={name || 'Person'} src={photoUrl || null} size={52} editable onClick={() => fileRef.current?.click()} />
            {uploading && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={16} /></div>}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = '' }} />
          </div>
          <div>
            <Btn variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading…' : 'Add photo'}</Btn>
            <p style={{ fontSize: 11, color: 'var(--px-text-3)', marginTop: 4 }}>Optional · PNG or JPG</p>
          </div>
        </div>
        <Input label="Name *" value={name} onChange={setName} placeholder="Arjun Sharma" />
        <Input label="Title + Company *" value={company} onChange={setCompany} placeholder="Head of Design, Razorpay" />
        <Input label="LinkedIn URL" value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/arjun" />
        <Textarea label="Quote *" value={quote} onChange={setQuote} maxLength={300} rows={4} placeholder="Priya has a rare ability to hold systems-level thinking alongside deep craft…" />
        {error && <p style={{ fontSize: 12, color: '#C94040', margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Add testimonial'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ── Single testimonial card (marquee item) ─────────────────────────────────────
function TestimonialCard({ t, onEdit, onDelete }: {
  t: Testimonial
  onEdit: () => void
  onDelete: () => void
}) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        width: 360,
        flexShrink: 0,
        background: 'var(--px-surface)',
        borderRadius: 28,
        padding: '28px 28px 24px',
        border: '1px solid var(--px-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        cursor: 'default',
        transition: 'box-shadow 0.18s',
        boxShadow: hover ? 'var(--px-shadow-md)' : 'none',
      }}
    >
      {/* Quote */}
      <p style={{
        fontSize: 15,
        lineHeight: 1.65,
        color: 'var(--px-text)',
        margin: 0,
        flex: 1,
        letterSpacing: '-0.01em',
      }}>
        <span style={{ fontSize: 22, color: 'var(--px-accent)', fontFamily: 'Georgia, serif', lineHeight: 0, verticalAlign: '-6px', marginRight: 2 }}>"</span>
        {t.quote}
        <span style={{ fontSize: 22, color: 'var(--px-accent)', fontFamily: 'Georgia, serif', lineHeight: 0, verticalAlign: '-6px', marginLeft: 2 }}>"</span>
      </p>

      {/* Spacer */}
      <div style={{ height: 28 }} />

      {/* Author */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name={t.name} src={t.photo_url} size={40} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--px-text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t.name}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--px-text-3)', letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t.title_and_company}
          </div>
        </div>
      </div>

      {/* Edit/delete — hover overlay top-right */}
      {hover && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          display: 'flex', gap: 4,
          animation: 'px-fadein 0.12s ease',
        }}>
          <IconBtn name="edit" size={26} iconSize={13} title="Edit" onClick={() => onEdit()} />
          <IconBtn name="trash" size={26} iconSize={13} title="Delete" color="#C94040" onClick={() => onDelete()} />
        </div>
      )}
    </div>
  )
}

// ── Main section ───────────────────────────────────────────────────────────────
interface Props {
  testimonials: Testimonial[]
  onChange: (ts: Testimonial[]) => void
}

export function TestimonialsSection({ testimonials, onChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Testimonial | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)

  const handleSaved = (t: Testimonial) => {
    if (editTarget) onChange(testimonials.map(x => x.id === t.id ? t : x))
    else onChange([...testimonials, t])
    setEditTarget(null)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/testimonials/${id}`, { method: 'DELETE' })
    onChange(testimonials.filter(t => t.id !== id))
    setDeleteId(null)
  }

  // Duplicate cards for seamless loop — need at least 2 sets
  const looped = testimonials.length > 0
    ? [...testimonials, ...testimonials, ...testimonials]
    : []

  // Speed: 40s per full pass (adjust based on count)
  const duration = Math.max(20, testimonials.length * 8)

  return (
    <div style={{ marginBottom: 24 }}>
      <SectionHead
        title="Testimonials"
        count={testimonials.length}
        action={<Btn variant="ghost" size="sm" icon="plus" onClick={() => { setEditTarget(null); setModalOpen(true) }}>Add</Btn>}
      />

      {testimonials.length === 0 ? (
        <div
          style={{ background: 'var(--px-surface)', border: '1px dashed var(--px-border)', borderRadius: 'var(--px-r-lg)', padding: '20px 24px', fontSize: 13, color: 'var(--px-text-3)', cursor: 'pointer' }}
          onClick={() => { setEditTarget(null); setModalOpen(true) }}
        >
          Add a quote from a collaborator or manager. They'll scroll across your portfolio.
        </div>
      ) : (
        <div>
          {/* Marquee viewport */}
          <div
            style={{
              overflow: 'hidden',
              // Fade edges
              maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
              borderRadius: 8,
            }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Scrolling track */}
            <div style={{
              display: 'flex',
              gap: 16,
              width: 'max-content',
              animation: `px-marquee ${duration}s linear infinite`,
              animationPlayState: paused ? 'paused' : 'running',
              paddingBottom: 4, // prevent shadow clipping
            }}>
              {looped.map((t, i) => (
                <TestimonialCard
                  key={`${t.id}-${i}`}
                  t={t}
                  onEdit={() => { setEditTarget(t); setModalOpen(true) }}
                  onDelete={() => setDeleteId(t.id)}
                />
              ))}
            </div>
          </div>

          {/* Hover hint */}
          <p style={{ fontSize: 11, color: 'var(--px-text-3)', marginTop: 10, textAlign: 'center' }}>
            Hover to pause · {testimonials.length} {testimonials.length === 1 ? 'testimonial' : 'testimonials'}
          </p>
        </div>
      )}

      <TestimonialModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        initial={editTarget}
        onSaved={handleSaved}
      />

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete testimonial" width={380}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--px-text-2)', lineHeight: 1.5 }}>Delete this testimonial? This cannot be undone.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
