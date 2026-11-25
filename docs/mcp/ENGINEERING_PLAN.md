# PortfolioX MCP server — engineering plan (v1)

Scope: tab 1 of the PRD ("PortfolioX MCP Server — PRD"). The user gives a brief, process notes and design links;
`build_case_study` returns a saved, publish-ready draft and asks at most 3 questions. Everything else in v1 is
there to refine, check and publish that draft.

## What shipped

| Area | Where |
| --- | --- |
| MCP endpoint (Streamable HTTP, stateless, JSON responses) | `app/api/mcp/route.ts`, `lib/mcp/handler.ts` |
| Tools, resources, prompt | `lib/mcp/server.ts` |
| Tool logic (protocol-free) | `lib/mcp/service.ts` |
| Pipeline stages | `lib/mcp/pipeline/` — `ingest`, `labels`, `facts`, `plan`, `write`, `validate`, `questions`, `quality` |
| Data access (Supabase + in-memory) | `lib/mcp/store.ts`, `lib/mcp/testing/memory-store.ts` |
| Tokens, encryption, confirmation tokens | `lib/mcp/auth.ts` |
| Token + Figma settings UI and API | `app/dashboard/mcp/page.tsx`, `app/api/mcp/tokens/route.ts`; linked from the dashboard user menu |
| Schema | `supabase/migrations/20261125000000_mcp_server.sql` (also appended to `supabase/schema.sql`) |
| Tests | `scripts/test-mcp-units.ts` (70 checks), `scripts/test-mcp-e2e.ts` (68 checks) → `npm run test:mcp` |
| CI | `.github/workflows/ci.yml`: typecheck, MCP tests, production build on every PR |

### Tools (v1)

`build_case_study`, `answer_open_decisions`, `refine_section`, `regroup_screens`, `list_case_studies`,
`get_case_study`, `quality_report`, `get_preview`, `publish`, `unpublish`, `set_nda`.
Resources: `portfolio://profile`, `portfolio://case/{id}`. Prompt: `case_study_from_project`.

## Architecture

```
MCP client ──POST /api/mcp (Bearer pxm_…)──▶ handler: token → user id
                                               │
                                     McpServer (per request, stateless)
                                               │
                                        service.ts (tool logic)
             ┌─────────────────────────────────┼───────────────────────────────┐
         Store (Supabase)                 pipeline/                    LLM (OpenRouter), Figma REST
```

`build_case_study` runs six stages and saves the run to `mcp_runs` before each one:

1. **ingest** — Figma frames (via the user's Figma token), image URLs, video and prototype links → stored screens.
   Content-addressed storage (`{user}/mcp/{sha256}.png`), so re-imports never duplicate. Max 40 Figma frames,
   sampled evenly across the file; 15 MB per image; private/internal addresses are refused.
2. **label** — vision model labels each screen (research, audit, flow, wireframe, hi-fi, before/after, …) and
   captions it. Falls back to frame-name heuristics.
3. **facts** — model extracts a fact sheet. A fact is `provided` only if its quote is really in the user's text;
   metrics survive only if their number is in the user's text. Falls back to keyword extraction.
4. **plan** — deterministic. Discipline template, adapted: no research evidence → no Research section; next steps
   mentioned → What's Next. Screens map to sections by kind; before/after → compare slider; prototype → Figma embed;
   >12 images → "More screens".
5. **write** — one model call drafts every section from the fact sheet and the screens in it. Every number in the
   output must appear in the user's material; sentences that fail are removed (deterministic, can't add a claim).
6. **save** — writes `sections` + `overview_data` (the fields the published pages read), picks a cover, chooses
   open decisions, builds the provenance report.

### Key decisions

| Decision | Why | Revisit when |
| --- | --- | --- |
| Personal access tokens instead of OAuth 2.1 | Ships the core loop now; works in Claude Code, Claude Desktop, Cursor. Tokens are hashed, revocable, max 5 per user | v1.1: add OAuth so claude.ai custom connectors work without pasting a token |
| Endpoint inside the Next.js app | No new service to deploy or secure; reuses Supabase, storage and credits | Runs regularly exceed the function time limit |
| Stateless transport, JSON responses | Works on serverless; no session affinity | We need server-initiated messages (progress streaming) |
| Deterministic validator, planner, question policy, rubric | Testable, explainable, can't hallucinate | — |
| Numbers are hard-checked; proper nouns are reported | Number checks are precise; name checks are too noisy to strip text on | Eval data shows name fabrication in practice |
| Two-step confirmation tokens (HMAC, 10 min, bound to user + action + target) on publish, unpublish, NDA | The client must come back after asking the user; a token for one action can't do another | Clients widely support MCP elicitation |
| Credits: 3 per build, 1 per rewrite, free plan only, charged only when the model actually wrote | Fits the existing 10-credit free pool; failures cost nothing | Pricing review |
| 20 builds per user per hour | Abuse guard on the expensive path | Real usage data |

