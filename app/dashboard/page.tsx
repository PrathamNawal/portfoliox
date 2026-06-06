import { createClient } from '@supabase/supabase-js'
import { createClient as serverClient } from '@/lib/supabase/server'
import { BuilderClient } from './BuilderClient'

export default async function DashboardPage() {
  const supabase = await serverClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const [{ data: profile }, { data: caseStudies }, { data: setting }, { data: testimonials }, { data: experience }, { data: tools }] = await Promise.all([
    db.from('profiles').select('*').eq('id', user!.id).single(),
    db.from('case_studies').select('*').eq('user_id', user!.id).order('display_order'),
    db.from('app_settings').select('value').eq('key', 'free_tier_case_study_limit').single(),
    db.from('testimonials').select('*').eq('user_id', user!.id).order('display_order'),
    db.from('work_experience').select('*').eq('user_id', user!.id).order('display_order'),
    db.from('tool_stack').select('*').eq('user_id', user!.id).order('display_order'),
  ])

  return (
    <BuilderClient
      initialProfile={profile}
      initialCaseStudies={caseStudies || []}
      initialTestimonials={testimonials || []}
      initialExperience={experience || []}
      initialTools={tools || []}
      freeLimit={parseInt(setting?.value || '6', 10)}
    />
  )
}
