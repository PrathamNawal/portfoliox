import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/firebase/session'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function HomePage() {
  const user = await getSessionUser()
  if (user) redirect('/dashboard')
  return <LandingPage />
}
