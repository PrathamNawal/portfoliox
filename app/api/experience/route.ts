import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'

export async function GET() {
  try {
    const { userId, supabase } = await requireAuthContext()
    const { data, error } = await supabase.from('work_experience').select('*').eq('user_id', userId).order('display_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuthContext()
    const { role, company, logo_url, start_month, end_month, is_current, description, discipline_tag, display_order } = await req.json()
    if (!role || !company || !start_month) return NextResponse.json({ error: 'Role, company and start month are required' }, { status: 400 })

    if (description && description.length > 4000) {
      return NextResponse.json({ error: 'Description is too long. Please shorten it.' }, { status: 400 })
    }

    const { data, error } = await supabase.from('work_experience').insert({
      user_id: userId, role, company, logo_url: logo_url || null,
      start_month, end_month: is_current ? null : end_month || null,
      is_current: !!is_current, description: description || null,
      discipline_tag: discipline_tag || null, display_order: display_order || 0,
    }).select().single()
    if (error) {
      const message = error.message.includes('work_experience_description_check')
        ? 'Description is too long. Please shorten it.'
        : error.message
      return NextResponse.json({ error: message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}
