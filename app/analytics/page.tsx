import { createClient } from '@supabase/supabase-js'
import { createClient as serverClient } from '@/lib/supabase/server'
import { AnalyticsDashboard } from './AnalyticsDashboard'

export default async function AnalyticsPage() {
  const supabase = await serverClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: events }, { data: caseStudies }, { data: profile }] = await Promise.all([
    db.from('analytics_events').select('*').eq('user_id', user!.id).neq('event_type', 'preview').gte('recorded_at', since90d).order('recorded_at', { ascending: true }),
    db.from('case_studies').select('id, title, published').eq('user_id', user!.id),
    db.from('profiles').select('slug').eq('id', user!.id).single(),
  ])

  return (
    <AnalyticsDashboard
      events={events || []}
      caseStudies={caseStudies || []}
      slug={profile?.slug || null}
    />
  )
}
