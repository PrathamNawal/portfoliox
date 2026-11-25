// Tool logic for the MCP server, independent of the MCP protocol. Each function takes deps + the
// authenticated user id and returns plain JSON. Errors that the user can fix are thrown as ToolError.
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { hashInputs, isValidSlug, normalizeSlug, portfolioUrl } from '@/lib/utils'
import type { Block, CaseSection, CaseSectionType, CaseStudy } from '@/types'
import { checkConfirmToken, makeConfirmToken } from './auth'
import type { FigmaApi } from './figma'
import type { LLM } from './llm'
import { extractFacts, userCorpus } from './pipeline/facts'
import { ingestAssets, type Fetcher } from './pipeline/ingest'
import { labelScreens } from './pipeline/labels'
import { buildOverview, buildSections, inferDiscipline, MORE_SCREENS_TITLE, pickCover, planStructure, sectionId, statBlocks } from './pipeline/plan'
import { qualityReport } from './pipeline/quality'
import { applyAnswers, blocksPublish, chooseQuestions } from './pipeline/questions'
import { hasPlaceholder, unverifiedNames } from './pipeline/validate'
import { factBrief, refineText, writeSections } from './pipeline/write'
import type { Store } from './store'
import type { BuildInput, DecisionAnswer, FactSheet, ProvenanceItem, RunState, StageName } from './types'

export class ToolError extends Error {
  constructor(message: string, public fix?: string) { super(message) }
}

export interface Deps {
  store: Store
  llm: LLM | null
  figmaFor: (userId: string) => Promise<FigmaApi | null>
  fetcher: Fetcher
  appUrl: string
}

export const COSTS = {
  build: Number(process.env.MCP_BUILD_CREDIT_COST || 3),
  rewrite: 1,
}
export const RUNS_PER_HOUR = 20

const appUrl = (d: Deps, path: string) => `${d.appUrl.replace(/\/$/, '')}${path}`

// ── Credits ──────────────────────────────────────────────────────────────────

async function creditCheck(d: Deps, userId: string, cost: number) {
  const profile = await d.store.getProfile(userId)
  if (!profile) throw new ToolError('No PortfolioX profile found for this account.', 'Finish onboarding at portfoliox first.')
  if (profile.plan !== 'free') return { plan: profile.plan, remaining: null as number | null }
  const remaining = await d.store.getCredits(userId)
  if (remaining < cost) throw new ToolError(`This needs ${cost} AI credit(s); you have ${remaining}.`, 'Upgrade to Pro for unlimited generation.')
  return { plan: profile.plan, remaining }
}

async function charge(d: Deps, userId: string, cost: number): Promise<number | null> {
  const profile = await d.store.getProfile(userId)
  if (profile?.plan !== 'free') return null
  const left = Math.max(0, (await d.store.getCredits(userId)) - cost)
  await d.store.setCredits(userId, left)
  return left
}

// ── Build ────────────────────────────────────────────────────────────────────

export interface BuildArgs extends BuildInput {
  mode?: 'draft' | 'publish'
  case_study_id?: string
  run_id?: string
  force?: boolean
}

function newRun(userId: string, input: BuildInput, inputHash: string, caseStudyId?: string): RunState {
  return { runId: crypto.randomUUID(), userId, caseStudyId, inputHash, input, stage: 'ingest', status: 'running', answers: [], warnings: [], creditsCharged: 0 }
}

function provenance(f: FactSheet, run: RunState, narrativeText: string, corpus: string): ProvenanceItem[] {
  const items: ProvenanceItem[] = []
  const push = (x: { text: string; source: string } | null, where: string) => {
    if (x) items.push({ claim: x.text, source: x.source === 'provided' ? 'from you' : 'inferred', where })
  }
  push(f.problem, 'challenge'); push(f.role, 'overview: role'); push(f.team, 'overview: team'); push(f.timeline, 'overview: timeline'); push(f.client, 'overview')
  f.outcomes.forEach(o => push(o, 'impact')); f.findings.forEach(o => push(o, 'research')); f.decisions.forEach(o => push(o, 'process'))
  for (const s of run.screens ?? []) if (s.caption && s.confidence >= 0.5 && s.source !== 'video') items.push({ claim: `${s.caption} (${s.kind})`, source: 'inferred from screens', where: `screen ${s.id}` })
  for (const n of unverifiedNames(narrativeText, corpus)) items.push({ claim: n, source: 'unverified', where: 'narrative: a name not found in your notes; check it' })
  return items.slice(0, 40)
}

