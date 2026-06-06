import { createClient } from '@supabase/supabase-js'
import { createClient as serverClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PreviewClient } from './PreviewClient'

export default async function PreviewPage() {
  const supabase = await serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const [{ data: profile }, { data: caseStudies }, { data: tools }, { data: testimonials }] = await Promise.all([
    db.from('profiles').select('*').eq('id', user.id).single(),
    db.from('case_studies').select('*').eq('user_id', user.id).order('display_order'),
    db.from('tool_stack').select('*').eq('user_id', user.id).order('display_order'),
    db.from('testimonials').select('*').eq('user_id', user.id).order('display_order'),
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
