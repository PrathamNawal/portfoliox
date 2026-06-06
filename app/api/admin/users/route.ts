import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'

async function assertAdmin() {
  const ctx = await requireAuthContext()
  const { data } = await ctx.supabase.from('profiles').select('role').eq('id', ctx.userId).single()
  if (data?.role !== 'admin') throw new Error('FORBIDDEN')
  return ctx
}

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await assertAdmin()
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '0', 10)
    const perPage = 50
    const search = url.searchParams.get('search') || ''

    let query = supabase
      .from('profiles')
      .select('id, name, created_at, plan, role', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * perPage, (page + 1) * perPage - 1)

    if (search) query = query.ilike('name', `%${search}%`)

    const { data: profiles, count, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userIds = (profiles || []).map((p: any) => p.id)
    const { data: caseCounts } = await supabase.from('case_studies').select('user_id').in('user_id', userIds)

    const countMap: Record<string, number> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (caseCounts || []) as any[]) countMap[row.user_id] = (countMap[row.user_id] || 0) + 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = (profiles || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      joined: new Date(p.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }),
      cases: countMap[p.id] || 0,
      plan: p.plan,
      role: p.role,
    }))

    return NextResponse.json({ users, total: count, page, perPage })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'FORBIDDEN') return NextResponse.redirect(new URL('/dashboard', req.url))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
