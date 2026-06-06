import { redirect } from 'next/navigation'
import { stackServerApp } from '@/lib/stack'
import { createClient } from '@supabase/supabase-js'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await stackServerApp.getUser({ or: 'redirect' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  // First-time user — send to onboarding
  if (!profile || !profile.onboarding_complete) {
    redirect('/onboarding')
  }

  return <>{children}</>
}
