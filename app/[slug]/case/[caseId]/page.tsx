import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import { CaseStudyPageClient } from './CaseStudyPageClient'

// Never cache case study pages — data changes in real time (edits, publish toggles, NDA state)
export const revalidate = 0
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string; caseId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, caseId } = await params
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: profile } = await supabase.from('profiles').select('id, name').eq('slug', slug).single()
  if (!profile) return { title: 'Not found' }

  const { data: cs } = await supabase.from('case_studies').select('title, nda_enabled').eq('id', caseId).eq('user_id', profile.id).single()
  if (!cs) return { title: 'Not found' }
  if (cs.nda_enabled) return { title: cs.title, robots: { index: false } }

  return { title: `${cs.title} — ${profile.name}` }
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug, caseId } = await params
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: profile } = await supabase.from('profiles').select('*').eq('slug', slug).single()
  if (!profile) notFound()

  const { data: cs } = await supabase
    .from('case_studies')
    .select('*')
    .eq('id', caseId)
    .eq('user_id', profile.id)
    .eq('published', true)
    .single()

  if (!cs) notFound()

  // ── NDA check ────────────────────────────────────────────────────────────────
  let ndaUnlocked = false
  if (cs.nda_enabled) {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(`nda_session_${caseId}`)?.value

    if (sessionToken) {
      const { data: session } = await supabase
        .from('nda_sessions')
        .select('expires_at')
        .eq('case_study_id', caseId)
        .eq('session_token', sessionToken)
        .single()

      if (session && new Date(session.expires_at) > new Date()) {
        ndaUnlocked = true
      }
    }
    // NOT unlocked: pass cs without content — NDAGate will show password prompt
  }

  // Strip content from locked case studies — nothing in HTML source
  const safeCs = (cs.nda_enabled && !ndaUnlocked)
    ? { ...cs, blocks: [], ai_generated: {}, cover_image_url: null, problem: null, what_i_did: null, outcome_notes: null }
    : cs

  return (
    <CaseStudyPageClient
      profile={profile}
      caseStudy={safeCs}
      ndaLocked={cs.nda_enabled && !ndaUnlocked}
      slug={slug}
    />
  )
}
