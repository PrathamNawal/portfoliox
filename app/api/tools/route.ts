import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'

export async function GET() {
  try {
    const { userId, supabase } = await requireAuthContext()
    const { data, error } = await supabase.from('tool_stack').select('*').eq('user_id', userId).order('display_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}

// Replace all tools for this user
export async function PUT(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuthContext()
    const { tools } = await req.json() as { tools: string[] }

    if (!Array.isArray(tools)) return NextResponse.json({ error: 'tools must be an array' }, { status: 400 })
    if (tools.length > 12) return NextResponse.json({ error: 'Maximum 12 tools allowed' }, { status: 400 })

    // Delete existing and re-insert
    await supabase.from('tool_stack').delete().eq('user_id', userId)
    if (tools.length > 0) {
      await supabase.from('tool_stack').insert(
        tools.map((tool_name, idx) => ({ user_id: userId, tool_name, display_order: idx }))
      )
    }

    const { data } = await supabase.from('tool_stack').select('*').eq('user_id', userId).order('display_order')
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}
