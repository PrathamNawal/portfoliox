'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    // Implicit flow: tokens are in the URL hash — getSession() parses them automatically
    supabase.auth.getSession().then(({ data: { session } }) => {
      router.replace(session ? '/dashboard' : '/sign-in')
    })
  }, [])

  return null
}
