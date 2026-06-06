import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'

async function assertAdmin() {
  const ctx = await requireAuthContext()
  const { data } = await ctx.supabase.from('profiles').select('role').eq('id', ctx.userId).single()
  if (data?.role !== 'admin') throw new Error('FORBIDDEN')
  return ctx
}

export async function PUT(req: NextRequest) {
  try {
    const { supabase } = await assertAdmin()
    const { key, value } = await req.json()
    if (!key || value === undefined) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value: String(value), updated_at: new Date().toISOString() })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
