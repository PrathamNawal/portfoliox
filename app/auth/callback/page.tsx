'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    const code = searchParams.get('code')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        router.replace(error ? '/sign-in' : '/dashboard')
      })
    } else {
      // Implicit flow — session already in hash, just check it
      supabase.auth.getSession().then(({ data: { session } }) => {
        router.replace(session ? '/dashboard' : '/sign-in')
      })
    }
  }, [])

  return null
}
