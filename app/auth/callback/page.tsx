'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/Misc'

export default function AuthCallback() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    const code = searchParams.get('code')

    if (code) {
      // PKCE flow: exchange the code. Hard-navigate so middleware gets fresh cookies.
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        window.location.href = error ? '/sign-in' : '/dashboard'
      })
    } else {
      // Fallback: check for an existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        window.location.href = session ? '/dashboard' : '/sign-in'
      })
    }
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--px-bg)' }}>
      <Spinner size={24} />
      <p style={{ fontSize: 14, color: 'var(--px-text-3)', fontFamily: 'var(--px-font)' }}>Signing you in…</p>
    </div>
  )
}
