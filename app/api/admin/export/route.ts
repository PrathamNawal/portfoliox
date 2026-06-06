import { requireAuthContext } from '@/lib/supabase/with-auth'

async function assertAdmin() {
  const ctx = await requireAuthContext()
  const { data } = await ctx.supabase.from('profiles').select('role').eq('id', ctx.userId).single()
  if (data?.role !== 'admin') throw new Error('FORBIDDEN')
  return ctx
}

export async function GET() {
  try {
    const { supabase } = await assertAdmin()

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email, created_at, plan')
      .order('created_at', { ascending: false })

    const { data: caseCounts } = await supabase.from('case_studies').select('user_id')
    const countMap: Record<string, number> = {}
    for (const row of caseCounts || []) {
      countMap[row.user_id] = (countMap[row.user_id] || 0) + 1
    }

    const rows = (profiles || []).map((p: { id: string; name: string; email: string | null; created_at: string; plan: string }) => [
      p.name,
      p.email || '',
      new Date(p.created_at).toISOString().slice(0, 10),
      countMap[p.id] || 0,
      p.plan,
    ])

    const csv = [
      ['Name', 'Email', 'Joined', 'Case Studies', 'Plan'],
      ...rows,
    ].map((row) => row.map((v: unknown) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="portfoliox-users-${Date.now()}.csv"`,
      },
    })
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }
}
