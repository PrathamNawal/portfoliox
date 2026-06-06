import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { userId, supabase } = await requireAuthContext()
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { userId, supabase } = await requireAuthContext()
    const body = await req.json()

    const allowed = ['title','problem','what_i_did','outcome_notes','cover_image_url',
      'blocks','section_labels','metadata','nda_enabled','nda_password_hash',
      'published','display_order','ai_generated']
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) update[key] = body[key]
    }

    const { data, error } = await supabase
      .from('case_studies')
      .update(update)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { userId, supabase } = await requireAuthContext()
    const { error } = await supabase
      .from('case_studies')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
