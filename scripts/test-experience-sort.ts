// Run: npm run test:experience   (ordering rules for lib/experience.ts)
import { sortExperience, monthIndex } from '../lib/experience'
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
process.exit(fail ? 1 : 0)
