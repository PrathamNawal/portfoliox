'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/Misc'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // onAuthStateChange fires SIGNED_IN once the hash tokens are processed —
    // getSession() alone is too early and returns null before the hash is parsed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe()
        router.replace('/dashboard')
      }
    })

    // Fallback: if no SIGNED_IN within 6 seconds redirect to sign-in
    const timeout = setTimeout(() => {
      subscription.unsubscribe()
      router.replace('/sign-in')
    }, 6000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--px-bg)' }}>
      <Spinner size={24} />
      <p style={{ fontSize: 14, color: 'var(--px-text-3)', fontFamily: 'var(--px-font)' }}>Signing you in…</p>
    </div>
  )
}
