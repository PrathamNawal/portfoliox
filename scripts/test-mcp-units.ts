// Run: npx tsx scripts/test-mcp-units.ts
// Unit tests for the deterministic parts of the MCP pipeline: claim validator, question policy, structure
// planner, screen heuristics, Figma URL parsing, ingest safety, quality rubric, tokens and encryption.
process.env.MCP_ENCRYPTION_KEY = 'test-key'
import { checkConfirmToken, decryptSecret, encryptSecret, generateToken, hashToken, bearerToken, makeConfirmToken } from '../lib/mcp/auth'
import { parseFigmaUrl, listFrames } from '../lib/mcp/figma'
import { parseJsonReply } from '../lib/mcp/llm'
import { detectContradictions, emptyFacts, heuristicFacts } from '../lib/mcp/pipeline/facts'
import { classifyAsset, isSafePublicUrl, sampleFrames } from '../lib/mcp/pipeline/ingest'
import { heuristicCaption, heuristicKind } from '../lib/mcp/pipeline/labels'
import { blocksFor, inferDiscipline, MAX_IMAGES_PER_SECTION, planStructure } from '../lib/mcp/pipeline/plan'
import { qualityReport } from '../lib/mcp/pipeline/quality'
import { applyAnswers, blocksPublish, chooseQuestions, metricFrom } from '../lib/mcp/pipeline/questions'
import { anonymise, enforceClaims, hasPlaceholder, untracedNumbers, unverifiedNames } from '../lib/mcp/pipeline/validate'
import { fakeFigma } from '../lib/mcp/testing/fakes'
import type { Screen } from '../lib/mcp/types'

let bad = 0
let n = 0
function check(name: string, cond: unknown, detail?: unknown) {
  n++
  if (!cond) { bad++; console.log(`FAIL ${name}`, detail ?? '') }
}

