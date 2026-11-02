import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'
import { isThemeId } from '@/lib/themes'
import { isMotionLevel } from '@/lib/motion'

export async function GET() {
  try {
    const { userId, supabase } = await requireAuthContext()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuthContext()
    const body = await req.json()
    const allowed = ['name','bio','avatar_url','discipline','skills','layout','theme','motion','scene','exp_story','exp_years','social_links','resume_url']
    if ('theme' in body && !isThemeId(body.theme)) {
      return NextResponse.json({ error: 'Unknown theme' }, { status: 400 })
    }
    if ('motion' in body && !isMotionLevel(body.motion)) {
      return NextResponse.json({ error: 'Unknown motion level' }, { status: 400 })
    }
    if ('scene' in body && typeof body.scene !== 'boolean') {
      return NextResponse.json({ error: 'scene must be true or false' }, { status: 400 })
    }
    if ('exp_story' in body && typeof body.exp_story !== 'boolean') {
      return NextResponse.json({ error: 'exp_story must be true or false' }, { status: 400 })
    }
    if ('exp_years' in body && typeof body.exp_years !== 'boolean') {
      return NextResponse.json({ error: 'exp_years must be true or false' }, { status: 400 })
    }
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) update[key] = body[key]
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', userId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
