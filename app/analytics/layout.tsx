import { stackServerApp } from '@/lib/stack'

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  await stackServerApp.getUser({ or: 'redirect' })
  return <>{children}</>
}
