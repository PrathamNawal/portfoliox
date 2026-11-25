// Personal access tokens and the Figma token for the MCP server. Signed-in users only.
import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'
import { encryptSecret, generateToken } from '@/lib/mcp/auth'

const MAX_ACTIVE_TOKENS = 5

export async function GET() {
  try {
    const { userId, supabase } = await requireAuthContext()
    const [{ data: tokens }, { data: settings }] = await Promise.all([
      supabase.from('mcp_tokens').select('id, name, created_at, last_used_at').eq('user_id', userId).is('revoked_at', null).order('created_at', { ascending: false }),
      supabase.from('mcp_user_settings').select('figma_token_enc').eq('user_id', userId).maybeSingle(),
    ])
    return NextResponse.json({ tokens: tokens ?? [], figma_connected: !!settings?.figma_token_enc })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// Create a token. The plain token is returned once and only its hash is stored.
export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuthContext()
    const body = await req.json().catch(() => ({}))
    const name = String(body.name || 'MCP client').slice(0, 60)
    const { count } = await supabase.from('mcp_tokens').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('revoked_at', null)
    if ((count ?? 0) >= MAX_ACTIVE_TOKENS) return NextResponse.json({ error: `You can have ${MAX_ACTIVE_TOKENS} active tokens. Revoke one first.` }, { status: 400 })
    const { token, hash } = generateToken()
    const { data, error } = await supabase.from('mcp_tokens').insert({ user_id: userId, name, token_hash: hash }).select('id, name, created_at').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ...data, token }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// Save or remove the Figma personal access token (checked against Figma before saving).
export async function PUT(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuthContext()
    const { figma_token } = await req.json()
    if (!figma_token) {
      await supabase.from('mcp_user_settings').delete().eq('user_id', userId)
      return NextResponse.json({ figma_connected: false })
    }
    const check = await fetch('https://api.figma.com/v1/me', { headers: { 'X-Figma-Token': String(figma_token) } })
    if (!check.ok) return NextResponse.json({ error: 'Figma did not accept that token.' }, { status: 400 })
    const { error } = await supabase.from('mcp_user_settings').upsert({ user_id: userId, figma_token_enc: encryptSecret(String(figma_token)), updated_at: new Date().toISOString() })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ figma_connected: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuthContext()
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await supabase.from('mcp_tokens').update({ revoked_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId)
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
