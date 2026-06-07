import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'
import { makeSectionsForDiscipline, makeDefaultOverview } from '@/lib/case-study-templates'
import { DISCIPLINE_SAMPLES } from '@/lib/case-study-samples'
import type { CaseDiscipline } from '@/types'

export async function GET() {
  try {
    const { userId, supabase } = await requireAuthContext()
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuthContext()

    // Get free tier limit
    const { data: setting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'free_tier_case_study_limit')
      .single()
    const limit = parseInt(setting?.value || '6', 10)

    // Get user plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single()

    if (profile?.plan === 'free') {
      const { count } = await supabase
        .from('case_studies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if ((count ?? 0) >= limit) {
        return NextResponse.json({ error: 'Free tier limit reached', upgrade: true }, { status: 403 })
      }
    }

    const body = await req.json()
    const discipline: CaseDiscipline = body.discipline || 'ux'
    const withSample: boolean = body.withSample === true

    let sections, overview_data, title, cover_image_url
    if (withSample && discipline !== 'custom') {
      const sample = DISCIPLINE_SAMPLES[discipline]
      sections = sample.sections
      overview_data = sample.overviewData
      cover_image_url = sample.coverUrl || null
      title = sample.overviewData.summary.split('—')[0].trim().slice(0, 80)
    } else {
      sections = makeSectionsForDiscipline(discipline)
      overview_data = makeDefaultOverview()
      cover_image_url = null
      title = body.title || 'Untitled'
    }

    const { data, error } = await supabase
      .from('case_studies')
      .insert({
        user_id: userId,
        title,
        discipline,
        sections,
        overview_data,
        cover_image_url,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
