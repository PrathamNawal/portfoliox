import { stackServerApp } from '@/lib/stack'
import { createClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

function makeClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function requireAuthContext(): Promise<{ userId: string; supabase: SupabaseClient }> {
  const user = await stackServerApp.getUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return { userId: user.id, supabase: makeClient() }
}
