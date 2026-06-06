import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { anonymousFingerprint } from '@/lib/utils'
import { requireAuthContext } from '@/lib/supabase/with-auth'

function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''
  let body: Record<string, unknown>
  try {
    const text = await req.text()
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { userId, caseStudyId, eventType, timeOnPage } = body as Record<string, string | number>
  if (!userId || !eventType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = serviceClient()

  // Validate userId belongs to a published portfolio — prevents analytics pollution attacks
  const { data: pub } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', String(userId))
    .not('slug', 'is', null)
    .maybeSingle()
  if (!pub) return NextResponse.json({ ok: true }) // silently ignore invalid targets

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '0.0.0.0'
  const ua = req.headers.get('user-agent') || ''
  const fingerprint = anonymousFingerprint(ip, ua)

  await supabase.from('analytics_events').insert({
    user_id: String(userId),
    case_study_id: caseStudyId ? String(caseStudyId) : null,
    event_type: String(eventType),
    visitor_fingerprint: fingerprint,
    time_on_page_seconds: timeOnPage ? Number(timeOnPage) : null,
  })

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuthContext()
    const url = new URL(req.url)
    const range = url.searchParams.get('range') || '30d'
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .neq('event_type', 'preview')
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: false })

    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
