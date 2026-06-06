'use client'

import React, { useState } from 'react'

interface Props {
  caseStudyId: string
  title: string
  onUnlocked: () => void
}

export function NDAGate({ caseStudyId, title, onUnlocked }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/nda/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseStudyId, password }),
      })
      if (res.ok) {
        onUnlocked()
      } else {
        setError('Incorrect password')
      }
    } catch {
      setError('Something went wrong — try again')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
        {/* Lock icon */}
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--px-surface-2)', border: '1px solid var(--px-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="var(--px-text-3)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
            <rect x="4" y="9.5" width="12" height="8.5" rx="2"/>
            <path d="M7.5 9.5V7a2.5 2.5 0 0 1 5 0v2.5"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--px-text)', marginBottom: 8 }}>{title}</h2>
        <p style={{ fontSize: 14, color: 'var(--px-text-3)', lineHeight: 1.6, marginBottom: 28 }}>
          This case study is NDA-protected. Enter the password to view.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            style={{ width: '100%', height: 44, padding: '0 16px', fontSize: 15, color: 'var(--px-text)', background: 'var(--px-surface)', border: `1.5px solid ${error ? '#C94040' : 'var(--px-border)'}`, borderRadius: 'var(--px-r)', outline: 'none', fontFamily: 'var(--px-font)', textAlign: 'center', letterSpacing: '0.1em', transition: 'border 0.12s' }}
            onFocus={e => !error && (e.target.style.borderColor = 'var(--px-accent)')}
            onBlur={e => !error && (e.target.style.borderColor = 'var(--px-border)')}
          />
          {error && <p style={{ fontSize: 13, color: '#C94040', margin: 0 }}>{error}</p>}
          <button type="submit" disabled={!password || checking}
            style={{ height: 44, fontSize: 14, fontWeight: 700, color: '#fff', background: password && !checking ? 'var(--px-accent)' : 'var(--px-surface-3)', border: 'none', borderRadius: 'var(--px-r)', cursor: password ? 'pointer' : 'not-allowed', fontFamily: 'var(--px-font)', transition: 'background 0.15s' }}>
            {checking ? 'Checking…' : 'Unlock case study'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: 'var(--px-text-3)', marginTop: 20 }}>Access is valid for 24 hours.</p>
      </div>
    </div>
  )
}
