import { notFound } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { CanvasLayout } from '@/components/published/CanvasLayout'
import { SpotlightLayout } from '@/components/published/SpotlightLayout'
import type { Metadata } from 'next'

// Plain anon client — no cookie/auth handling needed for public portfolio pages
function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

interface Props {
  params: Promise<{ slug: string }>
}

// PGRST116 = PostgREST "no rows found" — a true 404.
// Any other error code = DB/config problem — should be a 500, not a silent 404.
function assertNoDbError(error: { code?: string; message?: string } | null, context: string) {
  if (!error) return
  if (error.code === 'PGRST116') return // genuine not-found, let caller handle
  throw new Error(
    `[portfolio] DB error in ${context}: ${error.message ?? error.code}\n` +
    `Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.`
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createPublicClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('name, bio')
    .eq('slug', slug)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[generateMetadata] DB error:', error)
  }
  if (!profile) return { title: 'Portfolio not found' }

  return {
    title: `${profile.name} — Portfolio`,
    description: profile.bio || `${profile.name}'s design portfolio`,
  }
}

export default async function PublishedPortfolio({ params }: Props) {
  const { slug } = await params
  const supabase = createPublicClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, bio, avatar_url, discipline, skills, layout, slug, plan, role, social_links, resume_url, onboarding_complete, created_at, updated_at')
    .eq('slug', slug)
    .single()

  // Throws 500 (with Vercel log) on DB/config errors; 404 only on genuine missing slug
  assertNoDbError(profileError, 'profiles')
  if (!profile) notFound()

  const [
    { data: caseStudies, error: csError },
    { data: testimonials },
    { data: experience },
    { data: tools },
  ] = await Promise.all([
    supabase
      .from('case_studies')
      .select('id, title, cover_image_url, nda_enabled, blocks, metadata, sections, discipline, overview_data')
      .eq('user_id', profile.id)
      .eq('published', true)
      .order('display_order', { ascending: true }),
    supabase.from('testimonials').select('*').eq('user_id', profile.id).order('display_order'),
    supabase.from('work_experience').select('*').eq('user_id', profile.id).order('display_order'),
    supabase.from('tool_stack').select('*').eq('user_id', profile.id).order('display_order'),
  ])

  if (csError) console.error('[portfolio] case_studies error:', csError)

  const props = {
    profile,
    caseStudies: caseStudies || [],
    testimonials: testimonials || [],
    experience: experience || [],
    tools: tools || [],
  }

  if (profile.layout === 'spotlight') return <SpotlightLayout {...props} />
  return <CanvasLayout {...props} />
}
