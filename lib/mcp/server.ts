// MCP protocol layer: registers PortfolioX tools, resources and prompts for one authenticated user.
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import * as svc from './service'
import { ToolError, type Deps } from './service'

const DISCIPLINES = ['ux', 'brand', 'motion', 'illustration', 'custom'] as const

const INSTRUCTIONS = `PortfolioX turns a designer's project into a published portfolio case study.
Main flow: call build_case_study with the user's brief (problem, role, outcome), process notes and design links
(Figma, image URLs, video links). It always returns a saved draft plus at most 3 open decisions with options.
Show the decisions to the user with their options; pass answers to answer_open_decisions. Defaults are already in the draft,
so never block the user on them. Never invent facts for the user: if they don't know an answer, use the option that says so.
publish, unpublish and set_nda change what the public sees: they return a confirmation_token first. Ask the user to confirm,
then call again with the token. Show generated NDA passwords to the user once; they cannot be retrieved.`

type Result = Record<string, unknown>

function ok(data: Result) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }], structuredContent: data }
}

function fail(err: unknown) {
  const e = err instanceof ToolError ? { error: err.message, fix: err.fix } : { error: 'Something went wrong on the PortfolioX side. Try again in a moment.' }
  if (!(err instanceof ToolError)) console.error('[mcp] tool error', err)
  return { content: [{ type: 'text' as const, text: JSON.stringify(e, null, 2) }], isError: true }
}

const wrap = <A,>(fn: (args: A) => Promise<Result>) => async (args: A) => {
  try { return ok(await fn(args)) } catch (err) { return fail(err) }
}

