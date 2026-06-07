import type { CaseSection, OverviewData, CaseDiscipline } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Sample content is written at senior product designer standard.
// It should show: specific methodology, real constraints, clear decision logic,
// honest reflection. No buzzword soup. No vague outcomes.
// ─────────────────────────────────────────────────────────────────────────────

function id() { return Math.random().toString(36).slice(2, 10) }

// ── SVG design artifacts (in /public/samples/) ────────────────────────────────
const IMG = {
  funnel:    '/samples/zomato-lofi-checkout.svg',
  research:  '/samples/zomato-research.svg',
  wireframe: '/samples/zomato-lofi-checkout.svg',
  before:    '/samples/zomato-hifi-before.svg',
  after:     '/samples/zomato-hifi-after.svg',
  testing:   '/samples/zomato-research.svg',
  metrics:   '/samples/zomato-research.svg',
  brand1:    '/samples/mamaearth-brand-audit.svg',
  brand2:    '/samples/mamaearth-color-system.svg',
  brand3:    '/samples/mamaearth-color-system.svg',
}

// ─────────────────────────────────────────────────────────────────────────────
// UX / PRODUCT DESIGN — Zomato Checkout Redesign
// ─────────────────────────────────────────────────────────────────────────────

const ZOMATO_OVERVIEW: OverviewData = {
  summary: 'Redesigning Zomato\'s checkout to eliminate friction at the moment of highest purchase intent — reducing cart abandonment by 32% in 12 weeks.',
  role: 'Senior Product Designer',
  timeline: '14 weeks',
  team: '2 designers, 1 design lead, 3 PMs, 6 engineers',
  metrics: [
    { value: '−32%', label: 'Cart abandonment' },
    { value: '+18%', label: 'Repeat order rate' },
    { value: '4.2★', label: 'App Store (from 3.8)' },
  ],
}

