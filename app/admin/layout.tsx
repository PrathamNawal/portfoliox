import { redirect } from 'next/navigation'
import { stackServerApp } from '@/lib/stack'
import { createClient } from '@supabase/supabase-js'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await stackServerApp.getUser({ or: 'redirect' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Non-admin: redirect silently to dashboard, no error exposed
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return <>{children}</>
}
