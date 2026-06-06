-- PortfolioX — full database schema
-- Apply this in Supabase → SQL Editor (or via CLI: supabase db push)

-- ── Extensions ─────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Profiles ───────────────────────────────────────────────────────
-- One row per user; id matches Stack Auth user ID
create table if not exists profiles (
  id            uuid primary key,
  name          text not null check (char_length(name) <= 60),
  bio           text check (char_length(bio) <= 200),
  avatar_url    text,
  discipline    text check (discipline in ('ux','graphic','motion','illustration')),
  skills        text[] not null default '{}',
  layout        text not null default 'canvas' check (layout in ('canvas','spotlight')),
  slug          text unique check (slug ~ '^[a-z0-9][a-z0-9\-]{1,28}[a-z0-9]$'),
  plan          text not null default 'free' check (plan in ('free','pro')),
  role          text not null default 'user' check (role in ('user','admin')),
  social_links  jsonb not null default '{}',
  resume_url    text,
  email         text,
  onboarding_complete boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Admin Invites ───────────────────────────────────────────────────────────────
create table if not exists admin_invites (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  invited_by uuid references profiles(id) on delete set null,
  accepted   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Case Studies ───────────────────────────────────────────────────
create table if not exists case_studies (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  title            text not null default 'Untitled',
  problem          text,
  what_i_did       text,
  outcome_notes    text,
  cover_image_url  text,
  blocks           jsonb not null default '[]',
  section_labels   jsonb not null default '{}',
  metadata         jsonb not null default '{}',
  nda_enabled      boolean not null default false,
  nda_password_hash text,
  published        boolean not null default false,
  display_order    integer not null default 0,
  ai_input_hash    text,
  ai_generated     jsonb not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists case_studies_user_id_idx on case_studies(user_id);
create index if not exists case_studies_user_published_idx on case_studies(user_id, published);

-- ── Testimonials ───────────────────────────────────────────────────
create table if not exists testimonials (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  name             text not null,
  title_and_company text not null,
  linkedin_url     text,
  quote            text not null check (char_length(quote) >= 20 and char_length(quote) <= 300),
  photo_url        text,
  display_order    integer not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists testimonials_user_id_idx on testimonials(user_id);

-- ── Work Experience ────────────────────────────────────────────────
create table if not exists work_experience (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  role             text not null,
  company          text not null,
  start_month      text not null,
  end_month        text,
  is_current       boolean not null default false,
  description      text check (char_length(description) <= 400),
  discipline_tag   text,
  display_order    integer not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists work_experience_user_id_idx on work_experience(user_id);

-- ── Tool Stack ─────────────────────────────────────────────────────
create table if not exists tool_stack (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  tool_name     text not null,
  display_order integer not null default 0
);

create index if not exists tool_stack_user_id_idx on tool_stack(user_id);

-- ── Analytics Events ───────────────────────────────────────────────
create table if not exists analytics_events (
  id                    bigint primary key generated always as identity,
  user_id               uuid not null references profiles(id) on delete cascade,
  case_study_id         uuid references case_studies(id) on delete cascade,
  event_type            text not null check (event_type in ('page_view','case_study_view','preview')),
  visitor_fingerprint   text,
  time_on_page_seconds  integer,
  recorded_at           timestamptz not null default now()
);

create index if not exists analytics_events_user_id_idx on analytics_events(user_id);
create index if not exists analytics_events_recorded_at_idx on analytics_events(recorded_at);

-- ── NDA Sessions ───────────────────────────────────────────────────
create table if not exists nda_sessions (
  id               uuid primary key default gen_random_uuid(),
  case_study_id    uuid not null references case_studies(id) on delete cascade,
  session_token    text not null unique,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null
);

create index if not exists nda_sessions_token_idx on nda_sessions(session_token);
create index if not exists nda_sessions_expires_idx on nda_sessions(expires_at);

-- ── AI Generation Cache ────────────────────────────────────────────
create table if not exists ai_generation_cache (
  input_hash      text primary key,
  section_type    text not null check (section_type in ('intro','process','outcome')),
  generated_text  text not null,
  created_at      timestamptz not null default now()
);

-- ── AI Credits ─────────────────────────────────────────────────────
create table if not exists ai_credits (
  user_id            uuid primary key references profiles(id) on delete cascade,
  credits_remaining  integer not null default 10,
  updated_at         timestamptz not null default now()
);

-- ── App Settings ───────────────────────────────────────────────────
create table if not exists app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value)
values ('free_tier_case_study_limit', '6')
on conflict (key) do nothing;

-- ── Updated-at trigger ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create or replace trigger case_studies_updated_at
  before update on case_studies
  for each row execute function set_updated_at();

-- ── Row Level Security ─────────────────────────────────────────────
-- NOTE: Stack Auth manages authentication. For RLS, use the user's
-- UUID passed from your server actions (with service role key).
-- Public read for published portfolios; all writes go through API.

alter table profiles         enable row level security;
alter table case_studies     enable row level security;
alter table testimonials     enable row level security;
alter table work_experience  enable row level security;
alter table tool_stack       enable row level security;
alter table analytics_events enable row level security;
alter table ai_credits       enable row level security;

-- Published portfolio: read-only public access via slug
create policy "Public can read published profiles"
  on profiles for select
  using (slug is not null);

create policy "Public can read published case studies"
  on case_studies for select
  using (published = true and nda_enabled = false);

-- All other access goes through service role (server API routes)
-- Your API routes use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS

-- ── Admin seed ─────────────────────────────────────────────────────
-- Run this after first user signup with pratham.nawal21@gmail.com:
-- UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
-- (Or use the seeding function below — call it from your deploy script)

create or replace function seed_admin(admin_email text)
returns void language plpgsql security definer as $$
begin
  -- This is a placeholder; actual mapping requires joining with auth.users
  -- which depends on your auth provider. See SETUP.md for the Stack Auth approach.
  raise notice 'Admin seeding: set role=admin for % after first login', admin_email;
end;
$$;
