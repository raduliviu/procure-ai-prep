# Procure AI Hackathon Prep — Intake Triage App

> **Historical note.** This document was the build plan during development. The project has since shipped; for current setup, usage, and architecture see [`README.md`](README.md). This file is kept as a record of the design thinking, not as live documentation — some specifics (step ordering, small API details) diverged from this plan during execution.

## Why this app

A one-page procurement intake tool: a requester types a purchase need in plain English, an LLM triages it into structured fields (category, amount, urgency, suggested vendors), and an approver reviews and decides. This deliberately mirrors Procure AI's _Generative Intake Management_ module so the practice reps transfer directly to the hackathon day.

## Stack

- **Frontend:** Vite + React + TypeScript, TanStack Query, TanStack Router (code-based routes for simplicity)
- **Backend:** Hono + TypeScript, `@hono/node-server`, `@hono/zod-validator`, Drizzle ORM, `tsx` for dev
- **Shared:** `packages/shared` — Zod schemas imported by both apps so API contracts and LLM output types are defined once
- **Database:** PostgreSQL 18 (via `docker-compose`)
- **AI:** OpenAI SDK, `gpt-4o-mini` with structured outputs (`response_format: json_schema`, `strict: true`)
- **Monorepo:** pnpm workspaces (no Turborepo/Nx — keep it boring). `minimumReleaseAge: 4320` (3 days) in `pnpm-workspace.yaml` for supply-chain safety — packages must be published for at least 3 days before pnpm will install them

## Data model

Two tables — inline fields beat a separate approvals table at this scope.

```
users
  id, name, email, role ('requester' | 'approver')

purchase_requests
  id, requester_id, raw_text, status
    ('submitted' | 'triaged' | 'approved' | 'rejected')
  triage_category, triage_estimated_amount, triage_currency,
    triage_urgency, triage_suggested_vendors (jsonb),
    triage_confidence, triage_reasoning      -- nullable until AI runs
  decision_by, decision_note, decided_at
  created_at, updated_at
```

## API

```
POST   /api/requests              { rawText } → creates + triages
GET    /api/requests?status=…     list
GET    /api/requests/:id          detail
POST   /api/requests/:id/triage   re-run AI
POST   /api/requests/:id/decision { decision, note }
```

Mock auth: `x-user-id` header. Role enforcement lives in the decision endpoint.

## AI triage contract

```ts
{
  category: 'IT' | 'Office' | 'Marketing' | 'Travel' | 'Services' | 'Other',
  estimatedAmount: number,
  currency: 'EUR' | 'GBP' | 'USD',
  urgency: 'low' | 'medium' | 'high',
  suggestedVendors: { name: string, reason: string }[],
  confidence: number,              // 0..1
  reasoning: string                // one sentence
}
```

Seed a small fixed category list and ~20 vendors so the LLM has something to anchor to.

## UI screens

1. **New request** — textarea + submit, loading state, redirect to detail.
2. **Request detail** — raw text, read-only triage panel with a re-run button, status chip, approve/reject bar for approvers.
3. **Queue** — role-aware list with status chips.

Role toggle in the header (requester ↔ approver) rewrites `x-user-id` in localStorage.

---

## Build order and the scaffold branch

The steps below are numbered by logical grouping, but we **execute them in the order 1 → 2 → 3 → 8 → 4 → 5 → 6 → 7 → 9 → 10 → 11 → 12**. The reorder lets us freeze a reusable scaffold once the skeleton boots end-to-end but before any product-specific code exists.

After step 8 we create a long-lived `scaffold` branch (never merged back into `main`). That branch captures: monorepo, Postgres, Hono + `/health`, and the Vite + React + TS + TanStack Query + TanStack Router shell with a typed API client. It's deliberately **product-agnostic** and can be cloned as a starting point for future hackathon runs.

Everything from step 4 onward (schemas, endpoints, screens, seed data) stays on `main` and does not touch the scaffold branch.

---

## Step-by-step plan

Each step is demoable on its own — stop and check before moving on.

### 1. Monorepo scaffold