function corpusFor(run: RunState): string {
  return userCorpus(run.input, run.screens, run.answers.map(a => a.text ?? ''))
}

async function runStage(d: Deps, run: RunState, stage: StageName): Promise<void> {
  const w = run.warnings
  switch (stage) {
    case 'ingest': {
      w.length = 0 // a re-ingest replaces warnings from an earlier attempt
      run.screens = await ingestAssets(run.userId, run.input.assets, { store: d.store, figma: await d.figmaFor(run.userId), fetcher: d.fetcher }, w)
      if (!run.screens.length) throw new ToolError('None of the assets could be imported, so there is nothing to build the case study around.', 'Pass at least one public image URL, a Figma link (with a Figma token set up), or a video link. See warnings for each asset.')
      return
    }
    case 'label': run.screens = await labelScreens(d.llm, run.screens!, w); return
    case 'facts': run.facts = await extractFacts(d.llm, run.input, run.screens!, w); return
    case 'plan': {
      const discipline = inferDiscipline(run.input.discipline, run.facts!, run.screens!, run.input)
      run.facts!.discipline = discipline
      run.plan = planStructure(discipline, run.facts!, run.screens!, run.input)
      return
    }
    case 'write': {
      const facts = applyAnswers(run.facts!, run.answers)
      const r = await writeSections(d.llm, facts, run.plan!, run.screens!, corpusFor(run), undefined, w)
      run.narratives = r.narratives
      run.summary = r.summary
      run.titleOptions = r.titleOptions
      if (!run.input.title && r.title) run.input = { ...run.input, title: r.title }
      if (r.removed.length) w.push(`Removed ${r.removed.length} sentence(s) with numbers not found in your notes: ${r.removed.map(x => x.claims.join(', ')).join('; ')}.`)
      if (r.usedModel && run.creditsCharged === 0) { await charge(d, run.userId, COSTS.build); run.creditsCharged = COSTS.build }
      return
    }
    case 'save': {
      const facts = applyAnswers(run.facts!, run.answers)
      const more = run.plan!.some(p => p.title === MORE_SCREENS_TITLE) ? 'More screens from the project.' : ''
      const sections = buildSections(run.plan!, run.narratives!, run.screens!, facts, more)
      const row: Partial<CaseStudy> = {
        title: run.input.title || facts.title || 'Untitled',
        discipline: facts.discipline ?? 'ux',
        sections,
        overview_data: buildOverview(facts, run.summary ?? ''),
      }
      const existing = run.caseStudyId ? await d.store.getCaseStudy(run.userId, run.caseStudyId) : null
      if (existing) {
        await d.store.updateCaseStudy(run.userId, existing.id, { ...row, cover_image_url: existing.cover_image_url || pickCover(run.screens!) })
      } else {
        const created = await d.store.insertCaseStudy(run.userId, { ...row, cover_image_url: pickCover(run.screens!), published: false })
        run.caseStudyId = created.id
      }
      run.decisions = chooseQuestions(facts, run.screens!, run.answers)
      const text = sections.map(s => s.narrative).join('\n')
      run.provenance = provenance(facts, run, text, corpusFor(run))
      return
    }
  }
}

