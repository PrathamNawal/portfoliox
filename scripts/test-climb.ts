// Run: npx tsx scripts/test-climb.ts
// Descriptions are the published ones (shortened) for the roles of portfoliox-mu-nine.vercel.app.
import { beatOf, bulletsOf, inOrder, shorten, skillsAdded, stopAt } from '../lib/climb'
import type { WorkExperience } from '../types'

const r = (company: string, role: string, start: string, end: string | null, description: string, extra: Partial<WorkExperience> = {}): WorkExperience =>
  ({ id: company, company, role, start_month: start, end_month: end, is_current: end === null, description, discipline_tag: null, ...extra } as unknown as WorkExperience)
const li = (...l: string[]) => `<ul>${l.map(x => `<li>${x}</li>`).join('')}</ul>`
const roles = [
  r('Luxorides', 'UI/UX Design Intern', 'Dec 2024', 'Jul 2025', li('Led design of web and mobile interfaces for Luxorides, a luxury car rental platform', 'Built a design system covering typography, color palettes, and UI components', 'Reduced homepage bounce rate by 30% through usability testing and iterative design improvements', 'Partnered with cross functional teams to align design decisions with business objectives')),
  r('Telsys', 'Graphic Designer', 'May 2021', 'Jun 2022', li('Created visuals and digital assets for Webzon.in, a business platform client', 'Managed design projects end to end, maintaining brand consistency across deliverables', 'Promoted from Graphic Design Intern to full time Graphic Designer within 7 months for strong performance')),
  r('Soccal', 'Product Design Intern', 'Dec 2024', 'Feb 2025', li('Led design of core user flows', 'Built the onboarding flow and initial homepage design', 'Improved onboarding funnel conversion by 25% through a redesigned visual language')),
  r('Hirehunch', 'Product and Graphic Designer', 'Mar 2026', null, 'Own end-to-end product design of HunchVue, an AI-native technical interviewing platform used by 500+ companies hiring engineering talent worldwide.&nbsp;'),
  r('Here to Care', 'UI/UX Design Intern', 'Aug 2024', 'Nov 2024', li('Owned the entire design process solo, from concept to final product', 'Shaped the product design behind a launch that reached 260K+ active users globally, including 60K+ in India')),
]
let bad = 0
const eq = (name: string, got: unknown, want: unknown) => { if (JSON.stringify(got) !== JSON.stringify(want)) { bad++; console.log('FAIL', name, '\n  got ', JSON.stringify(got), '\n  want', JSON.stringify(want)) } }

const ord = inOrder(roles)
eq('oldest first, current role last', ord.map(x => x.company), ['Telsys', 'Here to Care', 'Soccal', 'Luxorides', 'Hirehunch'])
eq('bullets from html', bulletsOf('<ul><li>aa bb</li><li>cc&nbsp;dd</li></ul>').join('|'), 'aa bb|cc dd')
eq('bullets from plain lines', bulletsOf('  - one two\n  • three four').join('|'), 'one two|three four')
eq('bullets of nothing', bulletsOf(null), [])
eq('shorten leaves short text alone', shorten('short text', 50), 'short text')
eq('shorten cuts at a word', shorten('one two three four five six seven', 15), 'one two three…')

const lux = beatOf(roles[0])
eq('Luxorides number is 30%', lux.highlight?.value, '30%')
eq('Luxorides lead is the first bullet', lux.lead.startsWith('Led design of web and mobile'), true)
eq('Soccal number is 25%', beatOf(roles[2]).highlight?.value, '25%')
eq('Hirehunch number is 500+', beatOf(roles[3]).highlight?.value, '500+')
eq('Here to Care number is 260K+', beatOf(roles[4]).highlight?.value, '260K+')
eq('"7 months" is not a number worth showing', beatOf(roles[1]).highlight, null)
eq('Telsys still has a lead', beatOf(roles[1]).lead.startsWith('Created visuals'), true)
eq('a lone bullet with a number leads, and the number stands alone', [beatOf(roles[3]).lead.length > 0, beatOf(roles[3]).highlight?.text], [true, ''])
eq('stored stat wins', beatOf({ ...roles[0], stat_value: '2x', stat_label: 'faster' } as WorkExperience).highlight, { value: '2x', text: 'faster' })
eq('stored headline wins', beatOf({ ...roles[0], headline: 'Made it simple' } as WorkExperience).lead, 'Made it simple')

const added = skillsAdded(ord)
eq('first role adds graphic design and brand', added[0].slice(0, 2), ['Graphic design', 'Brand consistency'])
eq('a skill is added once', added.reduce((n, l) => n + l.filter(s => s === 'Graphic design').length, 0), 1)
eq('no more than three per role', added.every(l => l.length <= 3), true)
eq('the toolkit grows toward product work', added.flat().indexOf('Graphic design') < added.flat().indexOf('Product design'), true)
eq('no duplicates across roles', added.flat().length, new Set(added.flat()).size)

eq('stop at the start', stopAt(0, 5), { x: 0, index: 0 })
eq('stop in the middle', stopAt(0.5, 5), { x: 0.5, index: 2 })
eq('stop past the end is clamped', stopAt(1.4, 5), { x: 1, index: 4 })
eq('a single role has nowhere to walk', stopAt(0.7, 1), { x: 0, index: 0 })
console.log(bad ? `${bad} problem(s)` : 'ok')
process.exit(bad ? 1 : 0)
