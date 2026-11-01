import { notFound } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { CanvasLayout } from '@/components/published/CanvasLayout'
import { SpotlightLayout } from '@/components/published/SpotlightLayout'
import { resolveTheme } from '@/lib/themes'
import { resolveCoverFit } from '@/lib/cover'
import { resolveMotion } from '@/lib/motion'
import type { Metadata } from 'next'
import { sortExperience } from '@/lib/experience'

// Never cache portfolio pages — data changes in real time (RLS, publish toggles, layout switches)
export const revalidate = 0
export const dynamic = 'force-dynamic'

// Plain anon client — passes cache:'no-store' so Next.js Data Cache never
// holds stale empty arrays from before RLS policies were in place
function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
          fetch(url, { ...options, cache: 'no-store' }),
      },
    }
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
    themeRes,
    fitRes,
    motionRes,
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
    // Separate, error-tolerant query: before the profile_theme migration runs the column
    // does not exist, and that must fall back to the default theme, not take the page down.
    supabase.from('profiles').select('theme').eq('id', profile.id).maybeSingle(),
    // Same idea for cover_fit: a missing column must not hide the case studies.
    supabase.from('case_studies').select('id, cover_fit').eq('user_id', profile.id).eq('published', true),
    // And for motion: a missing column falls back to 'still'.
    supabase.from('profiles').select('motion').eq('id', profile.id).maybeSingle(),
  ])

  if (csError) console.error('[portfolio] case_studies error:', csError)

  const fitById = new Map<string, string>((fitRes.data as { id: string; cover_fit: string }[] | null)?.map(r => [r.id, r.cover_fit]) ?? [])

  const motion = resolveMotion((motionRes.data as { motion?: string } | null)?.motion)

  const props = {
    motion,
    profile: { ...profile, theme: resolveTheme((themeRes.data as { theme?: string } | null)?.theme) },
    caseStudies: (caseStudies || []).map(cs => ({ ...cs, cover_fit: resolveCoverFit(fitById.get(cs.id)) })),
    testimonials: testimonials || [],
    experience: sortExperience(experience),
    tools: tools || [],
  }

  if (profile.layout === 'spotlight') return <SpotlightLayout {...props} />
  return <CanvasLayout {...props} />
}
