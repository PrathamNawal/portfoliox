'use client'

import React, { useState, useRef, useEffect, type ReactNode } from 'react'
import { Btn, IconBtn } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SectionHead, Toggle } from '@/components/ui/Misc'
import type { WorkExperience } from '@/types'

// ── Lightweight rich-text editor ─────────────────────────────────────────────
function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isComposing = useRef(false)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || ''
    }
  }, []) // Only on mount

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    ref.current?.focus()
    if (ref.current) onChange(ref.current.innerHTML)
  }

  const toolBtn = (content: ReactNode, cmd: string, val?: string) => (
    <button type="button" onMouseDown={e => { e.preventDefault(); exec(cmd, val) }}
      style={{ width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid transparent', borderRadius: 5, cursor: 'pointer', color: 'var(--px-text)', fontFamily: 'var(--px-font)', transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--px-border)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      {content}
    </button>
  )

  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)', letterSpacing: '-0.01em', display: 'block', marginBottom: 6 }}>Description</label>
      <div style={{ border: '1px solid var(--px-border)', borderRadius: 'var(--px-r)', overflow: 'hidden', background: 'var(--px-surface)' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 2, padding: '4px 6px', borderBottom: '1px solid var(--px-border)', background: 'var(--px-surface-2)' }}>
          {toolBtn(<span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.04em' }}>B</span>, 'bold')}
          {toolBtn(<span style={{ fontSize: 13, fontWeight: 600, fontStyle: 'italic', letterSpacing: '-0.02em' }}>I</span>, 'italic')}
          {toolBtn(<span style={{ fontSize: 12, fontWeight: 600, textDecoration: 'line-through' }}>S</span>, 'strikeThrough')}
          {toolBtn(
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="5" y="2.5" width="9" height="1.5" rx="0.75" fill="currentColor"/><rect x="5" y="7.25" width="9" height="1.5" rx="0.75" fill="currentColor"/><rect x="5" y="12" width="9" height="1.5" rx="0.75" fill="currentColor"/><circle cx="2" cy="3.25" r="1.25" fill="currentColor"/><circle cx="2" cy="8" r="1.25" fill="currentColor"/><circle cx="2" cy="12.75" r="1.25" fill="currentColor"/></svg>,
            'insertUnorderedList'
          )}
        </div>
        {/* Editable area */}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={() => { if (!isComposing.current && ref.current) onChange(ref.current.innerHTML) }}
          onCompositionStart={() => { isComposing.current = true }}
          onCompositionEnd={() => { isComposing.current = false; if (ref.current) onChange(ref.current.innerHTML) }}
          data-placeholder={placeholder}
          style={{ minHeight: 80, padding: '10px 12px', fontSize: 13, color: 'var(--px-text)', outline: 'none', lineHeight: 1.55, fontFamily: 'var(--px-font)' }}
        />
      </div>
      <style>{`
        [contenteditable]:empty:before { content: attr(data-placeholder); color: var(--px-text-3); pointer-events: none; }
        [contenteditable] ul { list-style: disc; padding-left: 18px; margin: 4px 0; }
        [contenteditable] ol { list-style: decimal; padding-left: 18px; margin: 4px 0; }
        [contenteditable] li { margin: 2px 0; display: list-item; }
      `}</style>
    </div>
  )
}

const DISCIPLINE_TAGS = ['UX Design', 'Brand/Graphic', 'Motion', 'Product Design', 'Research', 'Other']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const YEARS = Array.from({ length: 20 }, (_, i) => String(new Date().getFullYear() - i))

function MonthYearPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [month, year] = value ? value.split(' ') : ['', '']
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)', letterSpacing: '-0.01em', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={month} onChange={e => onChange(`${e.target.value} ${year || YEARS[0]}`)}
          style={{ flex: 1, height: 40, padding: '0 10px', fontSize: 14, color: 'var(--px-text)', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r)', outline: 'none', fontFamily: 'var(--px-font)', cursor: 'pointer' }}>
          <option value="">Month</option>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={year} onChange={e => onChange(`${month || MONTHS[0]} ${e.target.value}`)}
          style={{ flex: 1, height: 40, padding: '0 10px', fontSize: 14, color: 'var(--px-text)', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r)', outline: 'none', fontFamily: 'var(--px-font)', cursor: 'pointer' }}>
          <option value="">Year</option>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  )
}

// ── Logo search helpers ───────────────────────────────────────────────────────
function guessLogoUrl(company: string): string {
  const slug = company.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
  return `https://logo.clearbit.com/${slug}.com`
}

