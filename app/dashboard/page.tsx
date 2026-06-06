import { createClient } from '@supabase/supabase-js'
import { stackServerApp } from '@/lib/stack'
import { BuilderClient } from './BuilderClient'

export default async function DashboardPage() {
  const user = await stackServerApp.getUser({ or: 'redirect' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [
    { data: profile },
    { data: caseStudies },
    { data: setting },
    { data: testimonials },
    { data: experience },
    { data: tools },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('case_studies').select('*').eq('user_id', user.id).order('display_order'),
    supabase.from('app_settings').select('value').eq('key', 'free_tier_case_study_limit').single(),
    supabase.from('testimonials').select('*').eq('user_id', user.id).order('display_order'),
    supabase.from('work_experience').select('*').eq('user_id', user.id).order('display_order'),
    supabase.from('tool_stack').select('*').eq('user_id', user.id).order('display_order'),
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