async function resultFor(d: Deps, run: RunState, mode: 'draft' | 'publish' = 'draft', note?: string) {
  const cs = run.caseStudyId ? await d.store.getCaseStudy(run.userId, run.caseStudyId) : null
  const remaining = (await d.store.getProfile(run.userId))?.plan === 'free' ? await d.store.getCredits(run.userId) : null
  if (!cs || run.status !== 'done') {
    return { run_id: run.runId, status: run.status, stage: run.stage, error: run.error, warnings: run.warnings, next_steps: run.status === 'failed' ? ['Fix the problem above, then call build_case_study again with this run_id to resume from the failed stage.'] : [] }
  }
  const publishBlocker = blocksPublish(run.decisions)
  const out: Record<string, unknown> = {
    case_study_id: cs.id,
    run_id: run.runId,
    status: 'draft_ready',
    note,
    title: cs.title,
    title_options: run.titleOptions ?? [],
    preview_url: appUrl(d, `/case-study/${cs.id}`),
    summary: {
      discipline: cs.discipline,
      sections: (cs.sections ?? []).map(s => ({ id: s.id, type: s.type, title: s.title, words: (s.narrative.match(/\S+/g) ?? []).length, visuals: s.blocks.length })),
      screens_imported: run.screens?.length ?? 0,
    },
    open_decisions: run.decisions ?? [],
    provenance_report: run.provenance ?? [],
    quality_report: qualityReport(cs),
    warnings: run.warnings,
    credits: { charged: run.creditsCharged, remaining },
    next_steps: [
      ...(run.decisions?.length ? ['Show the open decisions to the user and pass their answers to answer_open_decisions. Defaults are already in the draft.'] : []),
      'Use refine_section or regroup_screens for changes.',
      publishBlocker ? `Publishing is blocked: ${publishBlocker}` : 'When the user is happy, call publish (it asks for confirmation).',
    ],
  }
  if (mode === 'publish' && !publishBlocker) {
    out.publish_confirmation_token = makeConfirmToken(run.userId, 'publish', cs.id)
    out.next_steps = ['Confirm with the user, then call publish with this case_study_id and publish_confirmation_token.']
  }
  return out
}

export async function buildCaseStudy(d: Deps, userId: string, args: BuildArgs) {
  let run: RunState | null = null
  if (args.run_id) {
    run = await d.store.getRun(userId, args.run_id)
    if (!run) throw new ToolError('No run with that run_id.', 'Call build_case_study without run_id to start a new one.')
    if (run.status === 'done') return resultFor(d, run, args.mode, 'This run had already finished; returned its draft.')
    // Resuming with corrected links replaces the assets and starts over from ingest.
    if (args.assets?.length) {
      run.input = { ...run.input, assets: args.assets }
      run.stage = 'ingest'
    }
  } else {
    const brief = (args.brief ?? '').trim()
    if (brief.length < 15) throw new ToolError('The brief is too short to build from.', 'Give at least the problem and what you did, in a sentence or two.')
    if (!args.assets?.length) throw new ToolError('No design files or screens were given.', 'Pass a Figma link, image URLs or a video link in assets.')
    if (args.case_study_id && !(await d.store.getCaseStudy(userId, args.case_study_id))) throw new ToolError('No case study with that id on your account.')
    const input: BuildInput = { brief, process_notes: args.process_notes?.trim() || undefined, assets: args.assets, discipline: args.discipline, title: args.title?.trim() || undefined }
    const inputHash = hashInputs(JSON.stringify(input), args.case_study_id ?? '')
    if (!args.force) {
      const prev = await d.store.findRunByHash(userId, inputHash)
      if (prev?.status === 'done' && prev.caseStudyId && (await d.store.getCaseStudy(userId, prev.caseStudyId))) {
        return resultFor(d, prev, args.mode, 'Same input as an earlier run; returned that draft instead of building a duplicate. Pass force: true to rebuild.')
      }
      if (prev?.status === 'running') run = prev
    }
    if (!run) {
      const since = new Date(Date.now() - 3600_000).toISOString()
      if ((await d.store.countRunsSince(userId, since)) >= RUNS_PER_HOUR) throw new ToolError('Too many builds in the last hour.', 'Wait a while, or refine an existing draft instead.')
      const profile = await d.store.getProfile(userId)
      if (!args.case_study_id && profile?.plan === 'free') {
        const count = (await d.store.listCaseStudies(userId)).length
        if (count >= (await d.store.getFreeCaseStudyLimit())) throw new ToolError('Free plan case study limit reached.', 'Upgrade to Pro, or rebuild an existing case study by passing its case_study_id.')
      }
      await creditCheck(d, userId, COSTS.build)
      run = newRun(userId, input, inputHash, args.case_study_id)
    }
  }

  run.status = 'running'
  run.error = undefined
  const order: StageName[] = ['ingest', 'label', 'facts', 'plan', 'write', 'save']
  for (const stage of order.slice(Math.max(0, order.indexOf(run.stage)))) {
    run.stage = stage
    await d.store.saveRun(run)
    try {
      await runStage(d, run, stage)
    } catch (err) {
      run.status = 'failed'
      run.error = err instanceof ToolError ? `${err.message}${err.fix ? ` ${err.fix}` : ''}` : `Stage "${stage}" failed: ${(err as Error).message}`
      await d.store.saveRun(run)
      return resultFor(d, run, args.mode)
    }
  }
  run.stage = 'done'
  run.status = 'done'
  await d.store.saveRun(run)
  return resultFor(d, run, args.mode)
}

