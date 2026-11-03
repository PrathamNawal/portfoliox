// Run: npx tsx scripts/test-career-ribbon.ts
// The six published roles (portfoliox-mu-nine.vercel.app), with "now" fixed at Nov 2026.
import { disciplineOf, layoutRibbon } from '../lib/career-ribbon'
import type { WorkExperience } from '../types'

const r = (id: string, company: string, role: string, start: string, end: string | null, cur = false, tag: string | null = null): WorkExperience => ({ id, company, role, start_month: start, end_month: end, is_current: cur, discipline_tag: tag, description: '' } as unknown as WorkExperience)
const roles = [
  r('hh', 'Hirehunch', 'Product and Graphic Designer', 'Mar 2026', null, true, 'UX Design'),
  r('cb', 'CompiledBox', 'UI/UX Designer', 'Jul 2025', 'Mar 2026'),
  r('lux', 'Luxorides', 'UI/UX Design Intern', 'Dec 2024', 'Jul 2025'),
  r('soc', 'Soccal', 'Product Design Intern', 'Dec 2024', 'Feb 2025', false, 'Product Design'),
  r('h2c', 'Here to Care', 'UI/UX Design Intern', 'Aug 2024', 'Nov 2024', false, 'UX Design'),
  r('tel', 'Telsys Web infotech', 'Graphic Designer', 'May 2021', 'Jun 2022', false, 'Brand/Graphic'),
]
let bad = 0
const eq = (name: string, got: unknown, want: unknown) => { if (JSON.stringify(got) !== JSON.stringify(want)) { bad++; console.log('FAIL', name, '\n  got ', JSON.stringify(got), '\n  want', JSON.stringify(want)) } }
const rb = layoutRibbon(roles, new Date(2026, 10, 15))
const by = Object.fromEntries(rb.bars.map(b => [b.id, b]))
eq('disciplines', roles.map(x => disciplineOf(x)), ['product', 'ux', 'ux', 'product', 'ux', 'brand'])
eq('headline', rb.headline, 'From graphic design to product design')
eq('experience is the union, not the span (13 + 3 + 23 months; the 1-month gap between Here to Care and Luxorides is not counted)', rb.totalMonths, 39)
eq('experience text', rb.experience, '3 yrs 3 mo')
eq('the 26-month gap is compressed to one break', rb.breaks.length, 1)
eq('Telsys is the first bar, at 0', Math.round(by.tel.left), 0)
eq('parallel roles use two lanes', rb.lanes, 2)
eq('Soccal sits in a different lane from Luxorides', by.soc.lane !== by.lux.lane, true)
eq('Telsys (13 months) is wider than Here to Care (3)', by.tel.width > by.h2c.width * 3, true)
eq('bars stay inside 0-100%', rb.bars.every(b => b.left >= 0 && b.left + b.width <= 100.01), true)
eq('now bar ends at 100%', Math.round(by.hh.left + by.hh.width), 100)
eq('the first year is labelled at 0', rb.ticks[0].year === 2021 && Math.round(rb.ticks[0].left) === 0, true)
eq('ticks are in order and spaced', rb.ticks.every((t, i) => i === 0 || t.left - rb.ticks[i - 1].left >= 7), true)
eq('one-discipline career has a plain headline', layoutRibbon([r('a', 'A', 'UX Designer', 'Jan 2024', 'Dec 2024')], new Date(2026, 0, 1)).headline, 'UX design')
console.log(bad ? `${bad} problem(s)` : 'ok')
process.exit(bad ? 1 : 0)
