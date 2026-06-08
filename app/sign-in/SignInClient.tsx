'use client'

import React, { useState, useEffect } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { getFirebaseAuth, getGoogleProvider } from '@/lib/firebase/client'

// ── Auth states ───────────────────────────────────────────────────────────────
type Step = 'idle' | 'opening' | 'completing' | 'error'

const OPENING_MESSAGES = [
  'Opening Google sign-in…',
  'Choose your Google account…',
  'Waiting for you…',
]

// ── Google icon ───────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

// ── Transition in-progress screen ────────────────────────────────────────────
function TransitionScreen({ step, error, onRetry, onCancel }: {
  step: Exclude<Step, 'idle'>
  error: string | null
  onRetry: () => void
  onCancel: () => void
}) {
  const [subMsg, setSubMsg] = useState(0)
  useEffect(() => {
    if (step !== 'opening') return
    const iv = setInterval(() => setSubMsg(m => (m + 1) % OPENING_MESSAGES.length), 2000)
    return () => clearInterval(iv)
  }, [step])

  const primaryText = step === 'error'
    ? (error || 'Something went wrong')
    : step === 'opening'
      ? OPENING_MESSAGES[subMsg]
      : 'Setting up your workspace…'

  return (
    <div className="px-auth-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#0D0D0B',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 50% 45% at 50% 50%, rgba(229,52,22,0.13) 0%, transparent 70%)',
      }} />

      {/* Logo + sonar */}
      <div className="px-auth-logo" style={{ position: 'relative', width: 80, height: 80, marginBottom: 36 }}>
        {step !== 'error' && [0, 750, 1500].map((delay, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 56, height: 56, borderRadius: '50%',
            border: '1.5px solid rgba(229,52,22,0.5)',
            marginTop: -28, marginLeft: -28,
            animation: `px-sonar 2.25s ease-out ${delay}ms infinite`,
          }} />
        ))}
        {step === 'error' && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 64, height: 64, borderRadius: '50%',
            border: '1.5px solid rgba(255,255,255,0.08)',
            marginTop: -32, marginLeft: -32,
          }} />
        )}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 48, height: 48, borderRadius: 13,
          background: step === 'error'
            ? 'rgba(255,255,255,0.06)'
            : 'linear-gradient(135deg,#E53416 0%,#FF6B4A 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: -24, marginLeft: -24,
          boxShadow: step === 'error' ? 'none' : '0 0 40px rgba(229,52,22,0.35)',
        }}>
          <span style={{ fontSize: 22, lineHeight: 1, filter: step === 'error' ? 'opacity(0.3)' : 'none' }}>✦</span>
        </div>
      </div>

      {/* Status */}
      <div key={primaryText} className="px-auth-status" style={{ textAlign: 'center' }}>
        <p style={{
          fontSize: 16, fontWeight: 500,
          color: step === 'error' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.65)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          margin: '0 0 6px', letterSpacing: '-0.01em',
        }}>
          {primaryText}
        </p>
        {step === 'opening' && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
            A Google popup has opened — choose your account there
          </p>
        )}
      </div>

      {/* Error actions */}
      {step === 'error' && (
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          <button onClick={onRetry} style={{
            height: 40, padding: '0 20px', borderRadius: 8,
            background: '#E53416', color: '#fff',
            border: 'none', fontSize: 13, fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer',
          }}>
            Try again
          </button>
          <button onClick={onCancel} style={{
            height: 40, padding: '0 20px', borderRadius: 8,
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer',
          }}>
            Go back
          </button>
        </div>
      )}

      {step === 'opening' && (
        <button onClick={onCancel} style={{
          position: 'absolute', bottom: 32,
          background: 'none', border: 'none', fontSize: 12,
          color: 'rgba(255,255,255,0.18)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          cursor: 'pointer', padding: '6px 12px',
        }}>
          Cancel
        </button>
      )}
    </div>
  )
}

// ── Main sign-in screen ───────────────────────────────────────────────────────
export function SignInClient() {
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleGoogle = async () => {
    setStep('opening')
    setError(null)
    try {
      const result = await signInWithPopup(getFirebaseAuth(), getGoogleProvider())
      const credential = GoogleAuthProvider.credentialFromResult(result)
      if (!credential?.idToken) throw new Error('No credential returned')

      setStep('completing')

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credential.idToken }),
      })
      if (!res.ok) throw new Error('Session creation failed')

      await new Promise(r => setTimeout(r, 900))
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed'
      if (msg.includes('popup-closed') || msg.includes('cancelled')) {
        setStep('idle')
      } else {
        setError(msg)
        setStep('error')
      }
    }
  }

  return (
    <>
      {/* Transition screen — shown during/after Google popup */}
      {step !== 'idle' && (
        <TransitionScreen
          step={step}
          error={error}
          onRetry={handleGoogle}
          onCancel={() => setStep('idle')}
        />
      )}

      {/* Idle: beautiful full-screen sign-in prompt */}
      <div style={{
        minHeight: '100vh',
        background: '#0D0D0B',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px,5vw,48px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(229,52,22,0.1) 0%, transparent 70%)',
        }} />

        {/* Dot texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.3,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        {/* Content */}
        <div className="px-fadein" style={{ position: 'relative', textAlign: 'center', maxWidth: 420 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 52 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'linear-gradient(135deg,#E53416,#FF6B4A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 28px rgba(229,52,22,0.35)',
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>✦</span>
            </div>
            <span style={{
              fontSize: 18, fontWeight: 800, letterSpacing: '-0.04em',
              color: '#F0EEE9', fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              PortfolioX
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(32px,5vw,48px)',
            fontWeight: 400,
            letterSpacing: '-0.03em',
            color: '#F0EEE9',
            margin: '0 0 14px',
            lineHeight: 1.1,
          }}>
            Your portfolio,<br />one click away.
          </h1>

          <p style={{
            fontSize: 16, lineHeight: 1.65,
            color: 'rgba(255,255,255,0.4)',
            margin: '0 0 44px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            Sign in with Google to build and publish your designer portfolio.
          </p>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              height: 52, padding: '0 24px',
              background: 'rgba(255,255,255,0.95)',
              border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700,
              color: '#1C1B18',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: 'pointer',
              transition: 'background 0.15s, transform 0.15s',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.95)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p style={{
            marginTop: 20, fontSize: 12,
            color: 'rgba(255,255,255,0.2)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            lineHeight: 1.5,
          }}>
            New here? Signing in creates your account automatically.
          </p>
        </div>
      </div>
    </>
  )
}