function LogoPicker({ company, value, onChange }: {
  company: string
  value: string
  onChange: (url: string) => void
}) {
  const [searching, setSearching] = useState(false)
  const [candidate, setCandidate] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual] = useState(value || '')
  const uploadRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // Auto-search when company name changes
  useEffect(() => {
    if (!company.trim() || company.trim().length < 2 || value) return
    const t = setTimeout(() => {
      setSearching(true)
      setCandidate(guessLogoUrl(company))
    }, 700)
    return () => clearTimeout(t)
  }, [company, value])

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const res = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, bucket: 'case-study-images' }),
      })
      const { url, publicUrl } = await res.json()
      await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      onChange(publicUrl)
      setManual(publicUrl)
    } finally { setUploading(false) }
  }

  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)', letterSpacing: '-0.01em', display: 'block', marginBottom: 8 }}>
        Company logo
      </label>

      {/* Hidden img to test Clearbit candidate */}
      {candidate && !value && (
        <img
          src={candidate}
          alt=""
          style={{ display: 'none' }}
          onLoad={() => { onChange(candidate); setSearching(false); setCandidate(null) }}
          onError={() => { setSearching(false); setCandidate(null) }}
        />
      )}

      {value ? (
        /* Logo confirmed */
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--px-surface-2)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r)' }}>
          <img
            src={value}
            alt="logo"
            style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, background: '#fff', border: '1px solid var(--px-border)', padding: 2 }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--px-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {value.includes('clearbit') ? 'Auto-detected logo' : 'Custom logo'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--px-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
          </div>
          <button onClick={() => { onChange(''); setManual(''); setManualOpen(false) }}
            style={{ fontSize: 11, color: 'var(--px-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--px-font)', fontWeight: 600, flexShrink: 0 }}>
            Remove
          </button>
        </div>
      ) : searching ? (
        <div style={{ padding: '10px 12px', background: 'var(--px-surface-2)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r)', fontSize: 12, color: 'var(--px-text-3)' }}>
          Searching for {company} logo…
        </div>
      ) : (
        /* No logo yet */
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setManualOpen(o => !o)}
            style={{ flex: 1, height: 36, border: '1.5px dashed var(--px-border)', borderRadius: 'var(--px-r)', fontSize: 12, fontWeight: 500, color: 'var(--px-text-3)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
            {manualOpen ? 'Cancel' : '+ Add logo URL'}
          </button>
          <button
            onClick={() => uploadRef.current?.click()}
            disabled={uploading}
            style={{ height: 36, padding: '0 14px', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r)', fontSize: 12, fontWeight: 500, color: 'var(--px-text-2)', background: 'var(--px-surface)', cursor: 'pointer', fontFamily: 'var(--px-font)', flexShrink: 0 }}>
            {uploading ? 'Uploading…' : '↑ Upload'}
          </button>
          <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }} />
        </div>
      )}

      {manualOpen && !value && (
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <input
            value={manual}
            onChange={e => setManual(e.target.value)}
            placeholder="https://logo.clearbit.com/company.com"
            style={{ flex: 1, height: 36, padding: '0 10px', fontSize: 13, color: 'var(--px-text)', background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r)', outline: 'none', fontFamily: 'var(--px-font)' }}
          />
          <button
            onClick={() => { if (manual.trim()) { onChange(manual.trim()); setManualOpen(false) } }}
            style={{ height: 36, padding: '0 14px', background: 'var(--px-accent)', color: '#fff', border: 'none', borderRadius: 'var(--px-r)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--px-font)', flexShrink: 0 }}>
            Use
          </button>
        </div>
      )}
      {!value && (
        <p style={{ fontSize: 11, color: 'var(--px-text-3)', margin: '6px 0 0', lineHeight: 1.4 }}>
          Square image recommended (PNG/SVG, min 100×100px). Logos auto-detected from company name.
        </p>
      )}
    </div>
  )
}

