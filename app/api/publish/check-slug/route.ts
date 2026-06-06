import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidSlug, normalizeSlug } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || ''
  const normalized = normalizeSlug(slug)

  if (!isValidSlug(normalized)) {
    return NextResponse.json({ available: false, reason: 'invalid_format' })
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('slug', normalized)
    .maybeSingle()

  return NextResponse.json({ available: !data, slug: normalized })
}
