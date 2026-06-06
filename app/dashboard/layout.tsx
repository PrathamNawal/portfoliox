import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/firebase/session'
import { createClient as serviceClient } from '@supabase/supabase-js'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  
  const user = await getSessionUser()
  if (!user) redirect('/sign-in')

  const db = serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: profile } = await db
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.uid)
    .maybeSingle()

  if (!profile || !profile.onboarding_complete) redirect('/onboarding')

  return <>{children}</>
}