const ZOMATO_SECTIONS: CaseSection[] = [
  {
    id: id(), type: 'overview', title: 'Overview', narrative: '', blocks: [], isSample: true,
  },
  {
    id: id(), type: 'challenge', title: 'The Challenge', isSample: true,
    narrative: `Zomato loses millions in potential GMV at checkout every day — not because the food isn't good, but because the experience breaks trust at the worst possible moment.

In 2023, Zomato's checkout funnel had 7 discrete steps between "Place Order" and confirmation. Internal analytics showed a 68% drop-off at step 4, consistently across cohorts. The culprit: users couldn't see the final delivery fee, estimated time, or preparation time until they were already 4 steps deep.

My brief was deliberately open-ended: "Fix checkout." What that actually meant took 3 weeks of discovery to understand properly.

The constraints were non-trivial. We couldn't change the payment infrastructure (a multi-team, multi-quarter effort), couldn't touch the restaurant-side ETA logic, and had to ship incrementally — no big-bang redesign that would require a full regression cycle. This shaped every decision we made.`,
    blocks: [
      { id: id(), type: 'image', sectionLabel: '', caption: 'Checkout funnel analysis — the 68% drop-off at step 4 was surgical. Users were leaving within 8 seconds of arriving.', imageUrl: IMG.funnel },
    ],
  },
  {
    id: id(), type: 'research', title: 'Research & Discovery', isSample: true,
    narrative: `We ran three parallel discovery streams over 4 weeks.

**Quantitative — funnel analysis across 2.3M sessions**
The drop-off at step 4 wasn't just high — it was surgical. 71% of abandonments happened within 8 seconds of landing on that screen. Users weren't reading. They were scanning, seeing something unexpected, and leaving. The pattern held regardless of order value, time of day, or city.

**Qualitative — 14 user interviews across Delhi, Mumbai, Bengaluru**
We recruited users who had abandoned checkout at least twice in the past 30 days. The dominant theme wasn't frustration with price — it was *surprise*. "I didn't know it would be this much extra" appeared in 11 of 14 sessions, almost verbatim. The mental model we uncovered: users expected the checkout to confirm what they already knew. Instead, it kept introducing new information.

**Competitive audit — Swiggy, Blinkit, DoorDash, Grab**
Swiggy had moved to a single-screen checkout 6 months earlier. Their NPS had gone up 11 points in that period. DoorDash had done the same in 2021 and published the case publicly. The pattern was clear.

**The insight that reframed everything:** Users weren't abandoning because checkout had too many steps. They were abandoning because the information they needed to *commit* was withheld until commitment was expected. This shifted our frame from "reduce friction" to "build trust earlier."`,
    blocks: [
      { id: id(), type: 'image', sectionLabel: '', caption: 'Affinity mapping from 14 user interviews. The cluster around "unexpected costs" and "no delivery time visible" dominated every session.', imageUrl: IMG.research },
    ],
  },
  {
    id: id(), type: 'process', title: 'The Process', isSample: true,
    narrative: `We explored three structural directions, each with a different bet about user psychology.

**Direction 1 — Progressive Disclosure Accordion**
Keep the multi-step structure but surface summary information at each step. Low engineering risk. Addresses the information gap without overhaul. Risk: cognitive overhead of tracking collapsed state. We prototyped this to 60% fidelity and tested it in 4 sessions. Users liked the familiarity but still paused at payment — the trust gap remained.

**Direction 2 — Single-Screen Checkout**
All critical information visible simultaneously: delivery details, fee breakdown, payment selection, address. Nothing withheld. Tested well in guerrilla sessions at two cafes in Koramangala. Users described it as "like buying from a website, not an app." This was the insight we needed.

**Direction 3 — Bottom Sheet Confirmation**
Checkout remains multi-step but ends with a full-summary bottom sheet before final confirmation. A middle path. We built this to 70% fidelity and tested against Direction 2.

**Direction 2 won — but not for the reasons we expected.**

In 8 usability sessions, single-screen checkout scored 40% higher on task completion. But more telling: it showed a 3× reduction in hesitation moments — measured by pause duration before tapping, which we tracked with screen recordings. Users weren't just completing faster. They were committing with more confidence. That distinction mattered for the argument we had to make internally.

**The hardest design decision: the payment section.**
UPI, cards, wallets, and COD competing for the same constrained vertical space. We explored 6 payment layout variants. The solution: a contextual default that surfaces the last-used payment method prominently, with everything else in a scrollable secondary tier. This reduced payment-step interaction time from 18 seconds average to 6 seconds. One design decision, measurable in seconds.`,
    blocks: [
      { id: id(), type: 'compare', sectionLabel: '', beforeUrl: IMG.wireframe, afterUrl: IMG.testing },
    ],
  },
  {
    id: id(), type: 'solution', title: 'The Solution', isSample: true,
    narrative: `The redesigned checkout is a single, vertically-scrolling screen divided into four clearly separated zones. Each zone corresponds to a distinct mental decision — not a system step, but a user need.

**Zone 1 — Order Summary**
Expandable restaurant card with cover image, item list, and subtotal. Collapsed by default to reduce cognitive load, but visible immediately so users know their order is intact.

**Zone 2 — Delivery Details**
Address, estimated delivery time, and restaurant preparation time shown together for the first time — not sequentially. This zone alone reduced abandonment by 14 percentage points in the A/B test, before we changed anything else.

**Zone 3 — Offers + Fee Breakdown**
Fully transparent, itemised breakdown: delivery fee, platform fee, GST, applied coupon. No "total" that appears higher than expected. If users see a different number, they understand exactly why.

**Zone 4 — Payment**
Contextual default (last-used method, surfaced immediately). UPI via native intent — no webview, no redirect, no 12% failure rate. Cards and wallets one scroll below, COD clearly available but not competing with the primary CTA.

The "Place Order" button is fixed to the bottom of the screen with a live price counter. As users scroll, they always see exactly what they're committing to. This was a political battle internally — concern it would increase price anxiety. A/B data showed the opposite: seeing the number consistently reduced hesitation more than hiding it.`,
    blocks: [
      { id: id(), type: 'compare', sectionLabel: '', beforeUrl: IMG.before, afterUrl: IMG.after },
    ],
  },
  {
    id: id(), type: 'impact', title: 'Impact & Reflection', isSample: true,
    narrative: `We shipped single-screen checkout to 10% of Android users in Bengaluru on week 9 of the project. Full rollout by week 12.

**Results at 90 days post-launch:**
- Cart abandonment at the critical drop-off step: −32% (68% → 46%)
- Repeat order rate: +18% month-over-month
- App Store rating: 3.8 → 4.2 stars (significant for an app at this scale)
- Payment step average interaction time: 18s → 6s
- Support tickets related to "surprise charges": −44%

**What I'd do differently:**

We underinvested in edge states — empty carts, restaurant-closed variants, items sold-out mid-checkout. These surfaced in user feedback within 2 weeks of launch. Users found the single-screen layout disorienting when key zones had missing or unavailable information. Edge cases deserve the same design rigour as the happy path.

I'd also push harder for an earlier A/B test. We ran the comparison from week 9. We had enough signal by week 6. That 3-week gap cost us data we could have used to iterate before full rollout.

**What this taught me:**

The biggest gains in conversion come from closing the gap between wanting something and trusting the decision to get it. Every second of uncertainty — every piece of information introduced at the wrong moment — is a potential abandonment. Design that earns trust early converts better than design that optimises the final step.`,
    blocks: [
      { id: id(), type: 'image', sectionLabel: '', caption: '90-day post-launch dashboard — the drop-off cliff at step 4 is gone. The funnel now loses users gradually across all steps, which is healthy abandonment behaviour.', imageUrl: IMG.metrics },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// BRAND & IDENTITY — Mamaearth Brand Refresh
// ─────────────────────────────────────────────────────────────────────────────

const MAMAEARTH_OVERVIEW: OverviewData = {
  summary: 'Refreshing Mamaearth\'s visual identity to unify 60+ SKUs under a coherent brand language — without alienating the 28 million customers who already trusted them.',
  role: 'Brand Designer',
  timeline: '18 weeks',
  team: '3 designers, 1 brand strategist, external packaging vendor',
  metrics: [
    { value: '+23%', label: 'Shelf recognition (research)' },
    { value: '60+', label: 'SKUs unified' },
    { value: '4 wks', label: 'Faster packaging rollout' },
  ],
}

const MAMAEARTH_SECTIONS: CaseSection[] = [
  { id: id(), type: 'overview', title: 'Overview', narrative: '', blocks: [], isSample: true },
  {
    id: id(), type: 'challenge', title: 'The Challenge', isSample: true,
    narrative: `Mamaearth had grown from a single toxin-free baby care product to 60+ SKUs across haircare, skincare, and colour cosmetics. The problem: the brand hadn't grown with it.

Each product category had evolved independently. Baby care had soft pastels. Skincare used ingredient photography. Hair had bold typography. On a shelf, the products looked like they came from different companies.

The brief was to create a unified visual system that could scale across all categories, be manufactured efficiently by 3 different packaging vendors, and not require existing customers to question whether they'd bought the right product.

The additional constraint nobody wanted to say aloud: Mamaearth's valuation was public and the category was getting more competitive. Plum, The Derma Co, Minimalist — all had cleaner, more coherent identities. We had 18 weeks before the next major product launch cycle.`,
    blocks: [
      { id: id(), type: 'image', sectionLabel: '', caption: 'Brand audit across 60+ SKUs — photographed side by side. The incoherence that had built up over 6 years was immediately visible.', imageUrl: IMG.brand1 },
    ],
  },
  {
    id: id(), type: 'research', title: 'Research & Discovery', isSample: true,
    narrative: `We ran shelf tests in 4 organised retail environments across Mumbai and Delhi NCR — modern trade (Reliance Smart, D-Mart) and pharmacy-adjacent (Apollo Pharmacy, Wellness Forever). The goal was to understand not just Mamaearth's visibility but competitive context.

Key findings:
- Mamaearth products were consistently identified as "natural" but not clearly "premium natural." Users associated competitors like Plum with sophisticated natural; Mamaearth with accessible natural. Both have value — but the brand wasn't intentional about which it owned.
- 64% of test participants could not correctly group all Mamaearth products on a shelf without prior brand knowledge. For a brand with this level of awareness, that's a significant recognition failure.
- Ingredient photography (avocado, onion, tea tree) tested strongly as a trust signal — but only when it read as intentional, not random. The current implementation read as random.

The strategic decision that came out of research: the refresh would not change Mamaearth's warmth or accessibility. It would add *coherence* — a systematic visual logic that made the brand recognisable as a brand, not just a collection of SKUs.`,
    blocks: [],
  },
  {
    id: id(), type: 'process', title: 'The Process', isSample: true,
    narrative: `We defined the system before designing anything. This was the most important decision of the project.

The system had four layers:
1. **Colour architecture** — a 12-colour palette derived from ingredient families (greens for plant extracts, ambers for oils, coral for vitamin C), with a shared neutral base that unified across categories.
2. **Typography hierarchy** — a single type system replacing 4 different font combinations that had accumulated across categories. Clear hierarchy: brand mark, category name, key ingredient, claim.
3. **Ingredient photography style guide** — standardised lighting, framing, and scale for ingredient photography. Shot once, adapted across SKUs.
4. **Layout grid** — a flexible 9-zone grid that accommodated different pack shapes (tubes, bottles, jars, sachets) with consistent information hierarchy.

We explored 3 directions at concept stage, tested each as flat mockups with 40 recruited consumers in Delhi. Direction 2 won — earth tones with a cleaner layout grid — but we borrowed the ingredient positioning system from Direction 1.

The hardest decision: the logo. We recommended keeping the wordmark unchanged (equity too valuable to discard) but refinishing it — tighter kerning, slight weight adjustment — to work better at small sizes on tube caps and sachet corners. This conversation took 3 weeks.`,
    blocks: [
      { id: id(), type: 'image', sectionLabel: '', caption: 'Colour system derived from ingredient families — earth tones that feel natural without feeling dated.', imageUrl: IMG.brand2 },
    ],
  },
  {
    id: id(), type: 'solution', title: 'The Solution', isSample: true,
    narrative: `The final brand system delivered three things simultaneously: visual unity across 60+ SKUs, manufacturing flexibility across 3 vendors, and a design language that reads as premium without being inaccessible.

**The colour architecture** uses a base of warm off-whites (#F7F3EF) and deep earth (#2C1810) across all categories, with category-specific accent colours drawn from ingredient families. A haircare product using onion extract gets a warm amber. A skincare product with tea tree gets a deep sage. The logic is visible, even to a consumer who doesn't know the design system.

**The packaging layout** follows a strict hierarchy: logo (top-left, always), category label (top-right, always), hero ingredient illustration (centre, 40% of front face), product name (below illustration), and claim (base, max 8 words). This hierarchy holds across tubes, jars, bottles, and flat sachets.

**The ingredient illustration style** is the piece I'm most proud of. We commissioned a set of 18 botanical illustrations by two Kolkata-based illustrators, built to a shared style guide. They replaced the disparate ingredient photography that had accumulated over 6 years. Consistent. Beautiful. Ownable.`,
    blocks: [
      { id: id(), type: 'image', sectionLabel: '', caption: 'Final brand system applied across packaging, digital, and OOH — the coherence visible immediately when all SKUs are seen together.', imageUrl: IMG.brand3 },
    ],
  },
  {
    id: id(), type: 'impact', title: 'Impact & Reflection', isSample: true,
    narrative: `The refreshed system launched with Mamaearth's Q2 product range — 14 new SKUs debuting simultaneously, all using the new system.

**Measured outcomes:**
- Shelf recognition in post-launch research: +23% (consumers could correctly identify Mamaearth products without reading the wordmark)
- Packaging production cycle: −4 weeks (vendor alignment from 3 suppliers down to 1 system with variant specs)
- Internal design-to-production handoff: halved in time due to the standardised asset library

**What I'd do differently:**

The illustration system took 11 of the 18 weeks to define and execute. I'd build a smaller set of foundational illustrations and establish the style guide earlier, then commission category-specific illustrations on a rolling basis as product launches require them. Trying to illustrate all 18 ingredient families upfront created a dependency that compressed the rest of the project.

I'd also involve the manufacturing vendors earlier in the colour specification process. We had two rounds of physical proof corrections because digital-to-print tolerances hadn't been discussed until week 14. For a packaging project, that's too late.

**What this taught me:**

Brand systems live or die by the clarity of their logic. A designer can always create something beautiful. The harder, more valuable skill is creating a system that other designers, vendors, and marketers can apply *without you in the room* — and still produce something that looks like it came from one mind.`,
    blocks: [],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// MOTION DESIGN — Swiggy Loading Animation
// ─────────────────────────────────────────────────────────────────────────────

const SWIGGY_OVERVIEW: OverviewData = {
  summary: 'Redesigning Swiggy\'s app loading experience to reduce perceived wait time and reinforce brand character during the most anxious 3 seconds of a hungry user\'s session.',
  role: 'Motion Designer',
  timeline: '8 weeks',
  team: '2 motion designers, 1 brand lead, iOS & Android engineering',
  metrics: [
    { value: '−22%', label: 'Perceived wait time' },
    { value: '3.2s', label: 'Average load time' },
    { value: '94%', label: 'Animation smoothness (60fps)' },
  ],
}

const SWIGGY_SECTIONS: CaseSection[] = [
  { id: id(), type: 'overview', title: 'Overview', narrative: '', blocks: [], isSample: true },
  {
    id: id(), type: 'challenge', title: 'The Challenge', isSample: true,
    narrative: `The 3 seconds between opening Swiggy and seeing your restaurants is the highest-anxiety moment in the app. Users have already decided they want food. The app just needs to not lose them in the gap.

Swiggy's previous loading animation was a static logo on a flat background. It communicated nothing about the brand beyond "we exist." In user research, the loading state was described as "boring," "makes me worried something went wrong," and — most damaging — "feels like a different app."

The challenge wasn't just to fill time. It was to use those 3.2 seconds to do brand work.`,
    blocks: [],
  },
  {
    id: id(), type: 'process', title: 'The Process', isSample: true,
    narrative: `We explored 4 animation directions, each built around a different brand character hypothesis.

**Direction 1 — Speed:** Fast, linear, energetic. Communicated urgency. Tested well with 18-24 cohort. Risk: felt anxious rather than confident for 35+ users.

**Direction 2 — Warmth:** Slow morph of the Swiggy logo into food imagery. Beautiful in isolation. Too slow at actual network load times. Didn't loop gracefully.

**Direction 3 — Playfulness:** Bouncing delivery bag character. Immediately Swiggy. Tested highest on brand recall. Risk: too cute for the premium Swiggy One tier.

**Direction 4 — Confidence:** A minimal, fluid animation of the logo — no additional characters, just the mark breathing. Works across all tiers. Tests as "trustworthy" rather than "fun."

We shipped Direction 3 for the standard tier and Direction 4 for the Swiggy One tier. Two animations, one system.

The technical constraint that shaped everything: Lottie on Android had a known issue with certain easing curves at 60fps on mid-range devices (the dominant device segment in India). Every animation had to be tested on a Redmi Note 10, not just an iPhone 15.`,
    blocks: [
      { id: id(), type: 'image', sectionLabel: '', caption: 'Storyboard — 6 keyframes across the 2.8s animation. Hold prevents pop-in. Settle prevents the abrupt cut to home screen.', imageUrl: '/samples/swiggy-storyboard.svg' },
    ],
  },
  {
    id: id(), type: 'solution', title: 'The Solution', isSample: true,
    narrative: `The final animation runs at exactly 2.8 seconds (slightly under the average load time, so users rarely see a loop). It uses a 3-phase structure: hold (0.3s), animate (2.2s), settle (0.3s). The hold prevents pop-in. The settle prevents abrupt transitions to the home screen.

Every easing curve was specified to work at 30fps on Lottie for Android, not just at 60fps on After Effects.`,
    blocks: [
      { id: id(), type: 'image', sectionLabel: '', caption: 'Final loading animation — live SVG. Pulse, bounce, staggered dots, cross-dissolve to home screen. Tested on Redmi Note 10 at 30fps.', imageUrl: '/samples/swiggy-animation.svg' },
    ],
  },
  {
    id: id(), type: 'impact', title: 'Impact & Reflection', isSample: true,
    narrative: `Perceived wait time dropped 22% in follow-up research, with no change in actual load times. The animation was doing real psychological work.

The lesson: motion design in product isn't decoration. It's time design. You're not filling a gap — you're controlling how long that gap feels.`,
    blocks: [],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// ILLUSTRATION — Zepto Campaign
// ─────────────────────────────────────────────────────────────────────────────

const ZEPTO_OVERVIEW: OverviewData = {
  summary: 'Creating a campaign illustration system for Zepto\'s 10-minute delivery positioning — 24 illustrations across 4 media formats in 3 weeks.',
  role: 'Illustrator',
  timeline: '3 weeks',
  team: 'Solo, with 1 art director and 1 brand manager',
  metrics: [
    { value: '24', label: 'Final illustrations' },
    { value: '4', label: 'Media formats' },
    { value: '3 wks', label: 'Concept to delivery' },
  ],
}

const ZEPTO_SECTIONS: CaseSection[] = [
  { id: id(), type: 'overview', title: 'Overview', narrative: '', blocks: [], isSample: true },
  {
    id: id(), type: 'challenge', title: 'The Challenge', isSample: true,
    narrative: `Zepto's 10-minute delivery is their core promise. The challenge: photography shows delivery riders. Photography doesn't show 10 minutes feeling fast, exciting, or magical.

The brief was to create a campaign illustration language that made 10-minute grocery delivery feel like an everyday superpower — without being hyperbolic or dishonest about what the service is.`,
    blocks: [],
  },
  {
    id: id(), type: 'process', title: 'The Process', isSample: true,
    narrative: `I explored two visual languages: photorealism with illustrated speed lines (rejected — felt dated) and a flat, character-based system with strong silhouettes that work at billboard and app-icon scale simultaneously.

The character design took the most time. The delivery rider needed to feel heroic without being grandiose, fast without being reckless. I went through 12 character studies before the pose clicked: mid-lean, one wheel slightly lifted, the bag open and glowing slightly.

The colour system came from Zepto's brand (purple) but extended into a warm amber-to-yellow gradient for the "speed" states. At billboard scale, it reads as energy. At icon scale, it reads as warmth.`,
    blocks: [
      { id: id(), type: 'image', sectionLabel: '', caption: 'Character design process — 12 studies from rigid (rejected) to final heroic lean pose. Colour system derived from Zepto brand + speed amber gradient.', imageUrl: '/samples/zepto-campaign.svg' },
    ],
  },
  {
    id: id(), type: 'solution', title: 'The Solution', isSample: true,
    narrative: `24 illustrations across: OOH/billboard (16:9, large format), in-app banners (2:1, 1:1), social (1:1, 9:16), and packaging inserts (various). Every illustration was built on a 12-column grid so elements aligned when tiled across formats.

The character system had 6 core poses and 4 setting backgrounds. Combined, they produced 24 unique compositions without starting from scratch for each one. Systematic illustration at campaign scale.`,
    blocks: [
      { id: id(), type: 'image', sectionLabel: '', caption: 'Final campaign illustration — Zepto delivery rider at Delhi OOH scale. "Everything. In 10 minutes." 6 poses × 4 backgrounds = 24 assets.', imageUrl: '/samples/zepto-campaign.svg' },
    ],
  },
  {
    id: id(), type: 'impact', title: 'Impact & Reflection', isSample: true,
    narrative: `All 24 assets delivered on time. The campaign ran across Delhi, Mumbai, and Bengaluru OOH for 6 weeks.

What I'd do differently: I'd negotiate a brand guide from the client before week 1, not week 2. Zepto's brand standards document arrived 8 days in, which required retroactive colour corrections on 6 already-approved compositions. Always get the brand guide first.`,
    blocks: [],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM (generic — minimal sample)
// ─────────────────────────────────────────────────────────────────────────────

const CUSTOM_OVERVIEW: OverviewData = {
  summary: 'Your project summary goes here — one sentence that captures what this is and why it mattered.',
  role: 'Your role',
  timeline: 'Timeline',
  team: 'Team size',
  metrics: [
    { value: '', label: '' },
    { value: '', label: '' },
    { value: '', label: '' },
  ],
}

const CUSTOM_SECTIONS: CaseSection[] = [
  {
    id: id(), type: 'overview', title: 'Overview', narrative: '', blocks: [], isSample: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export const DISCIPLINE_SAMPLES: Record<CaseDiscipline, {
  sections: CaseSection[]
  overviewData: OverviewData
  coverUrl: string
}> = {
  ux: {
    sections: ZOMATO_SECTIONS,
    overviewData: ZOMATO_OVERVIEW,
    coverUrl: 'https://placehold.co/1400x788/e53416/ffffff?font=raleway&text=Zomato+Checkout+Redesign+%E2%80%94+Reducing+cart+abandonment+by+32%25',
  },
  brand: {
    sections: MAMAEARTH_SECTIONS,
    overviewData: MAMAEARTH_OVERVIEW,
    coverUrl: 'https://placehold.co/1400x788/2c1810/f7f3ef?font=raleway&text=Mamaearth+Brand+Refresh+%E2%80%94+60%2B+SKUs+unified+under+one+visual+system',
  },
  motion: {
    sections: SWIGGY_SECTIONS,
    overviewData: SWIGGY_OVERVIEW,
    coverUrl: 'https://placehold.co/1400x788/fc8019/1c1b18?font=raleway&text=Swiggy+Loading+Animation+%E2%80%94+Making+3+seconds+feel+shorter',
  },
  illustration: {
    sections: ZEPTO_SECTIONS,
    overviewData: ZEPTO_OVERVIEW,
    coverUrl: 'https://placehold.co/1400x788/8b5cf6/ffffff?font=raleway&text=Zepto+Campaign+Illustrations+%E2%80%94+24+assets%2C+4+formats%2C+3+weeks',
  },
  custom: {
    sections: CUSTOM_SECTIONS,
    overviewData: CUSTOM_OVERVIEW,
    coverUrl: '',
  },
}
