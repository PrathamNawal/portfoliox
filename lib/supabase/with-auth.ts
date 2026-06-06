import { getSessionUser } from '@/lib/firebase/session'
import { createClient as serviceClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

function makeServiceClient(): SupabaseClient {
  return serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function requireAuthContext(): Promise<{ userId: string; supabase: SupabaseClient }> {
  const user = await getSessionUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return { userId: user.uid, supabase: makeServiceClient() }
}
