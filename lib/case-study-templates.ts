import type { CaseSection, CaseSectionType, CaseDiscipline, OverviewData } from '@/types'

// ── Section metadata ──────────────────────────────────────────────────────────

export const SECTION_DEFS: Record<CaseSectionType, {
  title: string
  prompt: string
  color: string
  icon: string
}> = {
  overview: {
    title: 'Overview',
    prompt: '',
    color: '#7B5EE0',
    icon: '◈',
  },
  challenge: {
    title: 'The Challenge',
    prompt: 'What was the problem worth solving? Who felt it, why did it matter, and what made it hard?',
    color: '#E53416',
    icon: '⚡',
  },
  research: {
    title: 'Research & Discovery',
    prompt: 'What did you learn, and from whom? What surprised you or changed your direction?',
    color: '#0099FF',
    icon: '◎',
  },
  process: {
    title: 'The Process',
    prompt: 'Walk through your thinking. What decisions did you make, and why not the alternatives? Show the messy middle.',
    color: '#FF9A00',
    icon: '⟳',
  },
  solution: {
    title: 'The Solution',
    prompt: 'Show the final work. What are the 2–3 key design decisions that define it?',
    color: '#1A8A4A',
    icon: '✦',
  },
  impact: {
    title: 'Impact & Reflection',
    prompt: 'What changed because of this work? Numbers if you have them. What would you do differently?',
    color: '#B86E0A',
    icon: '◇',
  },
  whatsnext: {
    title: "What's Next",
    prompt: 'Where does this go from here? What did this project unlock — for the product, the team, or your own thinking?',
    color: '#1A8A4A',
    icon: '→',
  },
  custom: {
    title: 'Custom Section',
    prompt: 'Tell this part of your story.',
    color: '#9A978E',
    icon: '○',
  },
}

// ── Section title ghost-text examples ─────────────────────────────────────────
// Shown as placeholder on the section title input. Nudge designers away from
// generic headings toward narrative-first titles.
export const SECTION_TITLE_EXAMPLES: Record<string, string> = {
  challenge:  'e.g. "The dilemma that took 3 weeks to resolve"',
  research:   'e.g. "What 20 users told us we were wrong about"',
  process:    'e.g. "Three directions, one hard call"',
  solution:   'e.g. "The system we finally landed on"',
  impact:     'e.g. "What changed — and what we\'d do differently"',
  whatsnext:  'e.g. "This opened the door to something bigger"',
  custom:     'e.g. "The constraint that shaped everything"',
}

// ── Discipline templates ──────────────────────────────────────────────────────

export const DISCIPLINE_TEMPLATES: Record<CaseDiscipline, {
  label: string
  description: string
  emoji: string
  sections: CaseSectionType[]
}> = {
  ux: {
    label: 'UX / Product Design',
    description: 'Research-led, user-centred, process-heavy',
    emoji: '⬡',
    sections: ['overview', 'challenge', 'research', 'process', 'solution', 'impact', 'whatsnext'],
  },
  brand: {
    label: 'Brand & Identity',
    description: 'Brief-driven, concept exploration, visual outcomes',
    emoji: '◈',
    sections: ['overview', 'challenge', 'research', 'process', 'solution', 'impact', 'whatsnext'],
  },
  motion: {
    label: 'Motion Design',
    description: 'Concept, storyboard, production, final output',
    emoji: '◎',
    sections: ['overview', 'challenge', 'process', 'solution', 'impact', 'whatsnext'],
  },
  illustration: {
    label: 'Illustration',
    description: 'Brief, sketches, refinement, final application',
    emoji: '◇',
    sections: ['overview', 'challenge', 'process', 'solution', 'impact', 'whatsnext'],
  },
  custom: {
    label: 'Start from scratch',
    description: 'Blank canvas — add any sections you need',
    emoji: '○',
    sections: ['overview'],
  },
}

// ── Factory ───────────────────────────────────────────────────────────────────

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

export function makeSection(type: CaseSectionType): CaseSection {
  return {
    id: makeId(),
    type,
    title: SECTION_DEFS[type].title,
    narrative: '',
    blocks: [],
  }
}

export function makeSectionsForDiscipline(discipline: CaseDiscipline): CaseSection[] {
  return DISCIPLINE_TEMPLATES[discipline].sections.map(makeSection)
}

export function makeDefaultOverview(): OverviewData {
  return {
    summary: '',
    role: '',
    timeline: '',
    team: '',
    metrics: [
      { label: '', value: '' },
      { label: '', value: '' },
      { label: '', value: '' },
    ],
  }
}
