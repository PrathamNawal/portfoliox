import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { userId, supabase } = await requireAuthContext()
    const body = await req.json()
    const allowed = ['name', 'title_and_company', 'linkedin_url', 'quote', 'photo_url', 'display_order']
    const update: Record<string, unknown> = {}
    for (const k of allowed) if (k in body) update[k] = body[k]

    if (update.quote && (String(update.quote).length < 20 || String(update.quote).length > 300)) return NextResponse.json({ error: 'Quote must be 20–300 characters' }, { status: 400 })

    const { data, error } = await supabase.from('testimonials').update(update).eq('id', id).eq('user_id', userId).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { userId, supabase } = await requireAuthContext()
    const { error } = await supabase.from('testimonials').delete().eq('id', id).eq('user_id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return new NextResponse(null, { status: 204 })
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}