// ── Open decisions ───────────────────────────────────────────────────────────

async function mcpRun(d: Deps, userId: string, caseStudyId: string) {
  const run = await d.store.latestRunForCase(userId, caseStudyId)
  if (!run?.facts) throw new ToolError('This case study was not built with build_case_study, so there are no open decisions.', 'Use refine_section to change it.')
  return run
}

export async function answerOpenDecisions(d: Deps, userId: string, caseStudyId: string, answers: DecisionAnswer[]) {
  const cs = await getOwned(d, userId, caseStudyId)
  const run = await mcpRun(d, userId, caseStudyId)
  const open = new Map((run.decisions ?? []).map(q => [q.id, q]))
  for (const a of answers) {
    const q = open.get(a.id)
    if (!q) throw new ToolError(`"${a.id}" is not an open decision on this case study.`, `Open decisions: ${[...open.keys()].join(', ') || 'none'}.`)
    if (a.choice && !q.options.some(o => o.id === a.choice)) throw new ToolError(`"${a.choice}" is not an option for "${a.id}".`, `Options: ${q.options.map(o => o.id).join(', ')}.`)
    if (!a.choice && !a.text) throw new ToolError(`Answer "${a.id}" with a choice, a text, or both.`)
  }
  run.answers = [...run.answers.filter(x => !answers.some(a => a.id === x.id)), ...answers]
  const facts = applyAnswers(run.facts!, run.answers)

  const all: CaseSectionType[] = (cs.sections ?? []).map(s => s.type).filter(t => t !== 'custom')
  const affected = new Set<CaseSectionType>()
  for (const a of answers) {
    const q = open.get(a.id)!
    if (q.affects === 'all') all.forEach(t => affected.add(t)); else q.affects.forEach(t => affected.add(t))
  }
  const types = [...affected].filter(t => all.includes(t))
  let sections = cs.sections ?? []
  let summary = cs.overview_data?.summary ?? ''
  const notes: string[] = []
  if (types.length) {
    await creditCheck(d, userId, COSTS.rewrite)
    const plan = sections.filter(s => types.includes(s.type)).map(s => ({ type: s.type, title: s.title, screenIds: [] as string[] }))
    // Screens stay where the user has them now; give the writer their captions from the run.
    for (const p of plan) p.screenIds = (run.plan?.find(x => x.type === p.type)?.screenIds ?? [])
    const r = await writeSections(d.llm, facts, plan, run.screens ?? [], corpusFor(run), types, run.warnings)
    if (r.usedModel) { await charge(d, userId, COSTS.rewrite); run.creditsCharged += COSTS.rewrite }
    sections = sections.map(s => (types.includes(s.type) && r.narratives[s.type] !== undefined ? { ...s, narrative: r.narratives[s.type]! } : s))
    if (r.summary && types.includes('overview')) summary = r.summary
    if (r.removed.length) notes.push(`Removed ${r.removed.length} sentence(s) with numbers not in your notes.`)
  }
  // Stat blocks follow the outcome facts.
  sections = sections.map(s => (s.type === 'impact' ? { ...s, blocks: [...statBlocks(facts), ...s.blocks.filter(b => !b.id.startsWith('mcp-stat-'))] } : s))
  // New facts win; anything the user typed in the editor survives where we have nothing new.
  const fresh = buildOverview(facts, summary)
  const prev = cs.overview_data
  const overview = {
    summary: fresh.summary || prev?.summary || '',
    role: fresh.role || prev?.role || '',
    timeline: fresh.timeline || prev?.timeline || '',
    team: fresh.team || prev?.team || '',
    metrics: fresh.metrics.length ? fresh.metrics : prev?.metrics ?? [],
  }
  await d.store.updateCaseStudy(userId, cs.id, { sections, overview_data: overview })

  run.decisions = chooseQuestions(facts, run.screens ?? [], run.answers)
  await d.store.saveRun(run)
  const lock = answers.some(a => a.id === 'confidentiality' && a.choice === 'lock')
  const updated = (await d.store.getCaseStudy(userId, cs.id))!
  return {
    case_study_id: cs.id,
    rewritten_sections: types,
    open_decisions: run.decisions,
    quality_report: qualityReport(updated),
    notes,
    next_steps: [
      ...(lock ? ['The user chose NDA: call set_nda with enabled: true for this case study.'] : []),
      run.decisions.length ? 'Some decisions are still open.' : 'No open decisions left. Call publish when the user is ready.',
    ],
  }
}

