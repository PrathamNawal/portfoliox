'use client'

import React, { useState, useRef, useEffect } from 'react'
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

  const toolBtn = (label: string, cmd: string, val?: string) => (
    <button type="button" onMouseDown={e => { e.preventDefault(); exec(cmd, val) }}
      style={{ height: 26, padding: '0 8px', fontSize: 12, fontWeight: 700, background: 'var(--px-surface-2)', border: '1px solid var(--px-border)', borderRadius: 4, cursor: 'pointer', color: 'var(--px-text)', fontFamily: 'var(--px-font)' }}>
      {label}
    </button>
  )

  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)', letterSpacing: '-0.01em', display: 'block', marginBottom: 6 }}>Description</label>
      <div style={{ border: '1px solid var(--px-border)', borderRadius: 'var(--px-r)', overflow: 'hidden', background: 'var(--px-surface)' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--px-border)', background: 'var(--px-surface-2)' }}>
          {toolBtn('B', 'bold')}
          {toolBtn('I', 'italic')}
          {toolBtn('U', 'underline')}
          {toolBtn('• List', 'insertUnorderedList')}
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
        [contenteditable] ul { padding-left: 18px; margin: 4px 0; }
        [contenteditable] li { margin: 2px 0; }
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

function ExperienceModal({ open, onClose, initial, onSaved }: {
  open: boolean; onClose: () => void
  initial?: WorkExperience | null
  onSaved: (e: WorkExperience) => void
}) {
  const [role, setRole] = useState(initial?.role || '')
  const [company, setCompany] = useState(initial?.company || '')
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
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: role.trim(), company: company.trim(), start_month: startMonth, end_month: isCurrent ? null : endMonth || null, is_current: isCurrent, description: description.trim() || null, discipline_tag: tag || null }) })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Save failed'); return }
      onSaved(await res.json()); onClose()
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit role' : 'Add role'} width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Role *" value={role} onChange={setRole} placeholder="Product Designer" />
        <Input label="Company *" value={company} onChange={setCompany} placeholder="Studio Nought" />
        <MonthYearPicker label="Start *" value={startMonth} onChange={setStartMonth} />
        {!isCurrent && <MonthYearPicker label="End" value={endMonth} onChange={setEndMonth} />}
        <Toggle value={isCurrent} onChange={setIsCurrent} label="I currently work here" />
        <RichTextEditor value={description} onChange={setDescription} placeholder="What you did, led, or built…" />
        {/* Discipline tag */}
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