async function main() {
  // ── Claim validator ──
  const corpus = 'I ran 8 user interviews and two rounds of testing. Conversion went from 2.1% to 3,400 orders.'
  check('traced numbers pass', untracedNumbers('After 8 interviews and 2 rounds, 3400 orders and 2.1%.', corpus).length === 0, untracedNumbers('After 8 interviews and 2 rounds, 3400 orders and 2.1%.', corpus))
  check('untraced number caught', untracedNumbers('Conversion rose 42%.', corpus).join() === '42%')
  check('currency caught', untracedNumbers('Saved $1.2m a year.', corpus).length === 1)
  const e = enforceClaims('I ran 8 interviews. Conversion rose 42% overnight! People trusted it.\n\nRetention up 3x. Still good.', corpus)
  check('removes only bad sentences', e.text === 'I ran 8 interviews. People trusted it.\n\nStill good.', e.text)
  check('reports removals', e.removed.length === 2 && e.removed[0].claims[0] === '42%', e.removed)
  check('drops emptied paragraph', enforceClaims('Up 50%.\n\nFine.', corpus).text === 'Fine.')
  check('numbered step markers are not claims', enforceClaims('01. Plan the work.\n02. Ship it.', '').text === '01. Plan the work.\n02. Ship it.', enforceClaims('01. Plan the work.\n02. Ship it.', '').text)
  check('unverified names', JSON.stringify(unverifiedNames('We partnered with Stripe on this. I used Figma.', 'notes about payments')) === '["Stripe"]', unverifiedNames('We partnered with Stripe on this. I used Figma.', 'notes'))
  check('names in corpus pass', unverifiedNames('We partnered with Stripe.', 'stripe integration').length === 0)
  check('anonymise', anonymise('Acme wanted it. For ACME users.', 'Acme') === 'the client wanted it. For the client users.')
  check('placeholder detection', hasPlaceholder('Result: [[add metric]]') && hasPlaceholder('TBD') && !hasPlaceholder('All done'))

  // ── Facts heuristics ──
  check('contradiction detected', detectContradictions('This was a solo project. I worked with a team of 6.').length === 1)
  check('sole designer on a team is not a contradiction', detectContradictions('I was the sole designer on a team of 6 engineers.').length === 0 && detectContradictions('I designed it alone.').length === 0)
  const hf = heuristicFacts({ brief: 'Checkout drop-off was high. I ran 8 interviews. Conversion went up 18% after launch. This is an internal tool.', assets: [] })
  check('heuristic facts: problem', hf.problem?.text === 'Checkout drop-off was high.')
  check('heuristic facts: methods', hf.methods.length === 1)
  check('heuristic facts: outcome metric', hf.outcomes[0]?.metric?.value === '18%', hf.outcomes)
  check('heuristic facts: confidential', hf.confidentialSignals.includes('internal'))
  check('metricFrom', JSON.stringify(metricFrom('checkout conversion up 18%')) === JSON.stringify({ value: '18%', label: 'checkout conversion up' }), metricFrom('checkout conversion up 18%'))
  check('metricFrom none', metricFrom('people loved it') === undefined)

  // ── Question policy ──
  const f = emptyFacts()
  f.team = { text: 'team of 4', source: 'provided' }
  const qs = chooseQuestions(f, [], [])
  check('asks outcome and role', qs.map(q => q.id).join() === 'outcome,role', qs.map(q => q.id))
  check('role default contributor on team', qs.find(q => q.id === 'role')?.default === 'contributor')
  const f2 = { ...emptyFacts(), contradictions: [{ topic: 'team', a: 'solo', b: 'team of 6' }], confidentialSignals: ['NDA'] }
  const q2 = chooseQuestions(f2, [], [])
  check('max three questions', q2.length === 3, q2.map(q => q.id))
  check('contradiction first', q2[0].id === 'contradiction-0')
  check('publish blocked by contradiction', !!blocksPublish(q2))
  check('answered questions not re-asked', !chooseQuestions(f2, [], [{ id: 'contradiction-0', choice: 'a' }]).some(q => q.id === 'contradiction-0'))
  const lowScreens = Array.from({ length: 5 }, (_, i) => ({ id: `s${i}`, source: 'image', name: 'x', url: 'u', kind: 'hifi', confidence: 0.3, order: i }) as Screen)
  const f3 = { ...emptyFacts(), role: { text: 'Lead', source: 'provided' as const }, outcomes: [{ text: 'up 5%', source: 'provided' as const }] }
  check('grouping asked when labels are unsure', chooseQuestions(f3, lowScreens, []).map(q => q.id).join() === 'grouping')
  check('nothing asked when facts are complete', chooseQuestions(f3, [], []).length === 0)
  const applied = applyAnswers(f, [{ id: 'outcome', choice: 'metric', text: 'Conversion up 18%' }, { id: 'role', choice: 'lead', text: 'owned checkout' }])
  check('answer → outcome metric', applied.outcomes[0]?.metric?.value === '18%' && applied.outcomes[0].source === 'provided')
  check('answer → role', applied.role?.text === 'Lead designer, owned checkout')
  check('answer → concept', applyAnswers(f, [{ id: 'outcome', choice: 'concept' }]).isConcept === true)
  check('answers do not mutate input', f.outcomes.length === 0)

  // ── Structure planning ──
  const screens: Screen[] = [
    { id: 's1', source: 'figma', name: 'Interviews', url: 'u1', kind: 'research', confidence: 0.9, order: 0 },
    { id: 's2', source: 'figma', name: 'Wire 1', url: 'u2', kind: 'wireframe', confidence: 0.9, order: 1 },
    { id: 's3', source: 'figma', name: 'Wire 2', url: 'u3', kind: 'wireframe', confidence: 0.9, order: 2 },
    { id: 's4', source: 'figma', name: 'Before', url: 'u4', kind: 'before', confidence: 0.9, order: 3 },
    { id: 's5', source: 'figma', name: 'After', url: 'u5', kind: 'after', confidence: 0.9, order: 4 },
    { id: 's6', source: 'figma-embed', name: 'Prototype', url: 'https://www.figma.com/proto/abc', kind: 'prototype', confidence: 0.9, order: 5 },
    { id: 's7', source: 'figma', name: 'Final', url: 'u7', kind: 'hifi', confidence: 0.9, order: 6 },
  ]
  const input = { brief: 'Redesigned checkout', assets: [] }
  const plan = planStructure('ux', { ...emptyFacts(), methods: [{ text: 'interviews', source: 'provided' }] }, screens, input)
  check('ux plan sections', plan.map(p => p.type).join() === 'overview,challenge,research,process,solution,impact', plan.map(p => p.type))
  const sol = plan.find(p => p.type === 'solution')!
  const solBlocks = blocksFor(sol, screens)
  check('compare block from before/after', solBlocks[0].type === 'compare' && solBlocks[0].beforeUrl === 'u4' && solBlocks[0].afterUrl === 'u5')
  check('figma embed block', solBlocks.some(b => b.type === 'figma'))
  check('wireframes become one gallery', blocksFor(plan.find(p => p.type === 'process')!, screens).map(b => b.type).join() === 'gallery')
  const noResearch = planStructure('ux', emptyFacts(), screens.filter(s => s.kind !== 'research'), input)
  check('research dropped without evidence', !noResearch.some(p => p.type === 'research'))
  check('whatsnext kept when mentioned', planStructure('ux', emptyFacts(), [], { brief: 'Next steps: add wallets', assets: [] }).some(p => p.type === 'whatsnext'))
  const motionPlan = planStructure('motion', { ...emptyFacts(), findings: [{ text: 'x', source: 'provided' }] }, [], input)
  check('motion gets research when there is evidence', motionPlan.map(p => p.type).join() === 'overview,challenge,research,process,solution,impact', motionPlan.map(p => p.type))
  const many = Array.from({ length: 30 }, (_, i) => ({ id: `m${i}`, source: 'figma', name: `Screen ${i}`, url: `m${i}`, kind: 'hifi', confidence: 0.9, order: i }) as Screen)
  const big = planStructure('ux', emptyFacts(), many, input)
  check('overflow goes to More screens', big.find(p => p.type === 'solution')!.screenIds.length === MAX_IMAGES_PER_SECTION && big.at(-1)!.title === 'More screens' && big.at(-1)!.screenIds.length === 18)
  check('discipline inferred: brand', inferDiscipline(undefined, emptyFacts(), [], { brief: 'A new visual identity and logo', assets: [] }) === 'brand')
  check('discipline: given wins', inferDiscipline('illustration', { ...emptyFacts(), discipline: 'ux' }, [], input) === 'illustration')

  // ── Screen heuristics ──
  check('heuristic: wireframe', heuristicKind('Lo-fi checkout').kind === 'wireframe')
  check('heuristic: competitor audit', heuristicKind('Competitor audit').kind === 'audit')
  check('heuristic: before', heuristicKind('Checkout - before').kind === 'before')
  check('heuristic: unknown is low confidence', heuristicKind('Frame 12').confidence < 0.5)
  check('caption cleanup', heuristicCaption('checkout_flow-v2 copy 3') === 'Checkout flow v2' && heuristicCaption('Frame 12') === '', heuristicCaption('checkout_flow-v2 copy 3'))

  // ── Figma ──
  const ref = parseFigmaUrl('https://www.figma.com/design/AbC123/Checkout?node-id=12-34&t=x')
  check('figma design url', ref?.fileKey === 'AbC123' && ref.nodeId === '12:34' && !ref.isPrototype, ref)
  check('figma proto url', parseFigmaUrl('https://www.figma.com/proto/AbC123/Checkout')?.isPrototype === true)
  check('figma: rejects other hosts', parseFigmaUrl('https://figma.com.evil.test/file/AbC') === null && parseFigmaUrl('not a url') === null)
  const api = fakeFigma(['Interviews', 'Wireframe', 'Final'])
  check('listFrames: whole file', (await listFrames(api, parseFigmaUrl('https://www.figma.com/file/K/x')!)).length === 3)
  check('listFrames: page node', (await listFrames(api, parseFigmaUrl('https://www.figma.com/file/K/x?node-id=0-1')!)).length === 3)
  check('listFrames: single frame', (await listFrames(api, parseFigmaUrl('https://www.figma.com/file/K/x?node-id=1-2')!)).map(f => f.name).join() === 'Wireframe')

  // ── Ingest safety ──
  check('classify video', classifyAsset('https://youtu.be/abc') === 'video' && classifyAsset('https://www.loom.com/share/abc') === 'video')
  check('classify image', classifyAsset('https://cdn.test/a.png') === 'image')
  check('classify junk', classifyAsset('hello there') === 'unknown')
  check('blocks private addresses', !isSafePublicUrl('http://127.0.0.1/x') && !isSafePublicUrl('http://169.254.169.254/latest') && !isSafePublicUrl('http://10.0.0.2') && !isSafePublicUrl('file:///etc/passwd') && !isSafePublicUrl('http://localhost:3000'))
  check('allows public', isSafePublicUrl('https://cdn.example.com/a.png'))
  const sampled = sampleFrames(Array.from({ length: 100 }, (_, i) => i), 40)
  check('sample frames keeps ends', sampled.length === 40 && sampled[0] === 0 && sampled[39] === 99)

  // ── Quality ──
  const q = qualityReport({ title: 'Untitled', cover_image_url: null, overview_data: null, sections: [{ id: 'a', type: 'challenge', title: 'C', narrative: 'short', blocks: [] }] })
  check('quality flags gaps', q.score < 50 && q.suggestions.length > 3, q)
  const words = Array(40).fill('word').join(' ')
  const good = qualityReport({
    title: 'Real title', cover_image_url: 'c', overview_data: { summary: 'I redesigned the checkout for a delivery app so that more people complete their orders.', role: 'Lead', timeline: '', team: '', metrics: [] },
    sections: ['challenge', 'research', 'process', 'solution', 'impact'].map(t => ({ id: t, type: t as 'challenge', title: t, narrative: words, blocks: [{ id: 'b', type: 'image', sectionLabel: t, caption: 'cap' }] })),
  })
  check('quality: good case study scores 100', good.score === 100, good.suggestions)

  // ── Auth helpers ──
  const t = generateToken()
  check('token format', t.token.startsWith('pxm_') && t.hash === hashToken(t.token) && t.hash.length === 64)
  check('bearer parsing', bearerToken(`Bearer ${t.token}`) === t.token && bearerToken('Bearer abc') === null && bearerToken(null) === null)
  check('encrypt roundtrip', decryptSecret(encryptSecret('figd_secret')) === 'figd_secret')
  check('encrypt is randomised', encryptSecret('x') !== encryptSecret('x'))
  const ct = makeConfirmToken('u1', 'publish', 'c1')
  check('confirm token valid', checkConfirmToken(ct, 'u1', 'publish', 'c1'))
  check('confirm token bound to user/action/target', !checkConfirmToken(ct, 'u2', 'publish', 'c1') && !checkConfirmToken(ct, 'u1', 'unpublish', 'c1') && !checkConfirmToken(ct, 'u1', 'publish', 'c2'))
  check('confirm token expires', !checkConfirmToken(ct, 'u1', 'publish', 'c1', Date.now() + 11 * 60_000))
  check('confirm token tamper', !checkConfirmToken(ct.slice(0, -2) + 'xx', 'u1', 'publish', 'c1') && !checkConfirmToken(undefined, 'u1', 'publish', 'c1'))

  // ── LLM reply parsing ──
  check('json in fence', parseJsonReply<{ a: number }>('Sure!\n```json\n{"a":1}\n```').a === 1)
  check('json in prose', parseJsonReply<{ a: number }>('Here: {"a":2} done').a === 2)

  console.log(bad ? `${bad} of ${n} checks failed` : `ok (${n} checks)`)
  process.exit(bad ? 1 : 0)
}
main()
