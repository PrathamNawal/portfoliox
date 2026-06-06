# PortfolioX — Bug Tracker

> Last updated: 2026-06-06 — All P0 bugs resolved
> Testing layers: Functional (PM) · Design · Motion · Engineering

---

## Legend

| Priority | Meaning |
|----------|---------|
| **P0** | Critical for launch — blocks ship |
| **P1** | Good to have before launch |
| **P2** | Nice to have / post-launch |

| Status | |
|--------|-|
| 🔴 Open | Not yet fixed |
| 🟡 In Progress | Being worked on |
| 🟢 Fixed | Resolved |

---

## P0 — Critical (7 bugs)

| ID | Layer | Status | Title | Location | Detail |
|----|-------|--------|-------|----------|--------|
| F1 | Functional | 🟢 Fixed | `/handler/forgot-password` crashes with 500 | `app/layout.tsx` | Added `<Suspense>` wrapper around `{children}` in root layout — Hexclave handler now renders correctly |
| F4 | Functional | 🟢 Fixed | AI credit deducted before API call — no refund on failure | `app/api/ai/generate/route.ts` | `creditBalance` variable tracks pre-deduction amount; refund issued if `generateSection()` throws or stream fails before producing output |
| D1 | Design | 🟢 Fixed | Sign-in/sign-up pages use raw Hexclave default UI | `app/sign-in/` | Custom branded page built at `/sign-in` — PortfolioX split-panel layout, Plus Jakarta Sans, vermillion accent, Google OAuth button + email magic link. Middleware + `lib/stack.ts` updated to route there |
| E1 | Engineering | 🟢 Fixed | Analytics endpoint accepts events for any userId — no ownership validation | `app/api/analytics/route.ts` | Added ownership validation: POST now checks `profiles.slug IS NOT NULL` for the given userId before inserting event. Invalid targets return `{ ok: true }` silently |
| E2 | Engineering | 🟢 Fixed | Published portfolio `select('*')` exposes `email` via anon key | `app/[slug]/page.tsx` | Changed to explicit column list — `email`, `updated_at`, and other private fields excluded from the public portfolio query |

---

## P1 — Good to Have (18 bugs)

| ID | Layer | Status | Title | Location | Detail |
|----|-------|--------|-------|----------|--------|
| F2 | Functional | 🔴 Open | `?after=` deep-link redirect silently dropped after sign-in | `middleware.ts:34`, `lib/stack.ts:6` | Middleware sets `?after=pathname` but `lib/stack.ts` hardcodes `afterSignIn: '/dashboard'` — Hexclave ignores the param |
| F3 | Functional | 🔴 Open | Free tier limit endpoint always 401 | `app/api/settings/free-limit/route.ts` | Uses `createClient` (Supabase SSR auth) which always returns null user since auth is Hexclave |
| F5 | Functional | 🔴 Open | `check-slug` and `free-limit` use inconsistent auth pattern | `app/api/publish/check-slug/route.ts`, `app/api/settings/free-limit/route.ts` | Both are public reads that use the anon key — works today but inconsistent with rest of API |
| F6 | Functional | 🔴 Open | No `loading.tsx` — every page transition shows blank screen | `app/` root | All server component data fetches block rendering; no skeleton/loading UI |
| F7 | Functional | 🔴 Open | `filerRetried` variable declared but never used | `app/api/ai/generate/route.ts:76` | Dead code — incomplete retry/filter logic |
| F8 | Functional | 🔴 Open | Admin user search is client-side only — no pagination | `app/admin/AdminClient.tsx` | All users loaded at page mount; paginated API exists but unused. Degrades past ~500 users |
| D2 | Design | 🔴 Open | Dark mode toggle not implemented — editor dark tokens defined but no mechanism | `app/layout.tsx` | `data-theme="light"` hardcoded; no user toggle |
| D3 | Design | 🔴 Open | Admin free-limit input uses raw `<input>` not design system `<Input>` | `app/admin/AdminClient.tsx:121` | Border, radius, font don't match design system |
| D4 | Design | 🔴 Open | Invite error state uses brand accent (vermillion) instead of semantic error color | `app/admin/AdminClient.tsx:170` | `var(--px-accent)` = red = brand color; using it for errors creates ambiguity |
| D5 | Design | 🔴 Open | Full profile object including email passed to public layout components | `app/[slug]/page.tsx` | Linked to E2 — not a visual bug but email flows into component props |
| E3 | Engineering | 🔴 Open | NDA session tokens stored as plaintext in DB | `app/api/nda/verify/route.ts:23` | Should store `sha256(token)` in DB; keep raw token in cookie only |
| E4 | Engineering | 🔴 Open | No index on `admin_invites.email` | `supabase/schema.sql` | Invite lookup at onboarding does full table scan |
| E5 | Engineering | 🔴 Open | AI credit check has TOCTOU race condition | `app/api/ai/generate/route.ts:26-32` | Two concurrent requests read same balance and both decrement. Should use atomic `UPDATE ... WHERE credits_remaining > 0` |
| E6 | Engineering | 🔴 Open | `free-limit` GET uses broken Supabase SSR auth pattern | `app/api/settings/free-limit/route.ts` | Public read; no auth needed — but inconsistency is a risk if write operations are added |
| E7 | Engineering | 🔴 Open | No Suspense / `loading.tsx` — slow DB queries freeze entire page | `app/` | Dashboard, analytics, admin all await multiple queries before any render |
| E8 | Engineering | 🔴 Open | Publish route — slug can never be updated once set | `app/api/publish/route.ts:10-13` | `if (existing?.slug) return existing.slug` — no update path |

