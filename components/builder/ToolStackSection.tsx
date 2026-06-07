'use client'

import React, { useState } from 'react'
import { Btn } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SectionHead } from '@/components/ui/Misc'
import type { ToolStackItem } from '@/types'

// Designer tools first, then general
const ALL_TOOLS = [
  'Figma','FigJam','Framer','Sketch','Adobe XD','Miro','Maze','Dovetail','Zeplin',
  'Principle','Whimsical','Adobe Illustrator','Adobe Photoshop','Spline','Protopie',
  'Notion','Jira','Confluence','Slack','Loom','Linear','GitHub','VS Code',
  'Adobe After Effects','Adobe Premiere','Blender','Cinema 4D',
]

// Brand colors for the fallback dot (when no icon slug)
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

// Colors used for the SVG icon itself — adjusted for visibility on both light + dark surfaces
const TOOL_ICON_COLORS: Record<string, string> = {
  Figma: 'A259FF', FigJam: 'F24E1E', Framer: '0099FF', Sketch: 'F7B500',
  'Adobe XD': 'FF61F6', Miro: 'D4A800', Maze: 'FF5A5F', Dovetail: '7B5EE0',
  Zeplin: 'FDBD39', Principle: '4251FF', Whimsical: '9B51E0',
  'Adobe Illustrator': 'FF9A00', 'Adobe Photoshop': '31A8FF', Spline: '3D80FF',
  Protopie: '5C5CE6', Notion: '9A978E', Jira: '2684FF',
  Confluence: '2684FF', Slack: '7C3085', Loom: '625DF5',
  Linear: 'A47EFF', GitHub: '9A978E', 'VS Code': '0078D4',
  'Adobe After Effects': '9999FF', 'Adobe Premiere': 'EA77FF',
  Blender: 'E87D0D', 'Cinema 4D': '0168B3',
}

// Simple Icons slugs for logo CDN
const TOOL_ICONS: Record<string, string> = {
  'Figma': 'figma', 'FigJam': 'figma', 'Framer': 'framer', 'Sketch': 'sketch',
  'Adobe XD': 'adobexd', 'Miro': 'miro', 'Maze': 'maze', 'Zeplin': 'zeplin',
  'Whimsical': 'whimsical', 'Spline': 'spline',
  'Adobe Illustrator': 'adobeillustrator', 'Adobe Photoshop': 'adobephotoshop',
  'Adobe After Effects': 'adobeaftereffects', 'Adobe Premiere': 'adobepremierepro',
  'Protopie': 'protopie', 'Notion': 'notion', 'Jira': 'jira',
  'Confluence': 'confluence', 'Slack': 'slack', 'Loom': 'loom',
  'Linear': 'linear', 'GitHub': 'github', 'VS Code': 'visualstudiocode',
  'Blender': 'blender', 'Cinema 4D': 'maxon', 'Dovetail': 'dovetail',
  'Principle': 'principle',
}

function ToolIcon({ name }: { name: string }) {
  const [hover, setHover] = React.useState(false)
  const [imgError, setImgError] = React.useState(false)
  const slug = TOOL_ICONS[name]
  const iconColor = TOOL_ICON_COLORS[name] || '888'

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', width: 44, height: 44, borderRadius: 10, background: 'var(--px-surface-2)', border: '1px solid var(--px-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', transition: 'transform 0.15s', transform: hover ? 'translateY(-2px)' : 'none' }}>
      {slug && !imgError ? (
        <img
          src={`https://cdn.simpleicons.org/${slug}/${iconColor}`}
          alt={name}
          width={22}
          height={22}
          onError={() => setImgError(true)}
          style={{ display: 'block' }}
        />
      ) : (
        <div style={{ width: 22, height: 22, borderRadius: 4, background: TOOL_COLORS[name] || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{name[0]}</span>
        </div>
      )}
      {hover && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: '#1C1B18', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 5, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10 }}>
          {name}
        </div>
      )}
    </div>
  )
}

function ToolBadge({ name }: { name: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--px-surface-2)', borderRadius: 6, fontSize: 12, fontWeight: 600, color: 'var(--px-text)', border: '1px solid var(--px-border)' }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: TOOL_COLORS[name] || '#888', flexShrink: 0 }} />
      {name}
    </div>
  )
}

