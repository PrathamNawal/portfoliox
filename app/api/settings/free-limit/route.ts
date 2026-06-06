import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'free_tier_case_study_limit')
    .single()

  return NextResponse.json({ limit: parseInt(data?.value || '6', 10) })
}