// ── Editing ──────────────────────────────────────────────────────────────────

async function getOwned(d: Deps, userId: string, id: string): Promise<CaseStudy> {
  const cs = await d.store.getCaseStudy(userId, id)
  if (!cs) throw new ToolError('No case study with that id on your account.', 'Call list_case_studies to see ids.')
  return cs
}

function findSection(sections: CaseSection[], ref: string): CaseSection | undefined {
  const r = ref.trim().toLowerCase()
  return sections.find(s => s.id.toLowerCase() === r) ?? sections.find(s => s.type === r) ?? sections.find(s => s.title.toLowerCase() === r)
}

export async function refineSection(d: Deps, userId: string, caseStudyId: string, section: string, instruction: string) {
  if (!d.llm) throw new ToolError('Text generation is not configured on this server.')
  const cs = await getOwned(d, userId, caseStudyId)
  const sections = cs.sections ?? []
  const target = findSection(sections, section)
  if (!target) throw new ToolError(`No section "${section}".`, `Sections: ${sections.map(s => `${s.id} (${s.title})`).join(', ')}.`)
  await creditCheck(d, userId, COSTS.rewrite)
  const run = await d.store.latestRunForCase(userId, caseStudyId)
  const corpus = [run ? corpusFor(run) : '', ...sections.map(s => s.narrative), cs.overview_data?.summary ?? ''].join('\n')
  const facts = run?.facts ? factBrief(applyAnswers(run.facts, run.answers)) : ''
  const r = await refineText(d.llm, target.narrative, instruction, facts, corpus)
  await charge(d, userId, COSTS.rewrite)
  const next = sections.map(s => (s.id === target.id ? { ...s, narrative: r.text } : s))
  const patch: Partial<CaseStudy> = { sections: next }
  if (target.type === 'overview' && cs.overview_data) patch.overview_data = { ...cs.overview_data, summary: r.text }
  await d.store.updateCaseStudy(userId, cs.id, patch)
  return {
    case_study_id: cs.id,
    section: { id: target.id, title: target.title, text: r.text },
    removed_sentences: r.removed.map(x => x.sentence),
    note: r.removed.length ? 'Some sentences were dropped because they added numbers that are not in your notes.' : undefined,
  }
}

export interface RegroupArgs {
  moves?: { block_id: string; to_section: string; position?: number }[]
  remove?: string[]
  captions?: { block_id: string; caption: string }[]
}

