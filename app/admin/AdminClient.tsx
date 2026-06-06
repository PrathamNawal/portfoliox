'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { portfolioUrl } from '@/lib/utils'
import { Btn } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PXLogo } from '@/components/ui/Misc'
import { Icon } from '@/components/ui/Icon'

interface User {
  id: string
  name: string
  email: string
  joined: string
  joinedRaw: string
  cases: number
  plan: 'free' | 'pro'
  role: 'user' | 'admin'
  slug: string | null
}

interface Props {
  initialUsers: User[]
  freeLimit: number
  stats: { total: number; new7d: number; new30d: number; pro: number }
  currentAdminId: string
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', padding: '18px 20px', flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--px-text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--px-text)', marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--px-text-3)' }}>{sub}</div>}
    </div>
  )
}

export function AdminClient({ initialUsers, freeLimit: initialLimit, stats, currentAdminId }: Props) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Free tier limit
  const [limitInput, setLimitInput] = useState(String(initialLimit))
  const [limitSaving, setLimitSaving] = useState(false)
  const [limitSaved, setLimitSaved] = useState(false)

  // Invite admin
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return users
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  }, [users, search])

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    setDeleting(id)
    setConfirmDelete(null)
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== id))
    }
    setDeleting(null)
  }

  const handleSaveLimit = async () => {
    const val = parseInt(limitInput, 10)
    if (isNaN(val) || val < 1 || val > 100) return
    setLimitSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'free_tier_case_study_limit', value: val }),
    })
    setLimitSaving(false)
    if (res.ok) { setLimitSaved(true); setTimeout(() => setLimitSaved(false), 2000) }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteMsg(null)
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim() }),
    })
    const data = await res.json()
    setInviting(false)
    if (res.ok) {
      const msgs: Record<string, string> = {
        already_admin: 'That user is already an admin.',
        promoted: 'User found and promoted to admin.',
        invited: "Invite stored — they'll get admin access on next sign-in.",
      }
      setInviteMsg({ type: 'ok', text: msgs[data.status] || 'Done.' })
      setInviteEmail('')
    } else {
      setInviteMsg({ type: 'err', text: data.error || 'Something went wrong.' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--px-bg)' }}>
      {/* Nav */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--px-border)', background: 'var(--px-surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <PXLogo size={22} />
          <div style={{ width: 1, height: 16, background: 'var(--px-border)' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--px-text)', letterSpacing: '-0.02em' }}>Admin</span>
        </div>
        <Btn variant="secondary" size="sm" icon="arrowLeft" onClick={() => router.push('/dashboard')}>Dashboard</Btn>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 80px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            <StatCard label="Total users" value={stats.total} />
            <StatCard label="New (7d)" value={stats.new7d} />
            <StatCard label="New (30d)" value={stats.new30d} />
            <StatCard label="Pro users" value={stats.pro} sub={`${stats.total > 0 ? Math.round((stats.pro / stats.total) * 100) : 0}% of total`} />
          </div>

          {/* Settings row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            {/* Free tier limit */}
            <div style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-xl)', padding: '20px 22px', flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--px-text)', marginBottom: 4 }}>Free tier case study limit</div>
              <div style={{ fontSize: 12, color: 'var(--px-text-3)', marginBottom: 14 }}>Applies to all free users on next creation attempt</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number" min={1} max={100} value={limitInput}
                  onChange={e => setLimitInput(e.target.value)}
                  style={{ width: 72, padding: '7px 10px', fontSize: 14, fontWeight: 700, border: '1px solid var(--px-border)', borderRadius: 'var(--px-r)', background: 'var(--px-bg)', color: 'var(--px-text)', fontFamily: 'var(--px-font)', outline: 'none' }}
                />
                <Btn variant="secondary" size="sm" onClick={handleSaveLimit} disabled={limitSaving}>
                  {limitSaved ? 'Saved!' : limitSaving ? 'Saving…' : 'Save'}
                </Btn>
              </div>
            </div>

            {/* Invite admin */}
            <div style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-xl)', padding: '20px 22px', flex: 1, minWidth: 300 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--px-text)', marginBottom: 4 }}>Invite admin</div>
              <div style={{ fontSize: 12, color: 'var(--px-text-3)', marginBottom: 14 }}>Existing users are promoted immediately. New users get access on sign-in.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email" placeholder="email@example.com" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  style={{ flex: 1, padding: '7px 10px', fontSize: 13, border: '1px solid var(--px-border)', borderRadius: 'var(--px-r)', background: 'var(--px-bg)', color: 'var(--px-text)', fontFamily: 'var(--px-font)', outline: 'none' }}
                />
                <Btn variant="primary" size="sm" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                  {inviting ? 'Sending…' : 'Invite'}
                </Btn>
              </div>
              {inviteMsg && (
                <div style={{ marginTop: 8, fontSize: 12, color: inviteMsg.type === 'ok' ? 'var(--px-success)' : 'var(--px-accent)', fontWeight: 500 }}>
                  {inviteMsg.text}
                </div>
              )}
            </div>
          </div>

          {/* User table */}
          <div style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-xl)', overflow: 'hidden' }}>
            {/* Table toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--px-border)', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
                <Icon name="search" size={14} color="var(--px-text-3)" />
                <input
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, color: 'var(--px-text)', fontFamily: 'var(--px-font)', outline: 'none' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--px-text-3)', display: 'flex' }}>
                    <Icon name="x" size={14} />
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--px-text-3)' }}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
                <a href="/api/admin/export" download style={{ textDecoration: 'none' }}>
                  <Btn variant="secondary" size="sm" icon="download">Export CSV</Btn>
                </a>
              </div>
            </div>

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 110px 70px 60px 80px 120px', padding: '8px 16px', background: 'var(--px-surface-2)', borderBottom: '1px solid var(--px-border)' }}>
              {['Name', 'Email', 'Joined', 'Cases', 'Plan', 'Role', ''].map(col => (
                <div key={col} style={{ fontSize: 11, fontWeight: 700, color: 'var(--px-text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{col}</div>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--px-text-3)', fontSize: 14 }}>
                {search ? 'No users match your search.' : 'No users yet.'}
              </div>
            ) : (
              filtered.map((u, i) => (
                <div key={u.id}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 110px 70px 60px 80px 120px', padding: '11px 16px', borderBottom: i < filtered.length - 1 ? '1px solid var(--px-border)' : 'none', alignItems: 'center', background: u.id === currentAdminId ? 'var(--px-accent-subtle)' : 'transparent', transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (u.id !== currentAdminId) (e.currentTarget as HTMLElement).style.background = 'var(--px-surface-2)' }}
                  onMouseLeave={e => { if (u.id !== currentAdminId) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                    {u.name}
                    {u.id === currentAdminId && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: 'var(--px-accent)', letterSpacing: '0.04em' }}>YOU</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--px-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                    {u.email || <span style={{ opacity: 0.4 }}>—</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--px-text-3)' }}>{u.joined}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)' }}>{u.cases}</div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: u.plan === 'pro' ? 'var(--px-accent)' : 'var(--px-surface-2)', color: u.plan === 'pro' ? '#fff' : 'var(--px-text-3)', border: u.plan === 'pro' ? 'none' : '1px solid var(--px-border)' }}>
                      {u.plan}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: u.role === 'admin' ? 'var(--px-surface-3)' : 'transparent', color: u.role === 'admin' ? 'var(--px-text)' : 'var(--px-text-3)', border: '1px solid var(--px-border)' }}>
                      {u.role}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {u.slug && (
                      <a href={portfolioUrl(u.slug!)} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', padding: '4px 6px', borderRadius: 'var(--px-r)', border: '1px solid var(--px-border)', background: 'var(--px-surface-2)', color: 'var(--px-text-3)', textDecoration: 'none', transition: 'all 0.1s' }}
                        title="View portfolio">
                        <Icon name="externalLink" size={12} />
                      </a>
                    )}
                    {u.id !== currentAdminId && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deleting === u.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 'var(--px-r)', border: `1px solid ${confirmDelete === u.id ? 'var(--px-accent)' : 'var(--px-border)'}`, background: confirmDelete === u.id ? 'var(--px-accent)' : 'var(--px-surface-2)', color: confirmDelete === u.id ? '#fff' : 'var(--px-text-3)', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'var(--px-font)', transition: 'all 0.15s' }}
                        title={confirmDelete === u.id ? 'Click again to confirm delete' : 'Delete account'}
                        onMouseLeave={() => { if (confirmDelete === u.id) setTimeout(() => setConfirmDelete(c => c === u.id ? null : c), 2500) }}
                      >
                        {deleting === u.id ? '…' : confirmDelete === u.id ? 'Confirm?' : <Icon name="trash" size={12} />}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
