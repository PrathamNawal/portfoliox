// Run: npm run test:experience   (ordering rules for lib/experience.ts)
import { sortExperience, monthIndex, durationMonths, formatDuration, formatRange, highlightMetrics, splitBullets } from '../lib/experience'
import { cleanScreens, pickStoryFields, plainText, storyHeadline, hueOf, startYear, screenRatio, isPortrait, visibleScreens, careerArc } from '../lib/experience-story'
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

// ── story layout helpers ──
const PFX = 'https://x.supabase.co/storage/v1/object/public/'
const sc = (o: any = {}) => ({ url: `${PFX}case-study-images/u/1.webp`, w: 1600, h: 900, ...o })
eq('screens: valid + caption trimmed', cleanScreens([sc({ caption: '  Home  ' })], PFX), [{ ...sc(), caption: 'Home' }])
eq('screens: null/empty ok', [cleanScreens(null, PFX), cleanScreens([], PFX)], [[], []])
eq('screens: http rejected', cleanScreens([sc({ url: 'http://x.supabase.co/storage/v1/object/public/a.webp' })], null), null)
eq('screens: foreign host rejected when prefix set', cleanScreens([sc({ url: 'https://evil.com/a.webp' })], PFX), null)
eq('screens: any https ok without prefix', cleanScreens([sc({ url: 'https://evil.com/a.webp' })], null)?.length, 1)
eq('screens: bad dims rejected', [0, -1, 1.5, 10001, '9'].map(w => cleanScreens([sc({ w })], PFX)), [null, null, null, null, null])
eq('screens: more than 12 rejected', cleanScreens(Array.from({ length: 13 }, () => sc()), PFX), null)
eq('screens: 12 ok', cleanScreens(Array.from({ length: 12 }, () => sc()), PFX)?.length, 12)
eq('screens: caption cut to 90', cleanScreens([sc({ caption: 'a'.repeat(120) })], PFX)?.[0].caption?.length, 90)
eq('screens: not an array rejected', cleanScreens({}, PFX), null)
eq('pick: only keys present', pickStoryFields({ role: 'x', headline: ' Big ' }), { update: { headline: 'Big' } })
eq('pick: nothing present -> empty update', pickStoryFields({ role: 'x' }), { update: {} })
eq('pick: empty text becomes null', pickStoryFields({ headline: '  ', stat_value: '', stat_label: null }), { update: { headline: null, stat_value: null, stat_label: null } })
eq('pick: headline too long', 'error' in pickStoryFields({ headline: 'a'.repeat(141) }), true)
eq('pick: stat limits', [pickStoryFields({ stat_value: 'a'.repeat(13) }), pickStoryFields({ stat_label: 'a'.repeat(41) })].map(r => 'error' in r), [true, true])
eq('pick: non-string rejected', 'error' in pickStoryFields({ headline: 5 }), true)
eq('pick: bad screens rejected', 'error' in pickStoryFields({ screens: 'nope' }), true)
eq('plainText', plainText('<ul><li>Cut <b>bounce</b> by 30%</li><li>R&amp;D &#39;ok&#39;</li></ul>'), "Cut bounce by 30% R&D 'ok'")
eq('headline: own wins', storyHeadline({ headline: ' Mine ', description: '<ul><li>First</li></ul>' }), 'Mine')
eq('headline: first li', storyHeadline({ headline: null, description: '<ul><li>First <b>one</b></li><li>Second</li></ul>' }), 'First one')
eq('headline: plain text', storyHeadline({ description: '<p>Just text</p>' }), 'Just text')
eq('headline: none', storyHeadline({ headline: undefined, description: null }), '')
eq('headline: cut at word boundary <= 140', (() => { const h = storyHeadline({ description: `<ul><li>${'word '.repeat(60)}</li></ul>` }); return [h.length <= 140, h.endsWith('…'), /word…$/.test(h)] })(), [true, true, true])
eq('hue: stable, in range, case-insensitive', [hueOf('Hiver') === hueOf(' hiver '), hueOf('Soccal') >= 0 && hueOf('Soccal') < 360, hueOf('A') !== hueOf('B')], [true, true, true])
eq('startYear', [startYear('Jul 2025'), startYear('soon'), startYear(null)], [2025, null, null])
eq('ratio clamps', [screenRatio({ w: 1600, h: 900 }), screenRatio({ w: 100, h: 1000 }), screenRatio({ w: 5000, h: 100 })], [1600 / 900, 0.4, 2.4])
eq('portrait', [isPortrait({ w: 390, h: 844 }), isPortrait({ w: 1000, h: 1200 }), isPortrait({ w: 1000, h: 1201 })], [true, false, true])
eq('visible', [visibleScreens(true), visibleScreens(false)], [5, 4])
eq('arc: oldest to newest, newest role per company', careerArc([
  { id: 'a2', company: 'A', is_current: true }, { id: 'b1', company: 'B', is_current: false }, { id: 'a1', company: 'A', is_current: false }, { id: 'c1', company: 'C', is_current: false },
]), [{ company: 'C', id: 'c1', current: false }, { company: 'B', id: 'b1', current: false }, { company: 'A', id: 'a2', current: true }])
eq('arc: empty', careerArc([]), [])

// ── capture-from-URL helpers ──
import { checkCaptureUrl, isProviderImageHost, pngSize } from '../lib/screenshot'
const ok = (u: string) => { const r = checkCaptureUrl(u); return 'url' in r ? r.url : null }
eq('capture: public pages ok', [ok('https://figma.com/proto/abc?x=1'), ok('example-site.in/work'), ok('http://my.site.co')], ['https://figma.com/proto/abc?x=1', 'https://example-site.in/work', 'http://my.site.co/'])
eq('capture: bad targets rejected', ['http://localhost:3000', 'https://127.0.0.1', 'https://192.168.1.1/x', 'http://[::1]/', 'https://intranet', 'https://a.local', 'https://x.internal', 'ftp://a.com', 'javascript:alert(1)', 'https://u:p@a.com', 'https://a.com:8080', '', '   '].map(ok), Array(13).fill(null))
eq('capture: non-string', ok(undefined as any), null)
eq('provider hosts', [isProviderImageHost('https://image.thum.io/x.png'), isProviderImageHost('https://iad.microlink.io/a.png'), isProviderImageHost('https://evil.com/a.png'), isProviderImageHost('http://image.thum.io/x'), isProviderImageHost('https://microlink.io.evil.com/a')], [true, true, false, false, false])
const png = new Uint8Array(33); png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); new DataView(png.buffer).setUint32(16, 1280); new DataView(png.buffer).setUint32(20, 800)
eq('pngSize', [pngSize(png), pngSize(new Uint8Array(40)), pngSize(new Uint8Array(3))], [{ w: 1280, h: 800 }, null, null])

process.exit(fail ? 1 : 0)
