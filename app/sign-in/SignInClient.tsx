'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PXLogo } from '@/components/ui/Misc'
import { Icon } from '@/components/ui/Icon'

function LeftPanel() {
  return (
    <div style={{
      width: 360, flexShrink: 0, background: '#0D0D0B',
      display: 'flex', flexDirection: 'column', padding: 40,
      position: 'relative', overflow: 'hidden',
    }}>
      <PXLogo light wordmark size={26} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#F0EEE9', lineHeight: 1.15, marginBottom: 16 }}>
          Your portfolio<br />starts with<br /><span style={{ color: '#E53416' }}>your work.</span>
        </div>
        <p style={{ fontSize: 14, color: '#56534D', lineHeight: 1.6, maxWidth: 240 }}>
          Upload visuals first. PortfolioX wraps the words around them.
        </p>
      </div>
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
      <div style={{ fontSize: 11, color: '#2A2926', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        For designers who let their work speak
      </div>
    </div>
  )
}

export function SignInClient() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const supabase = createClient()

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setSending(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="px-screen" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <LeftPanel />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--px-bg)', padding: '40px 48px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--px-success-subtle)', border: '1px solid var(--px-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Icon name="mail" size={22} color="var(--px-success)" />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--px-text)', marginBottom: 10 }}>Check your email</h1>
              <p style={{ fontSize: 14, color: 'var(--px-text-2)', lineHeight: 1.6, marginBottom: 28 }}>
                We sent a sign-in link to <strong>{email}</strong>.<br />Click it to continue — no password needed.
              </p>
              <button onClick={() => { setSent(false); setEmail('') }}
                style={{ fontSize: 13, color: 'var(--px-text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--px-font)', textDecoration: 'underline' }}>
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--px-text)', marginBottom: 6 }}>Welcome back</h1>
              <p style={{ fontSize: 14, color: 'var(--px-text-2)', marginBottom: 32 }}>Sign in or create your account.</p>

              <button onClick={handleGoogle} disabled={googleLoading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px 16px', fontSize: 14, fontWeight: 600, background: 'var(--px-surface)', border: '1.5px solid var(--px-border)', borderRadius: 'var(--px-r)', cursor: googleLoading ? 'not-allowed' : 'pointer', color: 'var(--px-text)', fontFamily: 'var(--px-font)', transition: 'background 0.15s', opacity: googleLoading ? 0.7 : 1 }}
                onMouseEnter={e => { if (!googleLoading) (e.currentTarget as HTMLElement).style.background = 'var(--px-surface-2)' }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--px-surface)'}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {googleLoading ? 'Redirecting…' : 'Continue with Google'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--px-border)' }} />
                <span style={{ fontSize: 12, color: 'var(--px-text-3)', fontWeight: 500 }}>or continue with email</span>
                <div style={{ flex: 1, height: 1, background: 'var(--px-border)' }} />
              </div>

              <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--px-text-2)', marginBottom: 6 }}>Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"
                    style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: `1.5px solid ${error ? 'var(--px-accent)' : 'var(--px-border)'}`, borderRadius: 'var(--px-r)', background: 'var(--px-surface)', color: 'var(--px-text)', fontFamily: 'var(--px-font)', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--px-accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = error ? 'var(--px-accent)' : 'var(--px-border)')} />
                  {error && <p style={{ fontSize: 12, color: 'var(--px-accent)', marginTop: 5 }}>{error}</p>}
                </div>
                <button type="submit" disabled={sending || !email.trim()}
                  style={{ width: '100%', padding: '11px 16px', fontSize: 14, fontWeight: 700, background: sending || !email.trim() ? 'var(--px-surface-2)' : 'var(--px-accent)', color: sending || !email.trim() ? 'var(--px-text-3)' : '#fff', border: 'none', borderRadius: 'var(--px-r)', cursor: sending || !email.trim() ? 'not-allowed' : 'pointer', fontFamily: 'var(--px-font)', transition: 'background 0.15s' }}>
                  {sending ? 'Sending link…' : 'Send sign-in link'}
                </button>
              </form>

              <p style={{ fontSize: 12, color: 'var(--px-text-3)', marginTop: 20, textAlign: 'center', lineHeight: 1.5 }}>
                New here? Signing in creates your account automatically.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
