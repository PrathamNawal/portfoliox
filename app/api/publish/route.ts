import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'
import { isValidSlug, normalizeSlug } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuthContext()
    const { slug } = await req.json()

    const { data: existing } = await supabase.from('profiles').select('slug').eq('id', userId).single()
    if (existing?.slug) {
      await supabase.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', userId)
      return NextResponse.json({ slug: existing.slug })
    }

    const normalized = normalizeSlug(slug)
    if (!isValidSlug(normalized)) return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 })

    const { data, error } = await supabase.from('profiles').update({ slug: normalized }).eq('id', userId).select('slug').single()
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ slug: data.slug })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
