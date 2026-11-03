// Run: npx tsx scripts/test-recs.ts
// The two published recommendations (portfoliox-mu-nine.vercel.app) plus the fixtures.
import { cleanQuote, highlightsOf, matchRole, segments, signalCounts } from '../lib/recs'

const T = 'Muskan is a highly creative designer with a keen eye for detail. Her designs are visually appealing and well thought out, adding great value to our project. It was a pleasure working with her, and I look forward to seeing her future work!'
const S = 'I had the privilege of collaborating with Muskan at Umbrella Room Ventures, where we jointly led end-to-end design for Luxorides—covering the Landing Page, Checkout Flow, and Luxury Car Rental Services. Muskan excels at translating user needs into elegant, intuitive designs, with an eye for detail t'
let bad = 0
const eq = (name: string, got: unknown, want: unknown) => { if (JSON.stringify(got) !== JSON.stringify(want)) { bad++; console.log('FAIL', name, '\n  got ', JSON.stringify(got), '\n  want', JSON.stringify(want)) } }

eq('cleanQuote drops the dangling fragment', cleanQuote(S).endsWith('with an eye for detail…'), true)
eq('cleanQuote leaves a finished quote', cleanQuote(T), T)
const counts = signalCounts([{ quote: T }, { quote: S }])
eq('detail counted for both quotes', counts.find(c => c.id === 'detail')?.count, 2)
eq('top signal is the shared one', counts[0].id, 'detail')
eq('at most six signals', counts.length <= 6, true)
const hl = (q: string) => highlightsOf(q).map(([a, b]) => cleanQuote(q).slice(a, b))
const hT = hl(T), hS = hl(S)
eq('two highlights for Tejendra, each short', hT.length === 2 && hT.every(x => x.length <= 80), true)
eq('Soccal quote highlights the detail claim', hT.some(x => /eye for detail/.test(x)), true)
eq('Luxorides quote highlights end-to-end work', hS.some(x => /end-to-end/.test(x)), true)
eq('segments reassemble the cleaned quote', segments(S).map(s => s.text).join(''), cleanQuote(S))
eq('prefer keeps that signal among the highlights', highlightsOf(S, 'needs').some(([a, b]) => /needs/.test(cleanQuote(S).slice(a, b))), true)
const roles = [{ id: 'a', company: 'Luxorides', start_month: 'Dec 2024', is_current: false }, { id: 'b', company: 'Soccal', start_month: 'Dec 2024', is_current: false }, { id: 'c', company: 'Telsys Web infotech', start_month: 'May 2021', is_current: false }]
eq('Luxorides role matched', matchRole({ title_and_company: 'UX Designer, Luxorides', quote: S }, roles)?.id, 'a')
eq('Soccal role matched', matchRole({ title_and_company: 'Co Founder, Soccal', quote: T }, roles)?.id, 'b')
eq('no match when the company is not a role', matchRole({ title_and_company: 'Head of Product, Hiver', quote: 'Great.' }, roles), null)
console.log(bad ? `${bad} problem(s)` : 'ok')
process.exit(bad ? 1 : 0)
