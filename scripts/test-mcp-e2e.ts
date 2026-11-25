// Run: npx tsx scripts/test-mcp-e2e.ts
// End-to-end: real MCP JSON-RPC over the HTTP handler, with an in-memory store, a scripted LLM, a fake Figma
// file and a fake image fetcher. Walks the tab-1 flow: build → answer → regroup → refine → publish → NDA,
// plus auth, isolation, idempotency, resume after failure, confidentiality gating and model outage.
process.env.MCP_ENCRYPTION_KEY = 'test-key'
import bcrypt from 'bcryptjs'
import { generateToken } from '../lib/mcp/auth'
import { handleMcpRequest } from '../lib/mcp/handler'
import type { Deps } from '../lib/mcp/service'
import { FakeLLM, fakeFetcher, fakeFigma } from '../lib/mcp/testing/fakes'
import { MemoryStore } from '../lib/mcp/testing/memory-store'
import type { Profile } from '../types'

let bad = 0
let n = 0
function check(name: string, cond: unknown, detail?: unknown) {
  n++
  if (!cond) { bad++; console.log(`FAIL ${name}`, detail === undefined ? '' : JSON.stringify(detail, null, 2).slice(0, 1500)) }
}

const store = new MemoryStore()
const llm = new FakeLLM()
let fetcher = fakeFetcher()
const deps: Deps = {
  store, llm, appUrl: 'https://app.test',
  fetcher: (url) => fetcher(url),
  figmaFor: async () => fakeFigma(['User interviews', 'Competitor audit', 'Checkout flow', 'Wireframe 1', 'Wireframe 2', 'Checkout before', 'Checkout after', 'Payment screen', 'Saved cards']),
}

function addUser(id: string, plan: 'free' | 'pro' = 'free') {
  store.profiles.set(id, { id, name: id, plan, slug: null, role: 'user', layout: 'canvas' } as unknown as Profile)
  const t = generateToken()
  store.tokens.set(t.hash, { id: `tok-${id}`, userId: id, name: 'test', revoked: false })
  return t.token
}

let rpcId = 0
async function rpc(token: string | null, method: string, params: unknown = {}) {
  const res = await handleMcpRequest(new Request('https://app.test/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(token ? { Authorization: `Bearer ${token}` } : {}), 'mcp-protocol-version': '2025-06-18' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
  }), deps)
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call(token: string, name: string, args: Record<string, unknown> = {}): Promise<any> {
  const r = await rpc(token, 'tools/call', { name, arguments: args })
  const result = r.body?.result
  if (!result) throw new Error(`No result for ${name}: ${JSON.stringify(r.body)}`)
  const data = JSON.parse(result.content[0].text)
  return result.isError ? { __error: true, ...data } : data
}

const BRIEF = 'Redesigned checkout for a food delivery app. Drop-off was high at payment. I ran 8 user interviews, found trust issues with saved cards, did a competitor audit, two rounds of usability testing. We were a team of 4.'
const ASSETS = ['https://www.figma.com/design/FILE123/Checkout', 'https://www.figma.com/proto/FILE123/Checkout', 'https://cdn.example.com/hero-final.png']

