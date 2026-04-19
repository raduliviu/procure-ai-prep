# Procure AI Prep

Hackathon-prep project: an AI-triaged procurement intake tool. Requesters submit a purchase need in plain English, an LLM extracts structured fields (category, estimated spend, urgency, suggested vendors), and an approver reviews and decides.

See [`PLAN.md`](PLAN.md) for the full roadmap and design decisions.

## Stack

- **Frontend:** Vite + React + TypeScript, TanStack Query, TanStack Router, shadcn/ui, Tailwind v4
- **Backend:** Hono + TypeScript, Drizzle ORM, Zod
- **Shared:** `packages/shared` — Zod schemas reused by both apps for end-to-end types
- **Database:** PostgreSQL 18 (via `docker-compose`)
- **AI:** OpenAI SDK, `gpt-4o-mini` with structured outputs
- **Monorepo:** pnpm workspaces (with `minimumReleaseAge: 4320` supply-chain gate)

## Prerequisites

- **Node 24** (pinned via `.nvmrc`; `nvm use` to switch)
- **pnpm 10.33+** (install via `corepack enable && corepack prepare pnpm@latest --activate`)
- **Docker** (for Postgres)
- **OpenAI API key** with billing enabled ([platform.openai.com](https://platform.openai.com/settings/organization/billing))

## First-time setup

```bash
cp .env.example .env          # fill in OPENAI_API_KEY
pnpm install
pnpm db:up                    # start Postgres in Docker
pnpm --filter @procure/api run db:migrate
pnpm --filter @procure/api run db:seed
```

The seed inserts 2 users (Rebecca Requester, Alex Approver) and 8 demo requests across every status.

## Running both apps

In one terminal:

```bash
pnpm dev                      # runs the api and the web in parallel
```

- API: http://localhost:3001 (health check: `/health`)
- Web: http://localhost:5173

## Walkthrough

1. Open http://localhost:5173 — pick a role in the header (**Requester** or **Approver**)
2. **Requester** view: see your submitted requests, click **New request** to add one
3. **Approver** view: see every request, open a triaged one and Approve/Reject with an optional note
4. On any request still in `submitted` or `triaged` status, click **Re-run** in the AI triage card to invoke the LLM again

## Useful commands

| Command                                      | What it does                            |
| -------------------------------------------- | --------------------------------------- |
| `pnpm dev`                                   | Run api and web in parallel             |
| `pnpm format` / `format:check`               | Prettier write / verify                 |
| `pnpm -r run typecheck`                      | Typecheck every workspace               |
| `pnpm db:up` / `db:down` / `db:logs`         | Docker Postgres lifecycle               |
| `pnpm --filter @procure/api run db:generate` | Emit a new migration after schema edits |
| `pnpm --filter @procure/api run db:migrate`  | Apply pending migrations                |
| `pnpm --filter @procure/api run db:seed`     | Seed users + demo requests (idempotent) |
| `pnpm --filter @procure/api run db:studio`   | Open Drizzle Studio to browse the DB    |

## Branch layout

- `main` — this product (procurement intake + AI triage + approver decision)
- `scaffold` — the same infrastructure _without_ any product-specific code, suitable as a starter for other hackathon-style React + Hono + Postgres projects. Never merged back to main.
