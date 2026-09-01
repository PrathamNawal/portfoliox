# PortfolioX — Setup Guide

## 1. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

Required values:
- **Supabase** — get from your Supabase project → Settings → API
- **Firebase** — get from `console.firebase.google.com` → your project → Settings → General → Web app
- **OpenRouter** — get from `openrouter.ai` → Keys (used for AI section generation, routed to Claude Haiku)

## 2. Supabase project

You need a Supabase project. You can free up a slot by pausing one of your inactive projects (StayPrime or Dfolio), then create a new one named "PortfolioX" in region `ap-southeast-1`.

Once created, apply the schema:
1. Open your Supabase project → SQL Editor
2. Paste and run the full contents of `supabase/schema.sql`

### Storage buckets
Create these two buckets in Storage → New bucket:
- `case-study-images` — Public
- `avatars` — Public
- `resumes` — Private (signed URLs)

## 3. Firebase Auth setup

1. Go to `console.firebase.google.com` and create a project named "PortfolioX"
2. Add a Web app, then enable sign-in methods: Google + Email/Password (Authentication → Sign-in method)
3. Copy the five `NEXT_PUBLIC_FIREBASE_*` values into `.env.local`
4. The app exchanges the Firebase client sign-in for a signed `px_session` cookie via `POST /api/auth/session` (see `lib/firebase/session.ts`) — every server route then re-derives the user from that cookie through `requireAuthContext()`. There's no Supabase Auth/RLS involved; Supabase is written to server-side with the service role key once the Firebase session is verified.

### Admin seeding
After your first login with `pratham.nawal21@gmail.com`, run this in Supabase SQL Editor:

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM profiles WHERE name ILIKE '%pratham%' LIMIT 1
);
```

(Or match on email once you've linked it to the profile.)

## 4. Run locally

```bash
npm run dev
```

Runs at `http://localhost:3000`.

For subdomain routing locally, add to `/etc/hosts`:
```
127.0.0.1  testuser.portfoliox.me
```
And set `NEXT_PUBLIC_APP_DOMAIN=portfoliox.me` — then `testuser.portfoliox.me:3000` will hit your local dev server.

## 5. Vercel deployment

1. Push to GitHub
2. Import into Vercel
3. Set all `.env.local` variables in Vercel → Settings → Environment Variables
4. In Vercel → Domains, add:
   - `portfoliox.me`
   - `*.portfoliox.me` (wildcard)
5. In your DNS, add:
   - `CNAME *.portfoliox.me → cname.vercel-dns.com`
   - `CNAME portfoliox.me → cname.vercel-dns.com`

## Build sequence status

- [x] Step 1: Scaffold + schema + design system
- [x] Step 2: Firebase Auth integration
- [x] Step 3: Onboarding flow
- [x] Step 4: Builder main view
- [x] Step 5: Case study editor
- [x] Step 6: Published portfolios — Canvas + Spotlight
- [x] Step 7: Testimonials, tool stack, work experience, social links, resume
- [x] Step 8: Analytics dashboard
- [x] Step 9: Admin console

All nine steps are built and live. A fresh clone only needs its own Supabase project, Firebase project, and OpenRouter key — nothing above is still in progress.
