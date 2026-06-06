import { createClient } from '@supabase/supabase-js'
import { stackServerApp } from '@/lib/stack'
import { redirect } from 'next/navigation'
import { PreviewClient } from './PreviewClient'

export default async function PreviewPage() {
  const user = await stackServerApp.getUser({ or: 'redirect' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [{ data: profile }, { data: caseStudies }, { data: tools }, { data: testimonials }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('case_studies').select('*').eq('user_id', user.id).order('display_order'),
    supabase.from('tool_stack').select('*').eq('user_id', user.id).order('display_order'),
    supabase.from('testimonials').select('*').eq('user_id', user.id).order('display_order'),
  ])

  if (!profile) redirect('/onboarding')

  return (
    <PreviewClient
      profile={profile}
      caseStudies={caseStudies || []}
      tools={tools || []}
      testimonials={testimonials || []}
    />
  )
}
