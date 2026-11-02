// Fixture portfolio for the dev-only theme gallery (app/dev/themes) and scripts.
// Mirrors the shape of a real published portfolio so every themed component renders.
import type { Profile, CaseStudy, Testimonial, WorkExperience, ToolStackItem } from '@/types'

const svgCover = (a: string, b: string, label: string, w = 800, h = 480) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * .75}" cy="${h * .3}" r="${h * .19}" fill="rgba(255,255,255,.28)"/><rect x="${w * .09}" y="${h * .52}" width="${w * .45}" height="26" rx="13" fill="rgba(255,255,255,.55)"/><rect x="${w * .09}" y="${h * .62}" width="${w * .3}" height="26" rx="13" fill="rgba(255,255,255,.35)"/><text x="${w * .09}" y="${h * .42}" font-family="sans-serif" font-size="46" font-weight="800" fill="#fff">${label}</text></svg>`,
  ).replace(/[()']/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())}`

const base = { user_id: 'fixture', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }

export const FIXTURE_PROFILE: Profile = {
  ...base,
  id: 'fixture',
  name: 'Muskan Maheshwari',
  bio: 'Product Designer crafting intuitive experiences. Enhanced onboarding and homepage for Soccal, laying the foundation for a seamless user journey.',
  avatar_url: null,
  discipline: 'ux',
  skills: ['UX Design', 'Product Design', 'User Research', 'UI Design', 'Visual Design', 'Prototyping', 'Brand Design', 'Figma'],
  layout: 'canvas',
  slug: 'fixture',
  plan: 'free',
  role: 'user',
  social_links: { linkedin: 'muskan', dribbble: 'muskan', website: 'https://example.com' },
  resume_url: 'https://example.com/resume.pdf',
  onboarding_complete: true,
} as Profile

const cs = (n: number, title: string, cover: string | null, extra: Partial<CaseStudy> = {}): Partial<CaseStudy> => ({
  ...base,
  id: `cs-${n}`,
  title,
  cover_image_url: cover,
  nda_enabled: false,
  published: true,
  display_order: n,
  discipline: 'ux',
  overview_data: null,
  ...extra,
})

export const FIXTURE_CASE_STUDIES: Partial<CaseStudy>[] = [
  cs(1, 'Making AI Recruitment Feel Human', svgCover('#0f766e', '#134e4a', 'Recruit'), { discipline: 'brand', overview_data: { summary: 'Agentic ATS and AI recruitment platform. Solo designer working with founder, BD and marketing.', role: '', timeline: '', team: '', metrics: [] } }),
  cs(2, 'A Distinct Voice in Technical Hiring', svgCover('#7c3aed', '#312e81', 'Tall · fill', 500, 900), { discipline: 'brand', overview_data: { summary: 'Brand assets, creative direction and ongoing marketing communication.', role: '', timeline: '', team: '', metrics: [] } }),
  cs(3, 'Street Food Safari', svgCover('#f97316', '#be123c', 'Tall · fit', 500, 900), { cover_fit: 'fit' }),
  cs(4, 'HunchVue: AI-Assisted Interviewing', null, { discipline: 'ux' }),
  cs(5, 'FarmVilla: A Three-Sided Marketplace', svgCover('#16a34a', '#0e7490', 'Stays'), { nda_enabled: true }),
]

const t = (n: number, name: string, role: string, quote: string): Testimonial => ({ ...base, id: `t-${n}`, name, title_and_company: role, linkedin_url: null, quote, photo_url: null, display_order: n })
export const FIXTURE_TESTIMONIALS: Testimonial[] = [
  t(1, 'Tejendra Pal Singh', 'Co Founder, Soccal', 'A highly creative designer with a keen eye for detail. Visually appealing and well thought out work that added great value to our project.'),
  t(2, 'Asha Rao', 'Head of Product, Hiver', 'Turns ambiguous briefs into clear, shippable flows. Collaborates well across product, engineering and marketing.'),
  t(3, 'Rohan Mehta', 'Founder, HireHunch', 'Gave our brand a recognisable voice in a crowded space. Fast, thoughtful and a pleasure to work with.'),
]

const w = (n: number, company: string, role: string, start: string, end: string | null, current: boolean, description: string, story: Partial<WorkExperience> = {}): WorkExperience => ({ ...base, id: `w-${n}`, company, role, logo_url: null, start_month: start, end_month: end, is_current: current, description, discipline_tag: null, display_order: n, ...story })
const shot = (a: string, b: string, label: string, w: number, h: number, caption?: string) => ({ url: svgCover(a, b, label, w, h), w, h, ...(caption ? { caption } : {}) })
// Deliberately NOT in latest-first order, so the gallery proves the sort (lib/experience.ts).
export const FIXTURE_EXPERIENCE: WorkExperience[] = [
  w(1, 'Here to Care', 'UI/UX Design Intern', 'Aug 2024', 'Nov 2024', false, '<ul><li>Owned the entire design process solo, from concept to final product, across Onboarding, Home, Doctor\'s Profile, Listing, and Support</li><li>Shaped the product design behind a launch that reached 260K+ active users globally, including 60K+ in India, across 750+ corporate partnerships</li><li>Partnered directly with the founders on competitor analysis and overall product direction, shaping the app\'s theme and user experience</li><li>Built a design system that cut the time to iterate, design, and prepare work for dev handoff from 7 days to 2 days</li><li>Recognized with an Appreciation Certificate for performance in user research and UI design</li></ul>', { screens: [shot('#be185d', '#831843', 'Onboarding', 390, 844, 'Onboarding'), shot('#0369a1', '#0c4a6e', 'Doctor profile', 390, 844)] }),
  w(2, 'Soccal', 'Associate Designer', 'Jan 2024', 'Dec 2024', false, '<ul><li>Homepage refresh.</li></ul>'),
  w(3, 'Hiver', 'Design Intern', 'Jun 2021', 'Aug 2021', false, '<ul><li>Icon set and illustrations.</li></ul>'),
  w(4, 'CompiledBox', 'UI/UX Designer', 'Jul 2025', 'Mar 2026', false, '<ul><li>Owned the complete design lifecycle across 8+ client engagements in Europe and India spanning wellness, AI infrastructure, travel, and design agency verticals, from concept and research through low/mid fidelity validation, high fidelity design, and dev handoff through UAT</li><li>Led the full website redesign for Farmvilla, a Europe based travel platform, and designed the wellness website and portal for Xcergy from concept through development handoff</li><li>Designed Hostnxtra\'s hosting platform interface, validating decisions through rapid prototyping before handing off dev ready high fidelity designs</li></ul>', { headline: 'Shipped 8+ client products across Europe and India, concept to UAT', stat_value: '8+', stat_label: 'client engagements', screens: [shot('#0f766e', '#134e4a', 'Farmvilla home', 1600, 900, 'Farmvilla: redesigned home'), shot('#7c3aed', '#312e81', 'Xcergy app', 390, 844, 'Xcergy wellness portal'), shot('#f97316', '#be123c', 'Hostnxtra', 1600, 1000, 'Hostnxtra hosting dashboard'), shot('#2563eb', '#1e3a8a', 'Booking', 390, 844), shot('#16a34a', '#0e7490', 'Design system', 1600, 900, 'Shared component library'), shot('#db2777', '#7e22ce', 'Marketing', 1200, 900), shot('#ca8a04', '#92400e', 'Mobile', 390, 844)] }),
  w(5, 'Luxorides', 'UI/UX Design Intern', 'Dec 2024', 'Jul 2025', false, '<ul><li>Led design of web and mobile interfaces for Luxorides, a luxury car rental platform serving the Delhi NCR region</li><li>Built a design system covering typography, color palettes, and UI components adopted across the product</li><li>Reduced homepage bounce rate by 30% through usability testing and iterative design improvements</li><li>Partnered with cross functional teams to align design decisions with business objectives</li></ul>', { stat_value: '30%', stat_label: 'lower homepage bounce rate', screens: [shot('#334155', '#0f172a', 'Booking flow', 1600, 900, 'Booking flow'), shot('#b45309', '#78350f', 'Mobile home', 390, 844), shot('#0e7490', '#164e63', 'Fleet', 1600, 900)] }),
]

export const FIXTURE_TOOLS: ToolStackItem[] = ['Figma', 'Notion', 'Framer', 'Miro', 'Adobe Illustrator', 'Adobe Photoshop', 'Principle', 'Spline'].map((tool_name, i) => ({ id: `tool-${i}`, user_id: 'fixture', tool_name, display_order: i }))
