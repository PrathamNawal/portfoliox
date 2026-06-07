export type Plan = 'free' | 'pro'
export type Role = 'user' | 'admin'
export type Discipline = 'ux' | 'graphic' | 'motion' | 'illustration'
export type Layout = 'canvas' | 'spotlight'
export type BlockType = 'image' | 'gallery' | 'figma' | 'compare' | 'text'
export type GenerationSection = 'intro' | 'process' | 'outcome'
export type SectionLabel =
  | 'Intro' | 'Research' | 'Ideation' | 'Wireframes' | 'Process'
  | 'Prototype' | 'Testing' | 'Outcome' | 'Learnings'

// ── New section-based case study structure ───────────────────────────────────
export type CaseSectionType =
  | 'overview' | 'challenge' | 'research' | 'process' | 'solution' | 'impact' | 'custom'

export type CaseDiscipline = 'ux' | 'brand' | 'motion' | 'illustration' | 'custom'

export interface CaseSection {
  id: string
  type: CaseSectionType
  title: string
  narrative: string        // rich text HTML
  blocks: Block[]          // visual blocks within this section
}

export interface OverviewData {
  summary: string
  role: string
  timeline: string
  team: string
  metrics: { label: string; value: string }[]
}

export interface Profile {
  id: string
  name: string
  bio: string | null
  avatar_url: string | null
  discipline: Discipline | null
  skills: string[]
  layout: Layout
  slug: string | null
  plan: Plan
  role: Role
  social_links: SocialLinks
  resume_url: string | null
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface SocialLinks {
  linkedin?: string
  dribbble?: string
  behance?: string
  twitter?: string
  website?: string
}

export interface Block {
  id: string
  type: BlockType
  sectionLabel: string
  caption?: string
  // image
  imageUrl?: string
  // gallery
  images?: { url: string; caption: string }[]
  // figma
  figmaUrl?: string
  // compare
  beforeUrl?: string
  afterUrl?: string
  // text
  html?: string
}

export interface CaseStudy {
  id: string
  user_id: string
  title: string
  problem: string | null
  what_i_did: string | null
  outcome_notes: string | null
  cover_image_url: string | null
  blocks: Block[]
  metadata: CaseStudyMetadata
  section_labels: Record<string, string>
  nda_enabled: boolean
  published: boolean
  display_order: number
  ai_generated: AIGenerated
  // New section-based structure
  sections: CaseSection[] | null
  discipline: CaseDiscipline | null
  overview_data: OverviewData | null
  created_at: string
  updated_at: string
}

export interface CaseStudyMetadata {
  client?: string
  role?: string
  duration?: string
  platform?: string
}

export interface AIGenerated {
  intro?: string
  process?: string
  outcome?: string
}

export interface Testimonial {
  id: string
  user_id: string
  name: string
  title_and_company: string
  linkedin_url: string | null
  quote: string
  photo_url: string | null
  display_order: number
  created_at: string
}

export interface WorkExperience {
  id: string
  user_id: string
  role: string
  company: string
  start_month: string
  end_month: string | null
  is_current: boolean
  description: string | null
  discipline_tag: string | null
  display_order: number
  created_at: string
}

export interface ToolStackItem {
  id: string
  user_id: string
  tool_name: string
  display_order: number
}

export interface AnalyticsEvent {
  id: number
  user_id: string
  case_study_id: string | null
  event_type: 'page_view' | 'case_study_view' | 'preview'
  visitor_fingerprint: string | null
  time_on_page_seconds: number | null
  recorded_at: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
  joined: string
  cases: number
  plan: Plan
  role: Role
}
