import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { userId, supabase } = await requireAuthContext()
    const body = await req.json()
    const allowed = ['role', 'company', 'logo_url', 'start_month', 'end_month', 'is_current', 'description', 'discipline_tag', 'display_order']
    const update: Record<string, unknown> = {}
    for (const k of allowed) if (k in body) update[k] = body[k]
    if (update.is_current) update.end_month = null
    if (typeof update.description === 'string' && update.description.length > 4000) {
      return NextResponse.json({ error: 'Description is too long. Please shorten it.' }, { status: 400 })
    }

    const { data, error } = await supabase.from('work_experience').update(update).eq('id', id).eq('user_id', userId).select().single()
    if (error) {
      const message = error.message.includes('work_experience_description_check')
        ? 'Description is too long. Please shorten it.'
        : error.message
      return NextResponse.json({ error: message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { userId, supabase } = await requireAuthContext()
    const { error } = await supabase.from('work_experience').delete().eq('id', id).eq('user_id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return new NextResponse(null, { status: 204 })
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}
