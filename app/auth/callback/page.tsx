'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/Misc'

export default function AuthCallback() {
  const searchParams = useSearchParams()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const code = searchParams.get('code')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          // Show error — do NOT redirect so we can read the message
          setErrorMsg(`Exchange failed: ${error.message} (status: ${error.status})`)
        } else if (data.session) {
          window.location.href = '/dashboard'
        } else {
          setErrorMsg('No session returned after exchange')
        }
      })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) window.location.href = '/dashboard'
        else setErrorMsg('No code in URL and no existing session')
      })
    }
  }, [])

  if (errorMsg) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: 'var(--px-bg)', padding: 32 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#C94040', fontFamily: 'var(--px-font)' }}>Auth error (share this with developer):</p>
        <p style={{ fontSize: 13, color: 'var(--px-text-2)', fontFamily: 'monospace', background: 'var(--px-surface-2)', padding: '12px 16px', borderRadius: 8, maxWidth: 560, wordBreak: 'break-all' }}>{errorMsg}</p>
        <a href="/sign-in" style={{ fontSize: 13, color: 'var(--px-accent)', marginTop: 8 }}>Back to sign in</a>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--px-bg)' }}>
      <Spinner size={24} />
      <p style={{ fontSize: 14, color: 'var(--px-text-3)', fontFamily: 'var(--px-font)' }}>Signing you in…</p>
    </div>
  )
}
