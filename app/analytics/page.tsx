import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/firebase/session'
import { AnalyticsDashboard } from './AnalyticsDashboard'

export default async function AnalyticsPage() {
  
  const user = await getSessionUser()

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: events }, { data: caseStudies }, { data: profile }] = await Promise.all([
    db.from('analytics_events').select('*').eq('user_id', user!.uid).neq('event_type', 'preview').gte('recorded_at', since90d).order('recorded_at', { ascending: true }),
    db.from('case_studies').select('id, title, published').eq('user_id', user!.uid),
    db.from('profiles').select('slug').eq('id', user!.uid).single(),
  ])

  return (
    <AnalyticsDashboard
      events={events || []}
      caseStudies={caseStudies || []}
      slug={profile?.slug || null}
    />
  )
}