export async function regroupScreens(d: Deps, userId: string, caseStudyId: string, args: RegroupArgs) {
  const cs = await getOwned(d, userId, caseStudyId)
  const sections: CaseSection[] = structuredClone(cs.sections ?? [])
  const locate = (id: string) => {
    for (const s of sections) { const i = s.blocks.findIndex(b => b.id === id); if (i >= 0) return { s, i } }
    throw new ToolError(`No block "${id}".`, 'Call get_case_study to see block ids.')
  }
  for (const id of args.remove ?? []) { const { s, i } = locate(id); s.blocks.splice(i, 1) }
  for (const c of args.captions ?? []) { const { s, i } = locate(c.block_id); s.blocks[i] = { ...s.blocks[i], caption: c.caption } }
  for (const m of args.moves ?? []) {
    const { s, i } = locate(m.block_id)
    let to = findSection(sections, m.to_section)
    if (!to) {
      // Moving to a section that doesn't exist yet creates it as a custom section.
      to = { id: sectionId('custom', m.to_section), type: 'custom', title: m.to_section, narrative: '', blocks: [] }
      sections.push(to)
    }
    const [block] = s.blocks.splice(i, 1)
    const moved: Block = { ...block, sectionLabel: to.title }
    const pos = m.position === undefined ? to.blocks.length : Math.max(0, Math.min(to.blocks.length, m.position))
    to.blocks.splice(pos, 0, moved)
  }
  const cleaned = sections.filter(s => s.type !== 'custom' || s.blocks.length || s.narrative.trim())
  await d.store.updateCaseStudy(userId, cs.id, { sections: cleaned })
  return { case_study_id: cs.id, layout: layoutOf(cleaned) }
}

function layoutOf(sections: CaseSection[]) {
  return sections.map(s => ({
    id: s.id, type: s.type, title: s.title,
    blocks: s.blocks.map(b => ({ id: b.id, type: b.type, caption: b.caption ?? b.statLabel ?? '', images: b.images?.length })),
  }))
}

// ── Reading ──────────────────────────────────────────────────────────────────

export async function listCaseStudies(d: Deps, userId: string) {
  const all = await d.store.listCaseStudies(userId)
  return {
    case_studies: all.map(c => ({ id: c.id, title: c.title, published: c.published, nda: c.nda_enabled, discipline: c.discipline, sections: c.sections?.length ?? 0, updated_at: c.updated_at })),
  }
}

export async function getCaseStudy(d: Deps, userId: string, id: string) {
  const cs = await getOwned(d, userId, id)
  const run = await d.store.latestRunForCase(userId, id)
  return {
    id: cs.id, title: cs.title, discipline: cs.discipline, published: cs.published, nda: cs.nda_enabled,
    cover_image_url: cs.cover_image_url,
    overview: cs.overview_data,
    sections: (cs.sections ?? []).map(s => ({ ...layoutOf([s])[0], narrative: s.narrative })),
    open_decisions: run?.decisions ?? [],
  }
}

export async function getQuality(d: Deps, userId: string, id: string) {
  return { case_study_id: id, ...qualityReport(await getOwned(d, userId, id)) }
}

export async function getPreview(d: Deps, userId: string, id: string) {
  const cs = await getOwned(d, userId, id)
  const profile = await d.store.getProfile(userId)
  return {
    editor_url: appUrl(d, `/case-study/${cs.id}`),
    portfolio_preview_url: appUrl(d, '/preview'),
    live_url: cs.published && profile?.slug ? liveUrl(d, profile.slug, cs.id) : null,
    note: 'Editor and preview links open when signed in to PortfolioX.',
  }
}

function liveUrl(d: Deps, slug: string, caseId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ? portfolioUrl(slug) : appUrl(d, `/p/${slug}`)
  return `${base}/case/${caseId}`
}

// ── Publishing ───────────────────────────────────────────────────────────────