function ExperienceModal({ open, onClose, initial, onSaved }: {
  open: boolean; onClose: () => void
  initial?: WorkExperience | null
  onSaved: (e: WorkExperience) => void
}) {
  const [role, setRole] = useState(initial?.role || '')
  const [company, setCompany] = useState(initial?.company || '')
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url || '')
  const [startMonth, setStartMonth] = useState(initial?.start_month || '')
  const [endMonth, setEndMonth] = useState(initial?.end_month || '')
  const [isCurrent, setIsCurrent] = useState(initial?.is_current || false)
  const [description, setDescription] = useState(initial?.description || '')
  const [tag, setTag] = useState(initial?.discipline_tag || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  React.useEffect(() => {
    if (open) {
      setRole(initial?.role || ''); setCompany(initial?.company || '')
      setLogoUrl(initial?.logo_url || '')
      setStartMonth(initial?.start_month || ''); setEndMonth(initial?.end_month || '')
      setIsCurrent(initial?.is_current || false); setDescription(initial?.description || '')
      setTag(initial?.discipline_tag || ''); setError('')
    }
  }, [open, initial])

  const save = async () => {
    if (!role.trim() || !company.trim() || !startMonth) { setError('Role, company and start month are required'); return }
    if (!isCurrent && !endMonth) { setError('Please set an end month or check "I currently work here"'); return }
    setError(''); setSaving(true)
    try {
      const url = initial ? `/api/experience/${initial.id}` : '/api/experience'
      const method = initial ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        role: role.trim(), company: company.trim(), logo_url: logoUrl || null,
        start_month: startMonth, end_month: isCurrent ? null : endMonth || null,
        is_current: isCurrent, description: description.trim() || null, discipline_tag: tag || null,
      }) })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Save failed'); return }
      onSaved(await res.json()); onClose()
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit role' : 'Add role'} width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Role *" value={role} onChange={setRole} placeholder="Product Designer" />
        <Input label="Company *" value={company} onChange={setCompany} placeholder="Swiggy" />
        <LogoPicker company={company} value={logoUrl} onChange={setLogoUrl} />
        <MonthYearPicker label="Start *" value={startMonth} onChange={setStartMonth} />
        {!isCurrent && <MonthYearPicker label="End" value={endMonth} onChange={setEndMonth} />}
        <Toggle value={isCurrent} onChange={setIsCurrent} label="I currently work here" />
        <RichTextEditor value={description} onChange={setDescription} placeholder="What you did, led, or built…" />
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)', letterSpacing: '-0.01em', display: 'block', marginBottom: 8 }}>Discipline tag</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {DISCIPLINE_TAGS.map(t => (
              <button key={t} onClick={() => setTag(tag === t ? '' : t)}
                style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, borderRadius: 999, background: tag === t ? 'var(--px-accent-subtle)' : 'var(--px-surface-2)', border: `1px solid ${tag === t ? 'var(--px-accent)' : 'var(--px-border)'}`, color: tag === t ? 'var(--px-accent)' : 'var(--px-text)', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {error && <p style={{ fontSize: 12, color: '#C94040', margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Add role'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

interface Props {
  experience: WorkExperience[]
  onChange: (exp: WorkExperience[]) => void
}

export function WorkExperienceSection({ experience, onChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<WorkExperience | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleSaved = (e: WorkExperience) => {
    if (editTarget) onChange(experience.map(x => x.id === e.id ? e : x))
    else onChange([e, ...experience])
    setEditTarget(null)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/experience/${id}`, { method: 'DELETE' })
    onChange(experience.filter(e => e.id !== id))
    setDeleteId(null)
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <SectionHead title="Work Experience" action={<Btn variant="ghost" size="sm" icon="plus" onClick={() => { setEditTarget(null); setModalOpen(true) }}>Add role</Btn>} />

      {experience.length === 0 ? (
        <div style={{ background: 'var(--px-surface)', border: '1px dashed var(--px-border)', borderRadius: 'var(--px-r-lg)', padding: '20px 24px', fontSize: 13, color: 'var(--px-text-3)', cursor: 'pointer' }}
          onClick={() => { setEditTarget(null); setModalOpen(true) }}>
          Add your work history to give context to your case studies.
        </div>
      ) : (
        <div style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', overflow: 'hidden' }}>
          {experience.map((exp, i) => (
            <div key={exp.id} style={{ padding: '16px 20px', borderBottom: i < experience.length - 1 ? '1px solid var(--px-border)' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--px-r)', background: 'var(--px-surface-2)', border: '1px solid var(--px-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--px-text-3)' }}>{exp.company[0]}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--px-text)', letterSpacing: '-0.01em' }}>{exp.role}</div>
                <div style={{ fontSize: 12, color: 'var(--px-text-2)' }}>{exp.company} · {exp.start_month} – {exp.is_current ? 'Present' : exp.end_month}</div>
                {exp.description && <p style={{ fontSize: 12, color: 'var(--px-text-3)', marginTop: 3, lineHeight: 1.4 }}>{exp.description}</p>}
              </div>
              {exp.discipline_tag && <Badge>{exp.discipline_tag}</Badge>}
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <IconBtn name="edit" size={28} iconSize={14} title="Edit" onClick={() => { setEditTarget(exp); setModalOpen(true) }} />
                <IconBtn name="trash" size={28} iconSize={14} title="Delete" color="#C94040" onClick={() => setDeleteId(exp.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <ExperienceModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null) }} initial={editTarget} onSaved={handleSaved} />

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete role" width={380}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--px-text-2)', lineHeight: 1.5 }}>Delete this role from your portfolio?</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
