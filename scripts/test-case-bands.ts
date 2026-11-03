// Run: npx tsx scripts/test-case-bands.ts
// Impact chapters copied from the published case studies: a band only when something happened, never a hedge or a repeat.
import { stageOf } from '../lib/case-copy'
import type { CaseSection } from '../types'

const sec = (type: CaseSection['type'], title: string, narrative: string): CaseSection => ({ id: 'x', type, title, narrative, blocks: [] })
const cases: [string, CaseSection, (b: ReturnType<typeof stageOf>['band']) => boolean][] = [
  ['JusRecruit impact: the 1M+ newsletter sentence, not the caveat', sec('impact', 'Impact & Reflection', 'The work helped establish a consistent visual presence across JusRecruit’s early digital touchpoints, supporting communication around both the product and the brand.\n\nBrand presence: Created a recognisable visual direction across social media and web assets.\n\nLaunch visibility: Designed social communication celebrating JusRecruit’s achievement of reaching the Product Hunt Top 10.\n\nExternal recognition: The launch update reported that JusRecruit was featured in the Product Hunt newsletter reaching 1M+ subscribers. The supplied Product Hunt screenshot shows 140 upvotes and 27 comments at that point.\n\nThe Product Hunt milestone reflects the broader product launch, rather than an outcome attributable to design alone. It provides important context for the brand and launch communication I contributed to.'),
    b => !!b && b.kind === 'finale' && !!b.text && b.text.includes('1M+') && !/rather than/.test(b.text) && !b.text.startsWith('External')],
  ['HunchVue impact: the figure is the lead, the rest is a hedge: no band', sec('impact', 'Impact & Reflection', 'HunchVue has onboarded 20+ clients since launch, validating that the core design holds up across real interview processes, not just internal testing.\n\nThe product is still early in go-to-market. The next phase of design work depends on real usage data, direct customer feedback, and how the interviewing landscape evolves.'), b => b === null],
  ['HireHunch impact: next steps only: no band', sec('impact', 'Impact & Reflection', 'The key design consideration was choosing the right visual device for the communication objective. Product-led creatives relied on strong headlines and structured information.\n\nA natural next step would be to formalise the recurring visual elements into documented brand guidelines and evaluate which creative approaches generate stronger engagement using actual campaign data.'), b => b === null],
  ['Impact with a figure list: numbers band', sec('impact', 'Impact', 'We shipped the new checkout to every user after a staged rollout over four weeks.\n\n- 32% fewer abandoned carts at the payment step.\n- 18% more repeat orders month over month.\n\nThe team kept the same funnel review for two more quarters to confirm it held.'), b => !!b && b.kind === 'stats'],
]
let bad = 0
for (const [name, s, ok] of cases) {
  const { band } = stageOf(s)
  if (!ok(band)) { bad++; console.log('FAIL', name, JSON.stringify(band)) }
}
console.log(bad ? `${bad} problem(s)` : 'ok')
process.exit(bad ? 1 : 0)
