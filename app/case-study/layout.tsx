import { stackServerApp } from '@/lib/stack'

export default async function CaseStudyLayout({ children }: { children: React.ReactNode }) {
  // Just enforce auth — onboarding guard is on dashboard
  await stackServerApp.getUser({ or: 'redirect' })
  return <>{children}</>
}
