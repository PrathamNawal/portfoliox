# PortfolioX — Setup Guide

## 1. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

Required values:
- **Supabase** — get from your Supabase project → Settings → API
- **Stack Auth** — get from `app.stack-auth.com` → your project
- **Anthropic** — get from `console.anthropic.com`

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

## 3. Stack Auth setup

1. Go to `app.stack-auth.com` and create a project named "PortfolioX"
2. Enable: Google OAuth + Email/Password
3. Copy the three keys into `.env.local`
4. Install the Stack Auth handler in your app — the onboarding page already uses `/api/auth/google` as the OAuth redirect; configure this URL in your Stack Auth dashboard

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
- [ ] Step 2: Stack Auth integration (needs your Stack Auth keys)
- [ ] Step 3: Onboarding flow (page built, needs auth wired)
- [ ] Step 4: Builder main view (built)
- [ ] Step 5: Case study editor (built)
- [ ] Step 6: Published portfolios — Canvas + Spotlight (built)
- [ ] Step 7: Testimonials, tool stack, work experience, social links, resume
- [ ] Step 8: Analytics dashboard
- [ ] Step 9: Admin console (built)