### Ambiguity handling (as built)

- Draft first: the tool always saves a draft unless no asset could be imported (then it fails with a fix per asset).
- At most 3 questions, priority: contradictions → missing outcome → unclear role → confidentiality → uncertain
  screen grouping. Each has options and a default the draft already uses.
- Confidentiality signals or contradictions **block publishing** until answered.
- Model outage: labels, facts and text fall back to deterministic versions; the user gets a usable draft, a warning,
  and no credit charge.
- Failures save the run; `build_case_study({ run_id })` resumes from the failed stage. Passing `assets` with
  `run_id` replaces broken links.
- Same input twice returns the existing draft (`force: true` rebuilds).

## Testing

| Layer | How | Result |
| --- | --- | --- |
| Units: validator, question policy, planner, heuristics, Figma parsing, SSRF guard, rubric, tokens, crypto | `npx tsx scripts/test-mcp-units.ts` | 70/70 |
| End to end over HTTP + JSON-RPC: auth, tools/list, build, idempotency, answers, regroup, refine, isolation between users, publish with slug + confirmation, NDA, unpublish, failure + resume, confidentiality gate, model outage, credit limits | `npx tsx scripts/test-mcp-e2e.ts` (in-memory store, scripted LLM, fake Figma) | 68/68 |
| Types and build | `npm run typecheck`, `npm run build` | pass |
| Live HTTP smoke | `next start`, `POST /api/mcp` without token → 401 + `WWW-Authenticate`; `/dashboard/mcp` → sign-in redirect | pass |
| Existing suites | `scripts/test-*.ts` | all still pass |

Not yet covered: real OpenRouter and Figma calls (no keys in CI), and the quality eval set from the PRD.
**Before beta**, run the eval: 25-30 real briefs × `build_case_study` against staging, scored on publishability,
fabrications (must be 0), screen mapping and question quality.

## Deployment runbook

1. **Secrets (Vercel → Project → Settings → Environment Variables)**
   - `MCP_ENCRYPTION_KEY` — required. `openssl rand -base64 32`. Changing it invalidates saved Figma tokens and
     pending confirmation tokens.
   - `OPENROUTER_API_KEY` — already set. Must have access to a vision-capable model (default Claude Haiku 4.5).
   - Optional: `MCP_MODEL`, `FIGMA_ACCESS_TOKEN` (fallback), `MCP_BUILD_CREDIT_COST`.
2. **Database** — apply `supabase/migrations/20261125000000_mcp_server.sql` (SQL editor or `supabase db push`).
   Additive only: three new tables, no changes to existing ones. Apply **before** deploying the code.
3. **Function duration** — `/api/mcp` sets `maxDuration = 300`. On Vercel Hobby the cap is lower; long Figma files
   then time out mid-run and the client resumes with `run_id` (saved per stage), so it degrades but works.
4. **Deploy** — merge the PR; Vercel deploys `main`.
5. **Verify in production**
   - `curl -i -X POST https://<domain>/api/mcp` → `401`.
   - Dashboard → user menu → Connect AI assistant → create a token, connect Figma.
   - `claude mcp add --transport http portfoliox https://<domain>/api/mcp --header "Authorization: Bearer pxm_…"`,
     then ask Claude to build a case study from a real Figma file. Check the draft in the editor, answer the
     questions, publish, open the live link, then unpublish.
6. **Rollback** — revert the PR. The tables can stay; nothing else reads them. To cut access without a deploy,
   set `revoked_at` on `mcp_tokens` rows.

## Known limits and follow-ups

- **Security (pre-existing, not introduced here): the `px_session` cookie is unsigned base64 JSON**
  (`app/api/auth/session/route.ts`). Anyone can forge a session for any user id across the whole app, including
  the new token page. The MCP endpoint itself does not use this cookie. Fix before promoting the MCP feature:
  sign the cookie (HMAC or a JWT), or switch to Firebase session cookies.
- OAuth 2.1 for claude.ai custom connectors (v1.1).
- PDF and deck inputs, Drive and Notion imports (tab 2, v2).
- `ai_generation_cache.section_type` only allows intro/process/outcome, so the existing editor's cache writes
  for other section types fail silently (pre-existing). The MCP pipeline doesn't use that table.
- DNS-rebinding-proof SSRF protection (resolve and pin the IP) if image imports open to untrusted traffic at scale.
