// Run: npm run test:experience   (ordering rules for lib/experience.ts)
import { sortExperience, monthIndex, durationMonths, formatDuration, formatRange, highlightMetrics, splitBullets } from '../lib/experience'
const r = (id: string, start: string, end: string | null, cur = false, created = '2026-01-01') => ({ id, start_month: start, end_month: end, is_current: cur, created_at: created }) as any
let fail = 0
const check = (name: string, got: string[], want: string[]) => { const ok = got.join() === want.join(); if (!ok) fail++; console.log(ok ? 'ok  ' : 'FAIL', name, ok ? '' : `got ${got} want ${want}`) }
const ids = (xs: any[]) => sortExperience(xs).map(x => x.id)
check('current first, then by end desc', ids([r('old','Jan 2018','Dec 2019'), r('cur','Mar 2024',null,true), r('mid','Jan 2020','Jun 2023')]), ['cur','mid','old'])
check('two current: later start first', ids([r('a','Jan 2022',null,true), r('b','Jun 2024',null,true)]), ['b','a'])
check('later end beats later start', ids([r('A','Jan 2020','Dec 2024'), r('B','Mar 2022','Jun 2023')]), ['A','B'])
check('same end: later start first', ids([r('x','Jan 2020','Dec 2022'), r('y','Jun 2021','Dec 2022')]), ['y','x'])
check('non-current without end uses start', ids([r('p','Jan 2019',null), r('q','Jan 2021',null)]), ['q','p'])
check('month names are case-insensitive, any order of input', ids([r('1','jan 2020','FEB 2021'), r('2','Mar 2021','Apr 2022')]), ['2','1'])
check('unreadable dates go last', ids([r('bad','soon','later'), r('ok','Jan 2020','Dec 2020')]), ['ok','bad'])
check('full tie: newest created, then id', ids([r('a','Jan 2020','Dec 2020',false,'2026-01-01'), r('b','Jan 2020','Dec 2020',false,'2026-02-01')]), ['b','a'])
check('stable on re-sort', ids(sortExperience([r('b','Jan 2020','Dec 2021'), r('a','Jan 2022','Dec 2023')]) as any), ['a','b'])
check('empty/null safe', [String(sortExperience(null).length), String(sortExperience(undefined).length)], ['0','0'])
console.log('monthIndex Jan 2025 =', monthIndex('Jan 2025'), '| bad =', monthIndex('x'))

// ── readability helpers ──
const eq = (name: string, got: unknown, want: unknown) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fail++; console.log(ok ? 'ok  ' : 'FAIL', name, ok ? '' : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`) }
const now = new Date(2026, 10, 1) // Nov 2026
eq('duration closed role', durationMonths({ start_month: 'Jul 2025', end_month: 'Mar 2026', is_current: false }), 8)
eq('duration current role runs to now', durationMonths({ start_month: 'Jan 2026', end_month: null, is_current: true }, now), 10)
eq('duration unreadable start', durationMonths({ start_month: 'soon', end_month: null, is_current: false }), 0)
eq('formatDuration', [formatDuration(0), formatDuration(7), formatDuration(12), formatDuration(19), formatDuration(36)], ['1 mo', '7 mo', '1 yr', '1 yr 7 mo', '3 yrs'])
eq('formatRange', [formatRange({ start_month: 'Jul 2025', end_month: 'Mar 2026', is_current: false }), formatRange({ start_month: 'Jan 2025', end_month: null, is_current: true })], ['Jul 2025 – Mar 2026', 'Jan 2025 – Present'])
const marks = (h: string) => (highlightMetrics(h).match(/<mark class="pxp-metric">.*?<\/mark>/g) || []).map(m => m.replace(/<[^>]+>/g, ''))
eq('metrics: percent, K+, plus', marks('<li>Cut bounce by 30% and reached 260K+ users across 750+ partners</li>'), ['30%', '260K+', '750+'])
eq('metrics: before/after and money', marks('<li>Iteration time 7 days to 2 days; saved ₹5L and $2.5M, 3x faster</li>'), ['7 days to 2 days', '₹5L', '$2.5M', '3x'])
eq('metrics: ignores years, plain numbers, words', marks('<li>Joined in 2025 as designer 2, built Q4 roadmap, 8 Months</li>'), [])
eq('metrics: tags, attributes, entities untouched', highlightMetrics('<a href="/x?p=50%25" title="30%">link &#39;30&#39; &amp; 40%</a>'), '<a href="/x?p=50%25" title="30%">link &#39;30&#39; &amp; <mark class="pxp-metric">40%</mark></a>')
const li = (n: number) => Array.from({ length: n }, (_, i) => `<li>Bullet ${i + 1}</li>`).join('')
eq('split: 5 bullets -> 3 + 2', (() => { const r = splitBullets(`<ul>${li(5)}</ul>`); return r && [r.restCount, (r.head.match(/<li/g) || []).length, (r.rest.match(/<li/g) || []).length] })(), [2, 3, 2])
eq('split: 3 or fewer bullets -> null', splitBullets(`<ul>${li(3)}</ul>`), null)
eq('split: not a plain list -> null', [splitBullets(`Intro<ul>${li(6)}</ul>`), splitBullets(`<ul>${li(6)}<ul><li>x</li></ul></ul>`), splitBullets('plain text')], [null, null, null])

process.exit(fail ? 1 : 0)