Root `package.json` plus a `pnpm-workspace.yaml` listing `apps/*` and `packages/*`. That same workspace file also carries `minimumReleaseAge: 4320` (3 days) for supply-chain safety. Shared `tsconfig.base.json`, a single `.env.example`, `.gitignore`, `.nvmrc`. No Turborepo/Nx — pnpm workspaces are enough for three packages. The `packages/shared` workspace starts empty and gets its first Zod schemas in step 5 (request payloads) and step 6 (triage output), imported by both `apps/api` and `apps/web`.

### 2. Postgres via docker-compose

One `postgres:18-alpine` service, creds read from `.env`, healthcheck so downstream scripts can wait on it, named volume so data survives restarts. Root-level `db:up` / `db:down` scripts.

### 3. API scaffold (Hono + TS)

`apps/api` with Hono + `@hono/node-server`, `tsx` for dev reload, Hono's built-in `logger` middleware. A `/health` route returning `{ ok: true }`. Pause here to confirm `pnpm --filter @procure/api run dev` boots cleanly before touching the DB.

### 4. DB schema + migration + seed

Drizzle ORM + `drizzle-kit`. Two tables in `src/db/schema.ts` (users, purchase_requests). Generate a migration, apply it, write a seed script that inserts one requester + one approver so we don't deal with signup flow.

### 5. Request CRUD (no AI yet)

Three endpoints: `POST /api/requests` (inserts with `status='submitted'`), `GET /api/requests?status=…`, `GET /api/requests/:id`. Zod schemas for request/response validation. Smoke test with `curl` so the API feels real before the LLM enters the picture.

### 6. OpenAI triage integration

OpenAI SDK + a `triageRequest(rawText)` service using `response_format: { type: "json_schema", strict: true }` so the output is typed and guaranteed to validate. On create, call triage right after insert, persist the structured result, flip status to `triaged`. Add `POST /api/requests/:id/triage` for re-runs.

### 7. Decision endpoint + mock auth

`POST /api/requests/:id/decision` with `{ decision, note }`. Reads `x-user-id` header as the actor (mock auth — document clearly that this isn't production). Validates that only `triaged` requests can transition to `approved`/`rejected`. Enforces role = approver.

### 8. Web scaffold

`apps/web` with Vite + React + TS. TanStack Query provider, a typed `apiClient` wrapper around `fetch` that sets `x-user-id` from localStorage, a header with a role toggle (requester ↔ approver) that rewrites the id. Router: **TanStack Router** with code-based route definitions (skip the Vite plugin for file-based routes — less magic for a 1-day build, same type safety). Three routes: `/` (queue), `/requests/new`, `/requests/$id`.

### 9. New-request screen

One textarea, submit button. `useMutation` posts to `/api/requests`, shows a spinner while the server-side triage runs (this will feel slow — that's fine, it's honest UX), then navigates to `/requests/:id`.

### 10. Request-detail screen

Header with status chip. Raw-text block at the top. Triage panel below with editable fields (category dropdown, amount, urgency, vendor list) — edits save on blur via `PATCH`. Action bar at the bottom with Approve/Reject + optional note, visible only when role=approver and status=triaged.

### 11. Queue screen

Role-aware list. Requester sees their own requests; approver sees everything `triaged`. Status chips, date, short summary (use `triage_category` + estimated amount for the row preview). Click-through to detail.

### 12. Seed + README + smoke test

Richer seed (5–10 requests across statuses so the UI isn't empty). README with `docker compose up`, `npm run migrate`, `npm run seed`, `npm run dev`. End-to-end walkthrough: new request → see triage → switch role → approve. Commit as v1.

---

## Stretch (only if ahead of schedule)

- Stream the AI reasoning into the UI with SSE — ~20 min, looks impressive
- Auto-approve when `confidence > 0.9 && estimatedAmount < 500`
- Vendor recommendation: embed seeded vendors, retrieve top-3 by similarity to `raw_text`

## Rough 1-day time budget

- 30m — scaffold (Vite, Hono, docker-compose Postgres, Drizzle migration)
- 90m — backend: CRUD + triage endpoint + LLM call + Zod schemas
- 90m — frontend: form + detail + queue
- 60m — approval flow + polish
- 60m — buffer