export async function publish(d: Deps, userId: string, id: string, token?: string, slugIn?: string) {
  const cs = await getOwned(d, userId, id)
  const profile = await d.store.getProfile(userId)
  if (!profile) throw new ToolError('No PortfolioX profile found.')
  if ((cs.sections ?? []).some(s => hasPlaceholder(s.narrative))) throw new ToolError('The case study still has placeholder text.', 'Replace it with refine_section, then publish.')
  const run = await d.store.latestRunForCase(userId, id)
  const blocker = blocksPublish(run?.decisions)
  if (blocker) throw new ToolError('An open decision must be answered before publishing.', blocker)

  let slug = profile.slug
  if (!slug) {
    if (!slugIn) throw new ToolError('Your portfolio has no URL yet.', 'Ask the user for a portfolio name and pass it as slug (lowercase letters, numbers, hyphens).')
    slug = normalizeSlug(slugIn)
    if (!isValidSlug(slug)) throw new ToolError(`"${slugIn}" can't be used as a portfolio URL.`, '3-30 characters: lowercase letters, numbers and hyphens.')
    if (await d.store.isSlugTaken(slug, userId)) throw new ToolError(`The URL "${slug}" is taken.`, `Try ${slug}-design or ${slug}-portfolio.`)
  }
  if (!checkConfirmToken(token, userId, 'publish', id)) {
    return {
      needs_confirmation: true,
      confirmation_token: makeConfirmToken(userId, 'publish', id),
      will_do: `Publish "${cs.title}" at ${liveUrl(d, slug, id)}${profile.slug ? '' : ` and claim the portfolio URL "${slug}"`}.`,
      quality_score: qualityReport(cs).score,
      next_steps: ['Ask the user to confirm, then call publish again with this confirmation_token (and the same slug, if one was given).'],
    }
  }
  if (!profile.slug && (await d.store.setSlug(userId, slug)) === 'taken') throw new ToolError(`The URL "${slug}" was just taken.`, 'Pick another slug.')
  await d.store.updateCaseStudy(userId, id, { published: true })
  return { published: true, live_url: liveUrl(d, slug, id), nda: cs.nda_enabled }
}

export async function unpublish(d: Deps, userId: string, id: string, token?: string) {
  const cs = await getOwned(d, userId, id)
  if (!cs.published) return { published: false, note: 'It was not published.' }
  if (!checkConfirmToken(token, userId, 'unpublish', id)) {
    return { needs_confirmation: true, confirmation_token: makeConfirmToken(userId, 'unpublish', id), will_do: `Take "${cs.title}" offline. Its link will stop working.` }
  }
  await d.store.updateCaseStudy(userId, id, { published: false })
  return { published: false }
}

const WORDS = ['amber', 'birch', 'cobalt', 'delta', 'ember', 'fjord', 'grove', 'harbor', 'indigo', 'juniper', 'kestrel', 'lumen', 'meadow', 'nimbus', 'orbit', 'pine', 'quartz', 'river', 'sable', 'tundra']
export function generatePassword(): string {
  const pick = () => WORDS[crypto.randomInt(WORDS.length)]
  return `${pick()}-${pick()}-${crypto.randomInt(100, 1000)}`
}

export async function setNda(d: Deps, userId: string, id: string, enabled: boolean, token?: string, password?: string) {
  const cs = await getOwned(d, userId, id)
  if (password !== undefined && password.length < 6) throw new ToolError('The password must be at least 6 characters.')
  const action = enabled ? 'nda-on' : 'nda-off'
  if (!checkConfirmToken(token, userId, action, id)) {
    return {
      needs_confirmation: true,
      confirmation_token: makeConfirmToken(userId, action, id),
      will_do: enabled
        ? `Lock "${cs.title}" behind a password${password ? '' : ' (one will be generated and shown once)'}. Visitors see only the title until they enter it.`
        : `Remove the password from "${cs.title}". Anyone with the link can read it${cs.published ? ' (it is published)' : ''}.`,
    }
  }
  if (!enabled) {
    await d.store.updateCaseStudy(userId, id, { nda_enabled: false, nda_password_hash: null })
    return { nda: false }
  }
  const plain = password ?? generatePassword()
  await d.store.updateCaseStudy(userId, id, { nda_enabled: true, nda_password_hash: await bcrypt.hash(plain, 10) })
  return {
    nda: true,
    password: password ? undefined : plain,
    note: password ? 'Locked with the password you chose.' : 'Show this password to the user now; it is not stored in readable form and cannot be retrieved later.',
  }
}
