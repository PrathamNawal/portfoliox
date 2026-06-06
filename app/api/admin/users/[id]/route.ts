import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: targetId } = await params
    const { userId, supabase } = await requireAuthContext()

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', userId).single()
    if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (userId === targetId) return NextResponse.json({ error: 'Cannot delete your own account from admin panel' }, { status: 400 })

    const { error } = await supabase.from('profiles').delete().eq('id', targetId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
