import { redirect } from 'next/navigation'
import { stackServerApp } from '@/lib/stack'

export default async function HomePage() {
  const user = await stackServerApp.getUser({ or: 'return-null' })

  if (user) {
    redirect('/dashboard')
  }

  redirect('/handler/sign-in')
}
