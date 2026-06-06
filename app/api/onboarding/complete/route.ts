import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/lib/stack'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const user = await stackServerApp.getUser({ or: 'return-null' })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, bio, discipline, skills, layout, avatar_url } = body

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const supabase = serviceClient()

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    name: name.trim().slice(0, 60),
    email: user.primaryEmail || null,
    bio: (bio || '').slice(0, 200) || null,
    avatar_url: avatar_url || null,
    discipline: discipline || null,
    skills: (skills || []).slice(0, 8),
    layout: layout || 'canvas',
    social_links: {},
    onboarding_complete: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Seed AI credits on first signup
  await supabase.from('ai_credits').upsert({
    user_id: user.id,
    credits_remaining: 10,
    updated_at: new Date().toISOString(),
  })

  // Seed admin role if this is the configured admin email or has a pending invite
  if (ADMIN_EMAIL && user.primaryEmail === ADMIN_EMAIL) {
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)
  } else if (user.primaryEmail) {
    const { data: invite } = await supabase
      .from('admin_invites')
      .select('id')
      .eq('email', user.primaryEmail)
      .eq('accepted', false)
      .maybeSingle()
    if (invite) {
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)
      await supabase.from('admin_invites').update({ accepted: true }).eq('id', invite.id)
    }
  }

  return NextResponse.json({ ok: true })
}
