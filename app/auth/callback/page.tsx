'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type State = { status: 'loading' | 'done' | 'error'; msg: string }

export default function AuthCallback() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<State>({ status: 'loading', msg: 'Checking URL…' })

  useEffect(() => {
    const supabase = createClient()
    const code = searchParams.get('code')

    setState({ status: 'loading', msg: `code in URL: ${code ? code.slice(0, 8) + '…' : 'NONE'}` })

    if (!code) {
      setState({ status: 'error', msg: 'No ?code= in URL. Cannot exchange.' })
      return
    }

    setState(s => ({ ...s, msg: s.msg + ' → calling exchangeCodeForSession…' }))

    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (error) {
        setState({ status: 'error', msg: `EXCHANGE ERROR: ${error.message} | code: ${error.status}` })
        return
      }
      if (!data.session) {
        setState({ status: 'error', msg: 'Exchange returned no error but session is null' })
        return
      }
      setState({ status: 'done', msg: `Session OK — user: ${data.session.user.email}. Navigating…` })
      setTimeout(() => { window.location.href = '/dashboard' }, 1500)
    })
  }, [])

  const bg = state.status === 'error' ? '#fff0f0' : '#f5f5f0'
  const color = state.status === 'error' ? '#c00' : '#333'

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: bg }}>
      <div style={{ maxWidth: 520, padding: 32, fontFamily: 'monospace', fontSize: 13, color, lineHeight: 1.7, background: '#fff', border: '1px solid #ddd', borderRadius: 8 }}>
        <strong>Auth Callback Diagnostics</strong><br /><br />
        {state.msg}
      </div>
    </div>
  )
}