---

## P2 — Nice to Have (8 bugs)

| ID | Layer | Status | Title | Location | Detail |
|----|-------|--------|-------|----------|--------|
| F9 | Functional | 🔴 Open | Sign-in console warning: `setState during render` | Hexclave `StackHandler` | Hexclave internal bug — not our code, but visible in browser console |
| F10 | Functional | 🔴 Open | `nda/verify` uses anon key — inconsistent auth pattern | `app/api/nda/verify/route.ts` | Intentionally public, so anon key is correct — but pattern is inconsistent |
| M1 | Motion | 🔴 Open | Float animations missing `will-change: transform` | `app/onboarding/page.tsx` | Three simultaneously animating divs without GPU compositing hints — can jank on low-end devices |
| M2 | Motion | 🔴 Open | No `prefers-reduced-motion` support | `app/globals.css` | All animations play regardless of OS accessibility setting |
| M3 | Motion | 🔴 Open | Onboarding step exit animation doesn't play | `app/onboarding/page.tsx` | `key={step}` remounts immediately — previous step unmounts before exit animation runs |
| M4 | Motion | 🔴 Open | `px-slot-reveal` keyframe defined but never applied | `app/globals.css:131` | Dead CSS |
| M5 | Motion | 🔴 Open | SVG bar chart has no enter animation | `app/analytics/AnalyticsDashboard.tsx` | Bars appear instantly — staggered enter would match motion language |
| M6 | Motion | 🔴 Open | `transition: all` used in admin delete button | `app/admin/AdminClient.tsx:221` | Performance anti-pattern — animates layout-triggering properties |
| E9 | Engineering | 🔴 Open | IP-based fingerprinting inaccurate behind NAT/CDN | `app/api/analytics/route.ts` | Users behind shared NAT counted as one visitor; also raises GDPR considerations |
| E10 | Engineering | 🔴 Open | AI generation cache has no TTL or eviction | `app/api/ai/generate/route.ts:43` | Cache grows unbounded |
| E11 | Engineering | 🔴 Open | Case study editor auto-save not verified | `app/case-study/[id]/page.tsx` | PRD specifies auto-save every 30s — implementation needs verification |

---

## Fix Log

| Date | Bug ID | Fixed by | Notes |
|------|--------|----------|-------|
| 2026-06-06 | F1 | `app/layout.tsx` | Added `<Suspense>` wrapper in root layout |
| 2026-06-06 | F4 | `app/api/ai/generate/route.ts` | Credit refund on generation failure |
| 2026-06-06 | D1 | `app/sign-in/` | Custom branded sign-in page + updated middleware + stack config |
| 2026-06-06 | E1 | `app/api/analytics/route.ts` | userId ownership validation before inserting event |
| 2026-06-06 | E2 | `app/[slug]/page.tsx` | Explicit column select — email excluded from public read |
