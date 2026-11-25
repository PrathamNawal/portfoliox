-- PortfolioX MCP server: personal access tokens, per-user integration secrets, and pipeline runs.
-- All three are read and written only by server routes with the service role (no client access).

create table if not exists mcp_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  name          text not null default 'MCP client',
  token_hash    text not null unique,          -- sha256 of the token; the token itself is never stored
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);
create index if not exists mcp_tokens_user_idx on mcp_tokens(user_id);

create table if not exists mcp_user_settings (
  user_id          uuid primary key references profiles(id) on delete cascade,
  figma_token_enc  text,                       -- AES-256-GCM with MCP_ENCRYPTION_KEY
  updated_at       timestamptz not null default now()
);

create table if not exists mcp_runs (
  id             uuid primary key,
  user_id        uuid not null references profiles(id) on delete cascade,
  case_study_id  uuid references case_studies(id) on delete set null,
  input_hash     text not null,
  stage          text not null,
  status         text not null check (status in ('running','done','failed')),
  state          jsonb not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists mcp_runs_user_created_idx on mcp_runs(user_id, created_at desc);
create index if not exists mcp_runs_user_hash_idx on mcp_runs(user_id, input_hash);
create index if not exists mcp_runs_case_idx on mcp_runs(case_study_id, updated_at desc);

alter table mcp_tokens enable row level security;
alter table mcp_user_settings enable row level security;
alter table mcp_runs enable row level security;
-- No policies: only the service role (server routes) can read or write these tables.
