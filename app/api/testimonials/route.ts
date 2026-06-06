import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'

export async function GET() {
  try {
    const { userId, supabase } = await requireAuthContext()
    const { data, error } = await supabase.from('testimonials').select('*').eq('user_id', userId).order('display_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuthContext()
    const body = await req.json()
    const { name, title_and_company, linkedin_url, quote, photo_url, display_order } = body

    if (!name || !title_and_company || !quote) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    if (quote.length < 20 || quote.length > 300) return NextResponse.json({ error: 'Quote must be 20–300 characters' }, { status: 400 })
    if (linkedin_url && !linkedin_url.includes('linkedin.com/in/')) return NextResponse.json({ error: 'LinkedIn URL must be a linkedin.com/in/ URL' }, { status: 400 })

    const { data, error } = await supabase.from('testimonials').insert({ user_id: userId, name, title_and_company, linkedin_url: linkedin_url || null, quote, photo_url: photo_url || null, display_order: display_order || 0 }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}
