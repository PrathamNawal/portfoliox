import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'
import { checkCaptureUrl, isProviderImageHost, pngSize } from '@/lib/screenshot'

// Free-tier screenshot services can take a while; give the function room to wait.
export const maxDuration = 30

const MAX_BYTES = 6 * 1024 * 1024
const BUCKET = 'case-study-images'

/** Each provider returns a PNG URL (or the PNG itself). Tried in order; the first good one wins. */
const PROVIDERS: { name: string; fetchImage: (target: string) => Promise<Response | null> }[] = [
  {
    name: 'thum.io',
    fetchImage: target => fetch(`https://image.thum.io/get/width/1280/crop/800/noanimate/${target}`, { signal: AbortSignal.timeout(20000), redirect: 'error' }),
  },
  {
    name: 'microlink',
    fetchImage: async target => {
      const api = `https://api.microlink.io/?url=${encodeURIComponent(target)}&screenshot=true&meta=false&viewport.width=1280&viewport.height=800&viewport.deviceScaleFactor=1&type=png`
      const meta = await fetch(api, { signal: AbortSignal.timeout(20000) })
      if (!meta.ok) return null
      const shot = (await meta.json())?.data?.screenshot?.url
      if (typeof shot !== 'string' || !isProviderImageHost(shot)) return null
      return fetch(shot, { signal: AbortSignal.timeout(15000), redirect: 'error' })
    },
  },
]

async function readPng(res: Response | null): Promise<{ bytes: Uint8Array; w: number; h: number } | null> {
  if (!res || !res.ok) return null
  const len = Number(res.headers.get('content-length') || 0)
  if (len > MAX_BYTES) return null
  const bytes = new Uint8Array(await res.arrayBuffer())
  if (bytes.length > MAX_BYTES) return null
  const size = pngSize(bytes)
  return size ? { bytes, ...size } : null
}

export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuthContext()
    const body = await req.json().catch(() => ({}))
    const checked = checkCaptureUrl(body?.url)
    if ('error' in checked) return NextResponse.json({ error: checked.error }, { status: 400 })

    let shot: { bytes: Uint8Array; w: number; h: number } | null = null
    for (const p of PROVIDERS) {
      try { shot = await readPng(await p.fetchImage(checked.url)) } catch { shot = null }
      if (shot) break
    }
    if (!shot) return NextResponse.json({ error: 'Could not capture that page. The free screenshot services may be busy; try again later or upload an image.' }, { status: 502 })

    const path = `${userId}/${Date.now()}-capture.png`
    const { error } = await supabase.storage.from(BUCKET).upload(path, shot.bytes, { contentType: 'image/png' })
    if (error) return NextResponse.json({ error: 'Could not save the screenshot' }, { status: 500 })
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl, w: shot.w, h: shot.h })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
