import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/lib/supabase/with-auth'
import { generateSection, type GenerationSection } from '@/lib/ai/generate'
import { hashInputs } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuthContext()
    const { caseStudyId, section, problem, whatIDid, outcome } = await req.json()

    if (!section || !problem || !whatIDid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validSections: GenerationSection[] = ['intro', 'process', 'outcome']
    if (!validSections.includes(section)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
    }

    // Check credits for free users
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', userId).single()
    let creditBalance: number | null = null
    if (profile?.plan === 'free') {
      const { data: credits } = await supabase.from('ai_credits').select('credits_remaining').eq('user_id', userId).single()
      const remaining = credits?.credits_remaining ?? 10
      if (remaining <= 0) {
        return NextResponse.json({ error: 'No credits remaining', upgrade: true }, { status: 402 })
      }
      creditBalance = remaining
      await supabase.from('ai_credits').upsert({ user_id: userId, credits_remaining: remaining - 1, updated_at: new Date().toISOString() })
    }

    // Cache lookup
    const inputHash = hashInputs(problem, whatIDid, outcome || '', section)
    const { data: cached } = await supabase.from('ai_generation_cache').select('generated_text').eq('input_hash', inputHash).maybeSingle()

    if (cached?.generated_text) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          const chars = cached.generated_text.split('')
          let i = 0
          const interval = setInterval(() => {
            if (i >= chars.length) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
              clearInterval(interval)
              return
            }
            const batch = chars.slice(i, i + 4).join('')
            controller.enqueue(encoder.encode(`data: ${batch}\n\n`))
            i += 4
          }, 15)
        },
      })
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
    }

    // Generate
    let generationStream: ReadableStream<Uint8Array>
    try {
      generationStream = await generateSection(section, problem, whatIDid, outcome || '')
    } catch {
      // Refund the credit since generation never started
      if (creditBalance !== null) {
        await supabase.from('ai_credits').upsert({ user_id: userId, credits_remaining: creditBalance, updated_at: new Date().toISOString() })
      }
      return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
    }

    const encoder = new TextEncoder()
    let fullText = ''

    const sseStream = new ReadableStream({
      async start(controller) {
        const reader = generationStream.getReader()
        const decoder = new TextDecoder()
        let filerRetried = false

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value)
            fullText += chunk
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`))
          }

          if (fullText) {
            await supabase.from('ai_generation_cache').upsert({ input_hash: inputHash, section_type: section, generated_text: fullText })
            if (caseStudyId) {
              const { data: cs } = await supabase.from('case_studies').select('ai_generated').eq('id', caseStudyId).single()
              await supabase.from('case_studies').update({ ai_generated: { ...(cs?.ai_generated || {}), [section]: fullText } }).eq('id', caseStudyId)
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err: unknown) {
          // Refund credit if stream failed before producing output
          if (creditBalance !== null && !fullText) {
            await supabase.from('ai_credits').upsert({ user_id: userId, credits_remaining: creditBalance, updated_at: new Date().toISOString() })
          }
          if (err instanceof Error && err.message === 'FILLER_OPENER') {
            controller.enqueue(encoder.encode('data: [FILLER]\n\n'))
          } else {
            controller.enqueue(encoder.encode('data: [ERROR]\n\n'))
          }
          controller.close()
        }
      },
    })

    return new Response(sseStream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
