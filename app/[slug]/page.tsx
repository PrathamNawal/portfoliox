import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CanvasLayout } from '@/components/published/CanvasLayout'
import { SpotlightLayout } from '@/components/published/SpotlightLayout'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, bio')
    .eq('slug', slug)
    .single()

  if (!profile) return { title: 'Portfolio not found' }

  return {
    title: `${profile.name} — Portfolio`,
    description: profile.bio || `${profile.name}'s design portfolio`,
  }
}

export default async function PublishedPortfolio({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, bio, avatar_url, discipline, skills, layout, slug, plan, role, social_links, resume_url, onboarding_complete, created_at, updated_at')
    .eq('slug', slug)
    .single()

  if (!profile) notFound()

  const { data: caseStudies } = await supabase
    .from('case_studies')
    .select('id, title, cover_image_url, nda_enabled, blocks, metadata')
    .eq('user_id', profile.id)
    .eq('published', true)
    .order('display_order', { ascending: true })

  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .eq('user_id', profile.id)
    .order('display_order')

  const { data: experience } = await supabase
    .from('work_experience')
    .select('*')
    .eq('user_id', profile.id)
    .order('display_order')

  const { data: tools } = await supabase
    .from('tool_stack')
    .select('*')
    .eq('user_id', profile.id)
    .order('display_order')

  const props = { profile, caseStudies: caseStudies || [], testimonials: testimonials || [], experience: experience || [], tools: tools || [] }

  if (profile.layout === 'spotlight') return <SpotlightLayout {...props} />
  return <CanvasLayout {...props} />
}
