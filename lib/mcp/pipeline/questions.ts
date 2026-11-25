// The question policy. Draft first, ask second: the draft always exists, and the user is asked at most three
// questions, only where the answer would change the case study materially and can't be inferred.
import type { DecisionAnswer, FactSheet, OpenDecision, Screen } from '../types'

export const MAX_QUESTIONS = 3

function hasTeam(f: FactSheet): boolean {
  return !!f.team && !/\b(solo|alone|just me|myself|sole)\b/i.test(f.team.text)
}

export function chooseQuestions(f: FactSheet, screens: Screen[], answers: DecisionAnswer[]): OpenDecision[] {
  const answered = new Set(answers.map(a => a.id))
  const out: OpenDecision[] = []

  // Contradictions first: guessing wrong here makes the case study false.
  f.contradictions.forEach((c, i) => out.push({
    id: `contradiction-${i}`,
    question: `Your notes disagree about ${c.topic}. Which is right?`,
    options: [{ id: 'a', label: c.a }, { id: 'b', label: c.b }],
    default: 'a',
    acceptsText: true,
    affects: 'all',
    reason: 'Contradicting facts; the tool will not pick one silently.',
  }))

  const providedOutcome = f.outcomes.some(o => o.source === 'provided')
  if (!providedOutcome && !f.isConcept) out.push({
    id: 'outcome',
    question: 'Did this work change a number or a behaviour you can name?',
    options: [
      { id: 'metric', label: 'Yes, add a metric (type it, e.g. "checkout conversion up 18%")' },
      { id: 'qualitative', label: 'Describe the impact in words (type it)' },
      { id: 'concept', label: 'No outcome yet: mark it as a concept or unshipped project' },
    ],
    default: 'concept',
    acceptsText: true,
    affects: ['impact', 'overview'],
    reason: 'No outcome in the brief. The draft makes no outcome claim until you answer.',
  })

  const roleUnclear = !f.role || (f.role.source === 'inferred' && hasTeam(f))
  if (roleUnclear) out.push({
    id: 'role',
    question: 'What was your role on this project?',
    options: [
      { id: 'lead', label: 'Lead designer' },
      { id: 'sole', label: 'Sole designer' },
      { id: 'contributor', label: 'Contributor (say which part you owned)' },
    ],
    default: hasTeam(f) ? 'contributor' : 'sole',
    acceptsText: true,
    affects: ['overview', 'process'],
    reason: 'Ownership on team work is the first thing reviewers check.',
  })

  if (f.confidentialSignals.length) out.push({
    id: 'confidentiality',
    question: `This mentions ${f.confidentialSignals.slice(0, 3).map(s => `"${s}"`).join(', ')}. How should it be shown?`,
    options: [
      { id: 'public', label: 'Public, as written' },
      { id: 'anonymise', label: 'Public, but replace the client name with a description' },
      { id: 'lock', label: 'Lock behind a password (NDA)' },
    ],
    default: 'public',
    acceptsText: false,
    affects: 'all',
    reason: 'Possible confidential work. Publishing is blocked until this is answered.',
  })

  const low = screens.filter(s => s.source !== 'video' && s.confidence < 0.5).length
  if (screens.length >= 4 && low / screens.length > 0.3) out.push({
    id: 'grouping',
    question: 'I wasn\'t sure how some screens fit the story. Is the proposed grouping right?',
    options: [{ id: 'accept', label: 'Looks right' }, { id: 'edit', label: 'Change it (use regroup_screens)' }],
    default: 'accept',
    acceptsText: false,
    affects: [],
    reason: `${low} of ${screens.length} screens were labelled with low confidence.`,
  })

  return out.filter(q => !answered.has(q.id)).slice(0, MAX_QUESTIONS)
}

/** Folds answers into the fact sheet. Answers count as user-provided facts. */
export function applyAnswers(f: FactSheet, answers: DecisionAnswer[]): FactSheet {
  const next: FactSheet = structuredClone(f)
  for (const a of answers) {
    const text = a.text?.trim()
    if (a.id === 'outcome') {
      if (a.choice === 'concept') next.isConcept = true
      else if (text) next.outcomes.push({ text, source: 'provided', quote: text, metric: metricFrom(text) })
    } else if (a.id === 'role') {
      const label = { lead: 'Lead designer', sole: 'Sole designer', contributor: 'Contributor' }[a.choice ?? ''] ?? ''
      const role = [label, text].filter(Boolean).join(', ')
      if (role) next.role = { text: role, source: 'provided', quote: role }
    } else if (a.id === 'confidentiality') {
      next.anonymise = a.choice === 'anonymise'
    } else if (a.id.startsWith('contradiction-')) {
      const i = Number(a.id.split('-')[1])
      const c = next.contradictions[i]
      if (c) {
        const truth = text || (a.choice === 'b' ? c.b : c.a)
        next.decisions.push({ text: `${c.topic}: ${truth}`, source: 'provided', quote: truth })
      }
    }
  }
  return next
}

/** "conversion up 18%" → { value: "18%", label: "conversion up" } */
export function metricFrom(text: string): { value: string; label: string } | undefined {
  const m = text.match(/([$₹€£]?\s?\d[\d,.]*\s?(?:%|x|k|m|bn|\+)?)/i)
  if (!m) return undefined
  const value = m[1].trim()
  const label = text.replace(m[0], '').replace(/\s+/g, ' ').replace(/^[\s,:-]+|[\s,:-]+$/g, '').slice(0, 60) || 'Result'
  return { value, label }
}

/** True when publishing must wait for an answer. */
export function blocksPublish(decisions: OpenDecision[] | undefined): string | null {
  const q = decisions?.find(d => d.id === 'confidentiality' || d.id.startsWith('contradiction-'))
  return q ? `Answer "${q.question}" first (answer_open_decisions, id "${q.id}").` : null
}
