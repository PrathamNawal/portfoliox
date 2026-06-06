import { redirect } from 'next/navigation'
import { stackServerApp } from '@/lib/stack'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await stackServerApp.getUser({ or: 'redirect' })

  // Already completed onboarding → go straight to builder
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.onboarding_complete) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