async function main() {
  const alice = addUser('alice')
  const bob = addUser('bob')

  // ── Transport and auth ──
  check('no token → 401', (await rpc(null, 'tools/list')).status === 401)
  check('wrong token → 401', (await rpc('pxm_nope', 'tools/list')).status === 401)
  const init = await rpc(alice, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } })
  check('initialize', init.body?.result?.serverInfo?.name === 'portfoliox' && /build_case_study/.test(init.body.result.instructions), init.body)
  const list = await rpc(alice, 'tools/list')
  const names = (list.body?.result?.tools ?? []).map((t: { name: string }) => t.name).sort()
  const expected = ['answer_open_decisions', 'build_case_study', 'get_case_study', 'get_preview', 'list_case_studies', 'publish', 'quality_report', 'refine_section', 'regroup_screens', 'set_nda', 'unpublish']
  check('all v1 tools listed', JSON.stringify(names) === JSON.stringify(expected), names)
  const prompts = await rpc(alice, 'prompts/list')
  check('prompt listed', prompts.body?.result?.prompts?.[0]?.name === 'case_study_from_project')

  // ── Input validation ──
  check('rejects thin brief', (await call(alice, 'build_case_study', { brief: 'hi', assets: ASSETS })).__error)
  check('rejects no assets', (await call(alice, 'build_case_study', { brief: BRIEF, assets: [] })).__error)

  // ── Build ──
  const built = await call(alice, 'build_case_study', { brief: BRIEF, process_notes: 'Two rounds of usability testing on the new payment step.', assets: ASSETS })
  check('build: draft ready', built.status === 'draft_ready' && built.case_study_id, built)
  const id = built.case_study_id
  const cs = store.cases.get(id)!
  const types = cs.sections!.map(s => s.type)
  check('build: sections', JSON.stringify(types) === JSON.stringify(['overview', 'challenge', 'research', 'process', 'solution', 'impact']), types)
  const blocks = (t: string) => cs.sections!.find(s => s.type === t)!.blocks
  check('build: research has research+audit screens', blocks('research').length === 2, blocks('research'))
  check('build: solution has compare, figma embed', blocks('solution').some(b => b.type === 'compare') && blocks('solution').some(b => b.type === 'figma'), blocks('solution').map(b => b.type))
  check('build: wireframes in a gallery', blocks('process').some(b => b.type === 'gallery' && b.images!.length === 2), blocks('process'))
  check('build: fabricated 42% removed', !cs.sections!.find(s => s.type === 'impact')!.narrative.includes('42') && built.warnings.some((w: string) => w.includes('42%')), cs.sections!.find(s => s.type === 'impact'))
  check('build: unverified decision tagged inferred', built.provenance_report.some((p: { claim: string; source: string }) => p.claim.includes('verifiable') && p.source === 'inferred'))
  check('build: cover picked', !!cs.cover_image_url)
  check('build: assets stored content-addressed', [...store.assets.keys()].every(k => k.startsWith('alice/mcp/')) && store.assets.size === 10, store.assets.size)
  check('build: title from writer', cs.title === 'Checkout that people trust')
  check('build: not published', cs.published === false)
  const qids = built.open_decisions.map((q: { id: string }) => q.id)
  check('build: asks outcome + role only', JSON.stringify(qids) === '["outcome","role"]', qids)
  check('build: options on every question', built.open_decisions.every((q: { options: unknown[] }) => q.options.length >= 2))
  check('build: credits charged once (3)', store.credits.get('alice') === 7 && built.credits.charged === 3, built.credits)
  check('build: quality report', typeof built.quality_report.score === 'number')

  // ── Idempotency ──
  const again = await call(alice, 'build_case_study', { brief: BRIEF, process_notes: 'Two rounds of usability testing on the new payment step.', assets: ASSETS })
  check('idempotent: same case, no new credits, no duplicate', again.case_study_id === id && store.cases.size === 1 && store.credits.get('alice') === 7 && /Same input/.test(again.note), again)

  // ── Answer decisions ──
  check('answer: unknown id rejected', (await call(alice, 'answer_open_decisions', { case_study_id: id, answers: [{ id: 'nope', choice: 'x' }] })).__error)
  check('answer: bad option rejected', (await call(alice, 'answer_open_decisions', { case_study_id: id, answers: [{ id: 'role', choice: 'ceo' }] })).__error)
  const ans = await call(alice, 'answer_open_decisions', { case_study_id: id, answers: [{ id: 'outcome', choice: 'metric', text: 'Checkout conversion up 18%' }, { id: 'role', choice: 'lead' }] })
  const cs2 = store.cases.get(id)!
  const impact = cs2.sections!.find(s => s.type === 'impact')!
  check('answer: impact rewritten with 18%', impact.narrative.includes('18%'), impact.narrative)
  check('answer: stat block added', impact.blocks[0]?.type === 'stat' && impact.blocks[0].statValue === '18%', impact.blocks[0])
  check('answer: overview role + metric', cs2.overview_data?.role === 'Lead designer' && cs2.overview_data?.metrics[0]?.value === '18%', cs2.overview_data)
  check('answer: only affected sections rewritten', JSON.stringify(ans.rewritten_sections.sort()) === JSON.stringify(['impact', 'overview', 'process']), ans.rewritten_sections)
  check('answer: no decisions left', ans.open_decisions.length === 0)
  check('answer: 1 credit', store.credits.get('alice') === 6)

  // ── Read tools ──
  const got = await call(alice, 'get_case_study', { case_study_id: id })
  check('get: block ids exposed', got.sections.every((s: { blocks: { id: string }[] }) => s.blocks.every(b => b.id)))
  const listed = await call(alice, 'list_case_studies')
  check('list', listed.case_studies.length === 1 && listed.case_studies[0].id === id)
  const prev = await call(alice, 'get_preview', { case_study_id: id })
  check('preview links', prev.editor_url === `https://app.test/case-study/${id}` && prev.live_url === null, prev)
  const res = await rpc(alice, 'resources/read', { uri: `portfolio://case/${id}` })
  check('resource: case', JSON.parse(res.body.result.contents[0].text).id === id)

  // ── Regroup ──
  const gallery = got.sections.find((s: { type: string }) => s.type === 'process').blocks[0].id
  const embed = got.sections.find((s: { type: string }) => s.type === 'solution').blocks.find((b: { type: string }) => b.type === 'figma').id
  const rg = await call(alice, 'regroup_screens', { case_study_id: id, moves: [{ block_id: gallery, to_section: 'solution', position: 0 }], remove: [embed], captions: [{ block_id: gallery, caption: 'Early layouts' }] })
  const sol = rg.layout.find((s: { type: string }) => s.type === 'solution')
  check('regroup: moved to top of solution with caption', sol.blocks[0].id === gallery && sol.blocks[0].caption === 'Early layouts', sol)
  check('regroup: removed embed', !sol.blocks.some((b: { id: string }) => b.id === embed))
  check('regroup: bad block id errors', (await call(alice, 'regroup_screens', { case_study_id: id, remove: ['nope'] })).__error)

  // ── Refine ──
  const rf = await call(alice, 'refine_section', { case_study_id: id, section: 'research', instruction: 'shorter' })
  check('refine: fabricated 99 dropped', !rf.section.text.includes('99') && rf.removed_sentences.length === 1, rf)
  check('refine: unknown section errors with list', /Sections:/.test((await call(alice, 'refine_section', { case_study_id: id, section: 'nope', instruction: 'x' })).fix))

  // ── Isolation ──
  check('isolation: bob cannot read alice', (await call(bob, 'get_case_study', { case_study_id: id })).__error)
  check('isolation: bob cannot publish alice', (await call(bob, 'publish', { case_study_id: id, slug: 'bob' })).__error)
  check('isolation: bob lists nothing', (await call(bob, 'list_case_studies')).case_studies.length === 0)

  // ── Publish ──
  check('publish: needs slug', /no URL/.test((await call(alice, 'publish', { case_study_id: id })).error))
  check('publish: bad slug', (await call(alice, 'publish', { case_study_id: id, slug: 'a' })).__error)
  const p1 = await call(alice, 'publish', { case_study_id: id, slug: 'Alice Designs' })
  check('publish: asks to confirm first', p1.needs_confirmation && p1.confirmation_token && store.cases.get(id)!.published === false, p1)
  check('publish: bad token does not publish', (await call(alice, 'publish', { case_study_id: id, slug: 'alice-designs', confirmation_token: 'x.y' })).needs_confirmation)
  const p2 = await call(alice, 'publish', { case_study_id: id, slug: 'Alice Designs', confirmation_token: p1.confirmation_token })
  check('publish: live', p2.published && p2.live_url === `https://app.test/p/alice-designs/case/${id}` && store.profiles.get('alice')!.slug === 'alice-designs', p2)

  // ── NDA ──
  const n1 = await call(alice, 'set_nda', { case_study_id: id, enabled: true })
  check('nda: confirm first', n1.needs_confirmation && !store.cases.get(id)!.nda_enabled)
  const n2 = await call(alice, 'set_nda', { case_study_id: id, enabled: true, confirmation_token: n1.confirmation_token })
  const hash = (store.cases.get(id) as unknown as { nda_password_hash: string }).nda_password_hash
  check('nda: generated password shown once and hashed', n2.nda && n2.password && (await bcrypt.compare(n2.password, hash)), n2)
  check('nda: token for "on" cannot turn it off', (await call(alice, 'set_nda', { case_study_id: id, enabled: false, confirmation_token: n1.confirmation_token })).needs_confirmation)
  check('nda: short password rejected', (await call(alice, 'set_nda', { case_study_id: id, enabled: true, password: 'abc' })).__error)

  // ── Unpublish ──
  const u1 = await call(alice, 'unpublish', { case_study_id: id })
  const u2 = await call(alice, 'unpublish', { case_study_id: id, confirmation_token: u1.confirmation_token })
  check('unpublish', u2.published === false && store.cases.get(id)!.published === false)

  // ── Failure and resume ──
  fetcher = fakeFetcher({ failAll: true })
  const carol = addUser('carol')
  const failed = await call(carol, 'build_case_study', { brief: BRIEF, assets: ['https://cdn.example.com/c.png'] })
  check('fail: no assets → failed run with fix', failed.status === 'failed' && failed.stage === 'ingest' && /None of the assets/.test(failed.error) && failed.warnings.length, failed)
  check('fail: no credits charged', (store.credits.get('carol') ?? 10) === 10)
  fetcher = fakeFetcher()
  const resumed = await call(carol, 'build_case_study', { run_id: failed.run_id, brief: '', assets: [] })
  check('resume: same run finishes once the link works', resumed.status === 'draft_ready' && resumed.run_id === failed.run_id && !resumed.warnings.some((w: string) => w.includes('download')), resumed.warnings)
  check('resume: other users cannot resume it', (await call(bob, 'build_case_study', { run_id: failed.run_id, brief: '', assets: [] })).__error)
  const broken = await call(carol, 'build_case_study', { brief: `${BRIEF} Second project.`, assets: ['https://cdn.example.com/missing.png'] })
  const fixed = await call(carol, 'build_case_study', { run_id: broken.run_id, brief: '', assets: ['https://cdn.example.com/replacement.png'] })
  check('resume: new links replace broken ones', broken.status === 'failed' && fixed.status === 'draft_ready' && !fixed.warnings.some((w: string) => w.includes('download')), fixed.warnings)

  // ── Confidentiality gate ──
  const dave = addUser('dave', 'pro')
  const conf = await call(dave, 'build_case_study', { brief: `${BRIEF} This was an internal tool for Acme.`, assets: ['https://cdn.example.com/a.png', 'https://cdn.example.com/b-final.png'] })
  check('confidential: question asked', conf.open_decisions.some((q: { id: string }) => q.id === 'confidentiality'), conf.open_decisions)
  check('confidential: publish blocked', /open decision/.test((await call(dave, 'publish', { case_study_id: conf.case_study_id, slug: 'dave' })).error))
  check('confidential: mode publish withholds token', !conf.publish_confirmation_token)
  await call(dave, 'answer_open_decisions', { case_study_id: conf.case_study_id, answers: [{ id: 'confidentiality', choice: 'anonymise' }] })
  const daveText = store.cases.get(conf.case_study_id)!.sections!.map(s => s.narrative).join(' ')
  check('confidential: anonymised text has no client name', !/acme/i.test(daveText))
  check('confidential: publish now allowed', (await call(dave, 'publish', { case_study_id: conf.case_study_id, slug: 'dave' })).needs_confirmation)
  check('pro plan: no credits used', !store.credits.has('dave'))

  // ── Model outage ──
  llm.failOn = /./
  const erin = addUser('erin')
  const down = await call(erin, 'build_case_study', { brief: 'Checkout drop-off was high. I ran 8 interviews and found people distrusted saved cards. I decided to show card details before payment.', assets: ['https://cdn.example.com/wireframe-1.png', 'https://cdn.example.com/final.png'] })
  const downCs = store.cases.get(down.case_study_id)!
  check('outage: still builds a draft', down.status === 'draft_ready' && downCs.sections!.find(s => s.type === 'challenge')!.narrative.includes('drop-off'), down)
  check('outage: warnings explain fallback', down.warnings.some((w: string) => /model call failed/i.test(w)), down.warnings)
  check('outage: no credits charged', (store.credits.get('erin') ?? 10) === 10)
  llm.failOn = null

  // ── Free plan limits ──
  const frank = addUser('frank')
  store.credits.set('frank', 2)
  check('credits: insufficient blocked before any work', /needs 3 AI credit/.test((await call(frank, 'build_case_study', { brief: BRIEF, assets: ['https://cdn.example.com/a.png'] })).error))

  console.log(bad ? `${bad} of ${n} checks failed` : `ok (${n} checks)`)
  process.exit(bad ? 1 : 0)
}
main().catch(err => { console.error(err); process.exit(1) })
