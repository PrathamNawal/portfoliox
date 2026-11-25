// Shared types for the PortfolioX MCP server and its case-study pipeline.
import type { CaseDiscipline, CaseSectionType } from '@/types'

export type ScreenKind =
  | 'research' | 'audit' | 'flow' | 'wireframe' | 'hifi' | 'before' | 'after'
  | 'prototype' | 'final' | 'moodboard' | 'storyboard' | 'other'

export const SCREEN_KINDS: ScreenKind[] = [
  'research', 'audit', 'flow', 'wireframe', 'hifi', 'before', 'after',
  'prototype', 'final', 'moodboard', 'storyboard', 'other',
]

/** One visual the user gave us, after ingest. */
export interface Screen {
  id: string
  source: 'figma' | 'image' | 'video' | 'figma-embed'
  /** Frame or file name, as the user named it. */
  name: string
  /** Stored public URL (images), or the embed / video URL. */
  url: string
  /** Text read from the frame's text layers (Figma only). Counts as user-provided content. */
  text?: string
  /** Figma page or folder the screen came from; used for grouping. */
  group?: string
  kind: ScreenKind
  caption?: string
  /** 0-1. Heuristic labels sit at 0.4-0.6, vision labels at the model's stated confidence. */
  confidence: number
  order: number
}

export type FactSource = 'provided' | 'inferred'

export interface Fact {
  text: string
  source: FactSource
  /** Verbatim span from the user's input that backs this fact. */
  quote?: string
}

export interface OutcomeFact extends Fact {
  metric?: { value: string; label: string }
}

export interface FactSheet {
  title?: string
  discipline?: CaseDiscipline
  problem: Fact | null
  users: Fact | null
  role: Fact | null
  team: Fact | null
  timeline: Fact | null
  client: Fact | null
  constraints: Fact[]
  methods: Fact[]
  findings: Fact[]
  decisions: Fact[]
  outcomes: OutcomeFact[]
  /** Words in the input that suggest the work is confidential ("internal", "NDA", a client name). */
  confidentialSignals: string[]
  contradictions: { topic: string; a: string; b: string }[]
  /** Set when the user says the project is a concept / never shipped. */
  isConcept?: boolean
  /** Replace the client's name with a generic descriptor everywhere. */
  anonymise?: boolean
}

export interface DecisionOption { id: string; label: string }

export interface OpenDecision {
  id: string
  question: string
  options: DecisionOption[]
  /** Option id the current draft already assumes. */
  default: string
  /** True when a free-text answer is useful (e.g. the metric itself). */
  acceptsText: boolean
  affects: CaseSectionType[] | 'all'
  reason: string
}

export interface DecisionAnswer { id: string; choice?: string; text?: string }

export interface PlannedSection {
  type: CaseSectionType
  title: string
  screenIds: string[]
}

export interface BuildInput {
  brief: string
  process_notes?: string
  assets: string[]
  discipline?: CaseDiscipline
  title?: string
}

export type StageName = 'ingest' | 'label' | 'facts' | 'plan' | 'write' | 'save' | 'done'
export const STAGES: StageName[] = ['ingest', 'label', 'facts', 'plan', 'write', 'save', 'done']

export interface ProvenanceItem {
  claim: string
  source: 'from you' | 'inferred from screens' | 'inferred' | 'unverified'
  where: string
}

export interface RunState {
  runId: string
  userId: string
  caseStudyId?: string
  inputHash: string
  input: BuildInput
  stage: StageName
  status: 'running' | 'done' | 'failed'
  screens?: Screen[]
  facts?: FactSheet
  plan?: PlannedSection[]
  /** Section narratives as written (after validation), keyed by section type. */
  narratives?: Partial<Record<CaseSectionType, string>>
  summary?: string
  titleOptions?: string[]
  answers: DecisionAnswer[]
  decisions?: OpenDecision[]
  provenance?: ProvenanceItem[]
  warnings: string[]
  creditsCharged: number
  error?: string
}
