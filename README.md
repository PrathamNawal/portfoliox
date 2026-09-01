# PortfolioX

A visual-first portfolio builder for designers. Instead of writing a case study from a blank page, you drop in your work — screens, boards, prototypes — and PortfolioX structures it into a proper case study, with AI helping narrate around the visuals rather than the other way around.

**Live example:** [portfoliox-mu-nine.vercel.app/p/muskanmaheshwari](https://portfoliox-mu-nine.vercel.app/p/muskanmaheshwari)

## What it does

- **Onboarding → builder → published portfolio.** A designer signs up, picks a discipline (UX, brand, motion, illustration, or a blank custom template) and a layout, and lands in a dashboard where they add case studies, work experience, testimonials, and a tool stack.
- **Discipline-aware case study templates.** Each discipline ships with a different default section flow — e.g. UX gets Overview → Challenge → Research → Process → Solution → Impact → What's Next; Motion and Illustration skip the research step. Sections can be added, removed, or reordered freely afterward.
- **Rich visual blocks per section.** Image, gallery, before/after compare slider, embedded Figma, video (YouTube/Loom/Vimeo/direct file), rich text, and stat callouts — dragged into whatever order tells the story.
- **AI section writing, not AI section inventing.** For any section, you give a problem/what-I-did/outcome in your own words and the AI (Claude Haiku via OpenRouter) drafts the narrative prose — it's explicitly instructed never to fabricate metrics that weren't provided. Free-tier accounts get a limited lifetime credit pool (1 credit per section generated); results are cached so identical inputs don't burn a second credit.
- **Two published layouts.** *Canvas* (card grid) and *Spotlight* (centered editorial) — switchable per profile, rendered from the same underlying data.
- **Case-study NDA gating.** A case study can be locked behind a password; the server strips all content (blocks, AI text, cover image) from the payload for locked requests, so nothing leaks into page source before unlock, and unlock state is a short-lived signed session rather than a client-side flag.
- **Wildcard subdomain + path fallback publishing.** A published profile is reachable at `{slug}.portfoliox.me` (via Vercel wildcard + Next.js middleware rewrite) and also at `/p/{slug}` as a domain-independent fallback.
- **Analytics dashboard.** Page views, case-study views, and time-on-page are logged per visitor fingerprint and rolled up into a dashboard for the profile owner.
- **Admin console.** A seeded admin (`role = 'admin'` in `profiles`) gets a user list, CSV export, plan/limit settings, and email-based admin invites — all behind server-side `requireAuthContext` checks, not just UI hiding.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS + a small CSS custom-property design system (`--px-*` tokens) |
| Database & storage | Supabase (Postgres + Storage) — used as a data store only |
| Auth | Firebase Auth (Google OAuth + email/password) — a signed session cookie (`px_session`) bridges Firebase's UID into every API route via `requireAuthContext()`, which then uses the Supabase **service role** key server-side. There is no Supabase Auth / RLS-based auth in this project — authorization is enforced entirely in API route handlers. |
| AI generation | OpenRouter, routed to `anthropic/claude-haiku-4-5` |
| Rich text editing | Tiptap |
| Drag & drop | `@hello-pangea/dnd` |
| Hosting | Vercel, auto-deploy on push to `main` |

## Project structure

```
app/
  [slug]/                  Published portfolio (Canvas/Spotlight) + case study pages — public, no auth
  [slug]/case/[caseId]/    Individual published case study page
  p/[slug]/                Path-based fallback for the same public pages (works without the wildcard domain)
  dashboard/               Authenticated builder home
  case-study/[id]/         Case study editor
  onboarding/              First-run discipline/layout picker
  analytics/               Owner-facing analytics dashboard
  admin/                   Admin console (role-gated)
  api/                     All server logic — every route re-derives the user via requireAuthContext()
lib/
  firebase/                Client init + server-side session decoding
  supabase/                Server-side Supabase client + the requireAuthContext() auth bridge
  ai/generate.ts           Per-section-type prompts sent to OpenRouter
  case-study-templates.ts  Discipline → default section list mapping
components/
  builder/ editor/ published/ admin/ onboarding/ ui/
supabase/
  schema.sql               Full Postgres schema — source of truth for tables (see below)
```

## Data model

All tables live in one Supabase project; `supabase/schema.sql` is the source of truth. Key tables:

- `profiles` — one row per designer: slug, discipline, layout, plan (`free`/`pro`), role (`user`/`admin`), social links
- `case_studies` — title, `sections` (jsonb array of `{type, title, narrative, blocks}`), `overview_data`, `discipline`, NDA fields, `published`
- `work_experience`, `testimonials`, `tool_stack` — the supporting profile sections
- `analytics_events` — page/case-study views with visitor fingerprint and time-on-page
- `nda_sessions` — short-lived unlock tokens for password-gated case studies
- `ai_generation_cache` / `ai_credits` — dedup cache and per-user free-tier credit balance for AI generation
- `app_settings`, `admin_invites` — admin-console configuration

Note: `case_studies` also carries a few legacy top-level columns (`problem`, `what_i_did`, `blocks`) predating the `sections`-based structure above. The **published pages only read `sections`/`overview_data`** — populating just the legacy columns will insert successfully but render as an empty case study, so always write through `sections`.

## Getting started

```bash
git clone https://github.com/PrathamNawal/portfoliox.git
cd portfoliox
npm install
cp .env.local.example .env.local   # fill in Supabase, Firebase, and OpenRouter keys — see SETUP.md
npm run dev
```

Runs at `http://localhost:3000`. For the full first-time setup — creating the Supabase project and buckets, wiring Firebase Auth, seeding an admin, and configuring the wildcard subdomain on Vercel — see **[SETUP.md](./SETUP.md)**.

## Deployment

Pushing to `main` triggers an automatic Vercel deployment (no CLI/config needed locally). Case study and portfolio pages are explicitly marked `revalidate = 0` / `dynamic = 'force-dynamic'` so published edits show up immediately rather than being held by Next's fetch cache — keep that in mind if you add a new public-facing data page.
