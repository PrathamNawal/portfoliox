import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'

async function assertAdmin() {
  const ctx = await requireAuthContext()
  const { data } = await ctx.supabase.from('profiles').select('role').eq('id', ctx.userId).single()
  if (data?.role !== 'admin') throw new Error('FORBIDDEN')
  return ctx
}

export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await assertAdmin()
    const { email } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const normalised = email.toLowerCase().trim()

    // If the user already exists, promote them directly
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', normalised)
      .maybeSingle()

    if (existing) {
      if (existing.role === 'admin') {
        return NextResponse.json({ status: 'already_admin' })
      }
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', existing.id)
      return NextResponse.json({ status: 'promoted' })
    }

    // Otherwise store a pending invite (applied on their next sign-up/onboarding)
    const { error } = await supabase
      .from('admin_invites')
      .upsert({ email: normalised, invited_by: userId, accepted: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ status: 'invited' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
