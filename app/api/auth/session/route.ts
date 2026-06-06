import { NextRequest, NextResponse } from 'next/server'

// After Firebase signs in on the client, it calls this route with the
// ID token. We verify it by calling Google's tokeninfo endpoint (no
// Admin SDK needed) and set a simple httpOnly session cookie.
export async function POST(req: NextRequest) {
  const { idToken } = await req.json()
  if (!idToken) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  // Verify token with Google
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
  if (!res.ok) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const payload = await res.json()

  if (payload.aud !== process.env.NEXT_PUBLIC_FIREBASE_CLIENT_ID) {
    return NextResponse.json({ error: 'Token audience mismatch' }, { status: 401 })
  }

  const user = { uid: payload.sub, email: payload.email, name: payload.name }
  const sessionValue = Buffer.from(JSON.stringify(user)).toString('base64')

  const response = NextResponse.json({ ok: true })
  response.cookies.set('px_session', sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  return response
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('px_session')
  return res
}
