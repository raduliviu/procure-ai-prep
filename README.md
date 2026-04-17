# Procure AI Prep

Hackathon-prep project: an AI-triaged procurement intake tool. Requesters submit a purchase need in plain English, an LLM extracts structured fields (category, estimated spend, urgency, suggested vendors), and an approver reviews and decides.

See [`PLAN.md`](PLAN.md) for the full roadmap and design decisions.

## Stack

- **Frontend:** Vite + React + TypeScript, TanStack Query, TanStack Router
- **Backend:** Hono + TypeScript, Zod, Drizzle ORM
- **Shared:** `packages/shared` — Zod schemas reused by both apps for end-to-end types
- **Database:** PostgreSQL 18 (via `docker-compose`)
- **AI:** OpenAI SDK, `gpt-4o-mini` with structured outputs
- **Monorepo:** pnpm workspaces (with `minimumReleaseAge: 4320` supply-chain gate)

## Prerequisites

- **Node 24** (pinned via `.nvmrc`; `nvm use` to switch)
- **pnpm 10.33+** (install via `corepack enable && corepack prepare pnpm@latest --activate`)
- **Docker** (for Postgres)
- **OpenAI API key**

## Getting started

```bash
cp .env.example .env          # fill in OPENAI_API_KEY
pnpm install
pnpm db:up                    # start Postgres in Docker
```

