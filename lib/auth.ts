import { stackServerApp } from './stack'
import { createClient } from './supabase/server'
import { redirect } from 'next/navigation'

/**
 * Get the current Stack Auth user (server-side).
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  return await stackServerApp.getUser()
}

/**
 * Require authentication. Redirects to sign-in if not logged in.
 */
export async function requireUser() {
  const user = await stackServerApp.getUser({ or: 'redirect' })
  return user
}

/**
 * Require admin role (checked in Supabase profiles table).
 * Redirects to /dashboard silently if not admin.
 */
export async function requireAdmin() {
  const user = await stackServerApp.getUser({ or: 'redirect' })
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return user
}

/**
 * Get or create the Supabase profile for the current Stack Auth user.
 * Called after onboarding completes.
 */
export async function ensureProfile(userId: string, data: {
  name: string
  bio?: string
  discipline?: string
  skills?: string[]
  layout?: string
}) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existing) {
    // Update with onboarding data
    await supabase
      .from('profiles')
      .update({
        name: data.name,
        bio: data.bio || null,
        discipline: data.discipline || null,
        skills: data.skills || [],
        layout: data.layout || 'canvas',
        onboarding_complete: true,
      })
      .eq('id', userId)
  } else {
    // Create profile
    await supabase.from('profiles').insert({
      id: userId,
      name: data.name,
      bio: data.bio || null,
      discipline: data.discipline || null,
      skills: data.skills || [],
      layout: data.layout || 'canvas',
      onboarding_complete: true,
      // Seed admin role for the configured email
      role: data.name ? 'user' : 'user',
    })

    // Seed ai_credits for new user
    await supabase.from('ai_credits').upsert({
      user_id: userId,
      credits_remaining: 10,
    })
  }

  // Seed admin role if this is the admin email
  const adminEmail = process.env.ADMIN_SEED_EMAIL
  const supabaseService = await createServiceClient()
  if (adminEmail) {
    const stackUser = await stackServerApp.getUser()
    const primaryEmail = stackUser?.primaryEmail
    if (primaryEmail === adminEmail) {
      await supabaseService
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId)
    }
  }
}

async function createServiceClient() {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
