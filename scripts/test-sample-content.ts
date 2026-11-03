// Run: npx tsx scripts/test-sample-content.ts
// Text taken from the published case studies on portfoliox-mu-nine.vercel.app: sample leftovers must go, the owner's own text must stay.
import { isSampleText, scrubNarrative } from '../lib/sample-content'

const leaked = [
  // HireHunch: Mamaearth sample text in Research & Discovery
  'We ran shelf tests in 4 organised retail environments across Mumbai and Delhi NCR — modern trade (Reliance Smart, D-Mart) and pharmacy-adjacent (Apollo Pharmacy, Wellness Forever). The goal was to understand not just Mamaearth\'s visibility but competitive context.',
  '64% of test participants could not correctly group all Mamaearth products on a shelf without prior brand knowledge. For a brand with this level of awareness, that\'s a significant recognition failure.',
  'Brand audit across 60+ SKUs — photographed side by side. The incoherence that had built up over 6 years was immediately visible.',
  'Colour system derived from ingredient families — earth tones that feel natural without feeling dated.',
  'Final brand system applied across packaging, digital, and OOH — the coherence visible immediately when all SKUs are seen together.',
  // Paydaze: Zomato sample caption
  'Affinity mapping from 14 user interviews. The cluster around "unexpected costs" and "no delivery time visible" dominated every session.',
]
const own = [
  // HunchVue, Paydaze, JusRecruit, HireHunch, Street Food Safari: the owner's own text
  'Engineers use AI tools on the job every day, but technical interviews hadn\'t caught up — platforms either blocked AI use outright, testing candidates on a skill they\'d never actually use unaided, or had no way to see it happening at all.',
  'The feature set was driven by direct research rather than assumption: competitive analysis against existing technical interview tools to find where they broke down for real-world engineering work.',
  'The proctoring system didn\'t start as a granular log — the earlier shape was closer to a single "flag suspicious activity" signal. That wasn\'t enough on its own: a flag with no context just makes an interviewer suspicious.',
  'Managing money can be difficult when everyday expenses add up and there\'s still time left before the next payday.',
  'How might we help young professionals in India manage their spending, make informed financial decisions, and save consistently without feeling restricted?',
  'I broke the problem into four essential parts to define the core MVP.',
  'Plan your monthly income by adding your salary, fixed expenses, and savings target. See how much money remains for other expenses.',
  'As an emerging brand in the AI recruitment space, JusRecruit needed to communicate its value clearly, build recognition, and establish credibility across digital touchpoints.',
  'I explored competitor websites, recruitment platforms, social media creatives, and brand campaigns to understand category conventions and identify opportunities to make JusRecruit\u2019s communication distinctive.',
  'Launch visibility: Designed social communication celebrating JusRecruit\u2019s achievement of reaching the Product Hunt Top 10.',
  'The Dussehra design builds around a central mythological figure, a warm sunset, and an orange-led landscape. The Janmashtami design combines Krishna imagery with a stack of stones carrying product-related messages.',
  'As per rough estimates, there are ~2M street food vendors in India. Often we crave to have street food but are not able to find the best ones available near us.',
  'A natural next step would be to formalise the recurring visual elements into documented brand guidelines and evaluate which creative approaches generate stronger engagement using actual campaign data.',
  'I approached the work as a communication problem rather than a series of isolated design requests. Each creative needed a clear central message, a visual concept that reinforced it, and a hierarchy that made the content easy to scan.',
  'For HunchServe, I used an hourglass as the central visual metaphor for the hidden cost of technical interviews.',
  'HunchVue has onboarded 20+ clients since launch, validating that the core design holds up across real interview processes, not just internal testing.',
  'I explored three existing finance apps to understand how they approach budgeting, expense tracking, and financial management.',
  'The Product Hunt milestone reflects the broader product launch, rather than an outcome attributable to design alone.',
]
let bad = 0
for (const t of leaked) if (!isSampleText(t)) { bad++; console.log('NOT CAUGHT:', t.slice(0, 70)) }
for (const t of own) if (isSampleText(t)) { bad++; console.log('WRONGLY REMOVED:', t.slice(0, 70)) }
const A = own.find(t => t.startsWith('I approached'))!
const B = own.find(t => t.includes('hourglass'))!
const mixed = `${A}\n\n${leaked[0]}\n\nKey findings:\n\n- ${leaked[1]}\n\n${B}`
const cleaned = scrubNarrative(mixed)
if (cleaned.includes('Mamaearth') || !cleaned.includes('hourglass') || !cleaned.includes('communication problem')) { bad++; console.log('SCRUB WRONG:\n' + cleaned) }
console.log(bad ? `${bad} problem(s)` : 'ok')
process.exit(bad ? 1 : 0)
