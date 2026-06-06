import { NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'

export async function GET() {
  try {
    const { userId, supabase } = await requireAuthContext()
    const { data } = await supabase
      .from('ai_credits')
      .select('credits_remaining')
      .eq('user_id', userId)
      .maybeSingle()
    return NextResponse.json({ credits_remaining: data?.credits_remaining ?? 10 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
