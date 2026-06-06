import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/firebase/session'

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  
  const user = await getSessionUser()
  if (!user) redirect('/sign-in')
  return <>{children}</>
}
