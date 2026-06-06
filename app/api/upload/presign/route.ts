import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'

export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuthContext()
    const { filename, contentType, bucket = 'case-study-images' } = await req.json()
    if (!filename || !contentType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const ext = filename.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`

    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path)
    if (error || !data) return NextResponse.json({ error: error?.message }, { status: 500 })

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
    return NextResponse.json({ url: data.signedUrl, path, publicUrl: urlData.publicUrl })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
