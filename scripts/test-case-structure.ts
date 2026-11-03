// Run: npx tsx scripts/test-case-structure.ts
// Narratives copied from the published case studies (portfoliox-mu-nine.vercel.app): each pattern must land on the right node kind.
import { structure } from '../lib/case-structure'

const kinds = (t: string) => structure(t).map(n => n.k + (n.k === 'defs' ? `(${n.items.length})` : n.k === 'ul' ? `(${n.items.length})` : ''))
const cases: [string, string, string][] = [
  ['Paydaze solution', 'Paydaze brings four essential features together to help users manage their money throughout the month.\n\n01. Salary Planner\n\nPlan your monthly income by adding your salary, fixed expenses, and savings target. See how much money remains for other expenses.\n\n02. Quick Expense Tracker\n\nRecord daily expenses, organise them by category, and view recent transactions.\n\n03. Spendable Balance\n\nSee how much money is left after expenses and upcoming commitments. Get a daily or weekly spending guide until payday.\n\n04. Savings Goal\n\nSet a savings target, choose a monthly amount, and track progress without feeling pressured.', 'p,step,p,step,p,step,p,step,p'],
  ['Paydaze process', 'I broke the problem into four essential parts to define the core MVP.\n\n01. Plan — Understand monthly income, fixed expenses, and savings targets.\n\n02. Track — Record everyday expenses and monitor spending.\n\n03. Manage — Understand the remaining balance and plan spending until payday.\n\n04. Save — Set savings goals and track progress.\n\nThis helped me define four core features for Paydaze without adding unnecessary complexity.', 'p,defs(4),p'],
  ['Paydaze research', 'I explored three existing finance apps to understand how they approach budgeting, expense tracking, and financial management.\n\n1. Wallet by BudgetBakers\n\nExplored budgeting, transaction categorisation, and expense reports.\n\nResearch focus: Understanding monthly financial health.\n\n2. Money Manager Expense & Budget\n\nExplored manual expense tracking and budgeting.\n\nResearch focus: Making everyday expense tracking simple.\n\nResearch Focus\n\nUnderstand how existing apps help users manage their money and identify opportunities to make everyday spending decisions simpler.', 'p,step,p,p,step,p,p,h3,p'],
  ['Paydaze challenge', 'Managing money can be difficult when everyday expenses add up and there\'s still time left before the next payday.\n\nProblem Statement\n\nHow might we help young professionals in India manage their spending, make informed financial decisions, and save consistently without feeling restricted?\n\nKey Challenges\n\nUnderstanding monthly income and expenses.\n\nKeeping track of everyday spending.\n\nKnowing how much money is safe to spend.\n\nBuilding consistent saving habits.', 'p,h3,p,h3,ul(4)'],
  ['JusRecruit solution', 'The work helped establish a consistent visual presence across JusRecruit’s early digital touchpoints.\n\nBrand presence: Created a recognisable visual direction across social media and web assets.\n\nProduct storytelling: Translated hiring updates into accessible creatives.\n\nLaunch visibility: Designed social communication celebrating the Product Hunt Top 10.\n\nExternal recognition: The launch update reported that JusRecruit was featured in the Product Hunt newsletter reaching 1M+ subscribers.\n\nThe Product Hunt milestone reflects the broader product launch, rather than an outcome attributable to design alone.', 'p,defs(4),p'],
  ['JusRecruit process', 'Align on positioning\nCollaborated with the founder and Business Development team to understand the product, audience, and brand priorities.\n\nExplore visual directions\nUsed competitor research and creative references to guide decisions around typography, colour, layout, and imagery.\n\nTranslate ideas into visual stories\nDesigned creatives for hiring alerts, mock-interview feedback, and product education.', 'defs(3)'],
  ['HireHunch solution', 'HunchVue — Product storytelling\nHunchServe — Problem-led communication\nSeasonal campaigns — Brand expression\n\nThe Contribution\n\nAs the sole graphic designer, I worked across two connected responsibilities: helping define brand assets with Business Development and delivering ongoing social media creatives.', 'defs(3),h3,p'],
  ['HunchVue (plain prose stays plain)', 'Engineers use AI tools on the job every day, but technical interviews hadn\'t caught up — platforms either blocked AI use outright or had no way to see it happening at all.\n\nBoth options made the evaluation less trustworthy, right as AI-assisted engineering was becoming the norm.', 'p,p'],
  ['Two labels stay inline', 'Clarity: Communicate product value through clear hierarchy.\n\nConsistency: Use a recognisable green-led visual language.', 'p,p'],
]
let bad = 0
for (const [name, text, want] of cases) {
  const got = kinds(text).join(',')
  if (got !== want) { bad++; console.log(`MISMATCH ${name}\n  want ${want}\n  got  ${got}`) }
}
const num = structure(cases[0][1]).filter(n => n.k === 'step').map(n => n.k === 'step' ? n.n + ' ' + n.title : '')
if (num.join('|') !== '01 Salary Planner|02 Quick Expense Tracker|03 Spendable Balance|04 Savings Goal') { bad++; console.log('STEP NUMBERS', num) }
const leadFirst = structure(cases[7][1])[0]
if (!(leadFirst.k === 'p' && leadFirst.lead)) { bad++; console.log('LEAD missing') }
console.log(bad ? `${bad} problem(s)` : 'ok')
process.exit(bad ? 1 : 0)
