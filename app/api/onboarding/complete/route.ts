import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL

function db() {
  return serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, bio, discipline, skills, layout, avatar_url } = body

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const email = user.email || null
  const supa = db()

  const { error } = await supa.from('profiles').upsert({
    id: user.id,
    name: name.trim().slice(0, 60),
    email,
    bio: (bio || '').slice(0, 200) || null,
    avatar_url: avatar_url || null,
    discipline: discipline || null,
    skills: (skills || []).slice(0, 8),
    layout: layout || 'canvas',
    social_links: {},
    onboarding_complete: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supa.from('ai_credits').upsert({
    user_id: user.id,
    credits_remaining: 10,
    updated_at: new Date().toISOString(),
  })

  if (ADMIN_EMAIL && email === ADMIN_EMAIL) {
    await supa.from('profiles').update({ role: 'admin' }).eq('id', user.id)
  } else if (email) {
    const { data: invite } = await supa
      .from('admin_invites')
      .select('id')
      .eq('email', email)
      .eq('accepted', false)
      .maybeSingle()
    if (invite) {
      await supa.from('profiles').update({ role: 'admin' }).eq('id', user.id)
      await supa.from('admin_invites').update({ accepted: true }).eq('id', invite.id)
    }
  }

  return NextResponse.json({ ok: true })
}
