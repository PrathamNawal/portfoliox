import { createClient } from '@supabase/supabase-js'
import { stackServerApp } from '@/lib/stack'
import { AdminClient } from './AdminClient'

export default async function AdminPage() {
  const user = await stackServerApp.getUser({ or: 'redirect' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Fetch all profiles with case study counts
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, email, created_at, plan, role, slug')
    .order('created_at', { ascending: false })

  const { data: caseCountRows } = await supabase
    .from('case_studies')
    .select('user_id')

  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'free_tier_case_study_limit')
    .single()

  // Calculate per-user case study counts
  const countMap: Record<string, number> = {}
  for (const row of caseCountRows || []) {
    countMap[row.user_id] = (countMap[row.user_id] || 0) + 1
  }

  // 7-day and 30-day signup counts
  const now = Date.now()
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  const since30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
  const new7d = (profiles || []).filter(p => p.created_at >= since7d).length
  const new30d = (profiles || []).filter(p => p.created_at >= since30d).length

  const users = (profiles || []).map(p => ({
    id: p.id,
    name: p.name,
    email: p.email || '',
    joined: new Date(p.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }),
    joinedRaw: p.created_at,
    cases: countMap[p.id] || 0,
    plan: p.plan as 'free' | 'pro',
    role: p.role as 'user' | 'admin',
    slug: p.slug || null,
  }))

  return (
    <AdminClient
      initialUsers={users}
      freeLimit={parseInt(setting?.value || '6', 10)}
      stats={{ total: users.length, new7d, new30d, pro: users.filter(u => u.plan === 'pro').length }}
      currentAdminId={user.id}
    />
  )
}