export function createPortfolioServer(deps: Deps, userId: string): McpServer {
  const server = new McpServer({ name: 'portfoliox', version: '1.0.0' }, { instructions: INSTRUCTIONS })
  const caseId = z.string().describe('Case study id (from build_case_study or list_case_studies).')
  const confirm = z.string().optional().describe('Token from the first call. Omit on the first call; pass it after the user confirms.')

  server.registerTool('build_case_study', {
    title: 'Build a case study',
    description: 'Turns a project brief, process notes and design files into a complete, saved case study draft. Imports Figma frames or images, labels each screen, extracts facts, plans the sections, maps screens to them and writes the narrative using only the user\'s facts. Returns the draft id, a preview link, up to 3 open decisions with options, a provenance report and a quality score. Never blocks on missing information. Long runs can be resumed with run_id.',
    inputSchema: {
      brief: z.string().describe('The project in the user\'s words: problem, users, role, team, constraints, outcomes. Any order or length.'),
      process_notes: z.string().optional().describe('Methods, research findings, iterations, decisions, or a pasted design audit.'),
      assets: z.array(z.string()).describe('Design files: Figma file/page/frame links, Figma prototype links, public image URLs, YouTube/Vimeo/Loom/mp4 links.'),
      discipline: z.enum(DISCIPLINES).optional().describe('Inferred when omitted.'),
      title: z.string().optional(),
      mode: z.enum(['draft', 'publish']).optional().describe('"publish" also returns a publish_confirmation_token; it never publishes without confirmation.'),
      case_study_id: z.string().optional().describe('Rebuild into this existing case study instead of creating a new one.'),
      run_id: z.string().optional().describe('Resume a run that failed or timed out. Pass assets too to replace links that failed; other fields are ignored.'),
      force: z.boolean().optional().describe('Rebuild even if the same input was built before.'),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, wrap(args => svc.buildCaseStudy(deps, userId, args)))

  server.registerTool('answer_open_decisions', {
    title: 'Answer open decisions',
    description: 'Applies the user\'s answers to the open decisions from build_case_study and rewrites only the sections they affect. Each answer has the decision id, an option id (choice), free text, or both.',
    inputSchema: {
      case_study_id: caseId,
      answers: z.array(z.object({ id: z.string(), choice: z.string().optional(), text: z.string().optional() })).min(1),
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
  }, wrap(a => svc.answerOpenDecisions(deps, userId, a.case_study_id, a.answers)))

  server.registerTool('refine_section', {
    title: 'Refine a section',
    description: 'Rewrites one section following a plain-language instruction ("shorter", "lead with the research finding"). Adds no new facts; sentences with numbers not in the user\'s notes are dropped.',
    inputSchema: {
      case_study_id: caseId,
      section: z.string().describe('Section id, type (challenge, research, process, solution, impact...) or title.'),
      instruction: z.string(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
  }, wrap(a => svc.refineSection(deps, userId, a.case_study_id, a.section, a.instruction)))

  server.registerTool('regroup_screens', {
    title: 'Regroup screens',
    description: 'Moves visual blocks between sections, removes them, or changes captions. Get block ids from get_case_study. Moving to a section name that does not exist creates it.',
    inputSchema: {
      case_study_id: caseId,
      moves: z.array(z.object({ block_id: z.string(), to_section: z.string(), position: z.number().int().optional() })).optional(),
      remove: z.array(z.string()).optional(),
      captions: z.array(z.object({ block_id: z.string(), caption: z.string() })).optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: true },
  }, wrap(a => svc.regroupScreens(deps, userId, a.case_study_id, a)))

  server.registerTool('list_case_studies', {
    title: 'List case studies',
    description: 'Lists the user\'s case studies with id, title, published and NDA state.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  }, wrap(() => svc.listCaseStudies(deps, userId)))

  server.registerTool('get_case_study', {
    title: 'Get a case study',
    description: 'Returns a case study\'s sections, narratives, blocks (with ids) and open decisions.',
    inputSchema: { case_study_id: caseId },
    annotations: { readOnlyHint: true },
  }, wrap(a => svc.getCaseStudy(deps, userId, a.case_study_id)))

  server.registerTool('quality_report', {
    title: 'Quality report',
    description: 'Scores a case study against the PortfolioX rubric and lists what would make it stronger.',
    inputSchema: { case_study_id: caseId },
    annotations: { readOnlyHint: true },
  }, wrap(a => svc.getQuality(deps, userId, a.case_study_id)))

  server.registerTool('get_preview', {
    title: 'Get preview links',
    description: 'Returns the editor link, the portfolio preview link and, if published, the live link.',
    inputSchema: { case_study_id: caseId },
    annotations: { readOnlyHint: true },
  }, wrap(a => svc.getPreview(deps, userId, a.case_study_id)))

  server.registerTool('publish', {
    title: 'Publish a case study',
    description: 'Publishes a case study. Two steps: the first call returns what will happen and a confirmation_token; call again with the token after the user confirms. If the portfolio has no URL yet, pass slug.',
    inputSchema: { case_study_id: caseId, confirmation_token: confirm, slug: z.string().optional() },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  }, wrap(a => svc.publish(deps, userId, a.case_study_id, a.confirmation_token, a.slug)))

  server.registerTool('unpublish', {
    title: 'Unpublish a case study',
    description: 'Takes a case study offline. Two steps, like publish.',
    inputSchema: { case_study_id: caseId, confirmation_token: confirm },
    annotations: { readOnlyHint: false, destructiveHint: true },
  }, wrap(a => svc.unpublish(deps, userId, a.case_study_id, a.confirmation_token)))

  server.registerTool('set_nda', {
    title: 'Lock or unlock a case study',
    description: 'Puts a case study behind a password (NDA) or removes it. Two steps, like publish. Without a password, one is generated and returned once.',
    inputSchema: { case_study_id: caseId, enabled: z.boolean(), password: z.string().optional(), confirmation_token: confirm },
    annotations: { readOnlyHint: false, destructiveHint: true },
  }, wrap(a => svc.setNda(deps, userId, a.case_study_id, a.enabled, a.confirmation_token, a.password)))

  server.registerResource('profile', 'portfolio://profile', {
    title: 'Portfolio profile', description: 'The user\'s profile: name, URL, theme, layout, plan.', mimeType: 'application/json',
  }, async uri => {
    const p = await deps.store.getProfile(userId)
    const data = p ? { name: p.name, slug: p.slug, discipline: p.discipline, layout: p.layout, theme: p.theme, plan: p.plan } : null
    return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data) }] }
  })

  server.registerResource('case', new ResourceTemplate('portfolio://case/{id}', {
    list: async () => ({ resources: (await deps.store.listCaseStudies(userId)).map(c => ({ uri: `portfolio://case/${c.id}`, name: c.title, mimeType: 'application/json' })) }),
  }), { title: 'Case study', description: 'A case study\'s full content.', mimeType: 'application/json' }, async (uri, vars) => {
    const data = await svc.getCaseStudy(deps, userId, String(vars.id)).catch(() => null)
    return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data) }] }
  })

  server.registerPrompt('case_study_from_project', {
    title: 'Turn my project into a case study',
    description: 'Collects the brief, process and design links, then builds a draft.',
    argsSchema: { project: z.string().optional().describe('Anything you already know about the project.') },
  }, ({ project }) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `I want to add a project to my PortfolioX portfolio.${project ? `\n\nWhat I have so far:\n${project}` : ''}\n\nAsk me only for what's missing from: the problem and my role, the process I followed, and links to my Figma file or screens. Then call build_case_study, show me the preview link and the open decisions with their options, and keep it short.`,
      },
    }],
  }))

  return server
}
