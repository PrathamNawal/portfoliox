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

const w = (n: number, company: string, role: string, start: string, end: string | null, current: boolean, description: string): WorkExperience => ({ ...base, id: `w-${n}`, company, role, logo_url: null, start_month: start, end_month: end, is_current: current, description, discipline_tag: null, display_order: n })
// Deliberately NOT in latest-first order, so the gallery proves the sort (lib/experience.ts).
export const FIXTURE_EXPERIENCE: WorkExperience[] = [
  w(1, 'Here to Care', 'UI/UX Designer', 'Mar 2023', 'Dec 2024', false, '<ul><li>Shipped the patient app to 60K+ users.</li></ul>'),
  w(2, 'Soccal', 'Associate Designer', 'Jan 2024', 'Dec 2024', false, '<ul><li>Homepage refresh.</li></ul>'),
  w(3, 'Hiver', 'Design Intern', 'Jun 2021', 'Aug 2021', false, '<ul><li>Icon set and illustrations.</li></ul>'),
  w(4, 'Soccal', 'Product Designer', 'Jan 2025', null, true, '<ul><li><strong>Onboarding:</strong> redesigned the first-run flow.</li></ul>'),
  w(5, 'Rocketium', 'Graphic Designer', 'Sep 2021', 'Feb 2023', false, '<ul><li>Brand templates.</li></ul>'),
]

export const FIXTURE_TOOLS: ToolStackItem[] = ['Figma', 'Notion', 'Framer', 'Miro', 'Adobe Illustrator', 'Adobe Photoshop', 'Principle', 'Spline'].map((tool_name, i) => ({ id: `tool-${i}`, user_id: 'fixture', tool_name, display_order: i }))
