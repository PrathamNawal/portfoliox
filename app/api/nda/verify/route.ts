import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const { caseStudyId, password } = await req.json()
  if (!caseStudyId || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch the case study — only select nda fields, no content
  const { data, error } = await supabase
    .from('case_studies')
    .select('nda_enabled, nda_password_hash')
    .eq('id', caseStudyId)
    .single()

  if (error || !data || !data.nda_enabled || !data.nda_password_hash) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const valid = await bcrypt.compare(password, data.nda_password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  // Create 24h session
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await supabase.from('nda_sessions').insert({
    case_study_id: caseStudyId,
    session_token: token,
    expires_at: expires.toISOString(),
  })

  const res = NextResponse.json({ success: true })
  res.cookies.set(`nda_session_${caseStudyId}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires,
    path: '/',
  })
  return res
}