function ToolLogo({ name, size = 14 }: { name: string; size?: number }) {
  const [err, setErr] = React.useState(false)
  const slug = TOOL_ICONS[name]
  const iconColor = TOOL_ICON_COLORS[name] || '888'
  if (slug && !err) return <img src={`https://cdn.simpleicons.org/${slug}/${iconColor}`} alt="" width={size} height={size} onError={() => setErr(true)} style={{ display: 'block', flexShrink: 0 }} />
  return <div style={{ width: size, height: size, borderRadius: 3, background: TOOL_COLORS[name] || '#888', flexShrink: 0 }} />
}

function PickerChip({ name, selected, disabled, onToggle, showX }: { name: string; selected: boolean; disabled?: boolean; onToggle: () => void; showX?: boolean }) {
  return (
    <button onClick={onToggle}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', fontSize: 12, fontWeight: 500, borderRadius: 6, background: selected ? 'var(--px-accent-subtle)' : 'var(--px-surface-2)', border: `1px solid ${selected ? 'var(--px-accent)' : 'var(--px-border)'}`, color: selected ? 'var(--px-accent)' : disabled ? 'var(--px-text-3)' : 'var(--px-text)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, fontFamily: 'var(--px-font)', transition: 'all 0.12s' }}>
      <ToolLogo name={name} size={13} />
      {name}
      {showX && <span style={{ fontSize: 10, color: 'var(--px-text-3)', marginLeft: 2 }}>×</span>}
    </button>
  )
}

function ToolPickerModal({ open, onClose, selected, onSave }: {
  open: boolean; onClose: () => void
  selected: string[]; onSave: (tools: string[]) => void
}) {
  const [local, setLocal] = useState<string[]>(selected)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  React.useEffect(() => { if (open) { setLocal(selected); setSearch('') } }, [open, selected])

  const filtered = ALL_TOOLS.filter(t => t.toLowerCase().includes(search.toLowerCase()))
  const toggle = (t: string) => {
    if (local.includes(t)) setLocal(l => l.filter(x => x !== t))
    else if (local.length < 12) setLocal(l => [...l, t])
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(local)
    setSaving(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit tool stack" width={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ position: 'relative' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tools…"
            style={{ width: '100%', height: 38, padding: '0 12px', fontSize: 14, color: 'var(--px-text)', background: 'var(--px-surface-2)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r)', outline: 'none', fontFamily: 'var(--px-font)' }} autoFocus />
        </div>
        <p style={{ fontSize: 12, color: 'var(--px-text-3)', margin: 0 }}>Selected: {local.length}/12{local.length >= 12 && ' — Remove one to add another'}</p>
        {local.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, padding: '12px 14px', background: 'var(--px-surface-2)', borderRadius: 'var(--px-r)', border: '1px solid var(--px-border)' }}>
            {local.map(t => (
              <PickerChip key={t} name={t} selected onToggle={() => toggle(t)} showX />
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, maxHeight: 220, overflowY: 'auto' }}>
          {filtered.map(t => {
            const sel = local.includes(t)
            const disabled = !sel && local.length >= 12
            return <PickerChip key={t} name={t} selected={sel} disabled={disabled} onToggle={() => !disabled && toggle(t)} />
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid var(--px-border)' }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save tool stack'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

interface Props {
  tools: ToolStackItem[]
  onChange: (tools: ToolStackItem[]) => void
}

export function ToolStackSection({ tools, onChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  const handleSave = async (toolNames: string[]) => {
    const res = await fetch('/api/tools', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tools: toolNames }) })
    if (res.ok) onChange(await res.json())
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <SectionHead title="Tool Stack" action={<Btn variant="ghost" size="sm" icon="edit" onClick={() => setModalOpen(true)}>Edit</Btn>} />
      <div style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', padding: '18px 20px' }}>
        {tools.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--px-text-3)', cursor: 'pointer', margin: 0 }} onClick={() => setModalOpen(true)}>
            Add the tools you work with every day — up to 12.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {tools.map(t => <ToolIcon key={t.id} name={t.tool_name} />)}
            <button onClick={() => setModalOpen(true)} style={{ width: 44, height: 44, borderRadius: 10, background: 'transparent', border: '1px dashed var(--px-border)', color: 'var(--px-text-3)', cursor: 'pointer', fontFamily: 'var(--px-font)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit tools">+</button>
          </div>
        )}
      </div>
      <ToolPickerModal open={modalOpen} onClose={() => setModalOpen(false)} selected={tools.map(t => t.tool_name)} onSave={handleSave} />
    </div>
  )
}
