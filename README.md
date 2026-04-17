# Procure AI Prep

Hackathon-prep project: an AI-triaged procurement intake tool. Requesters submit a purchase need in plain English, an LLM extracts structured fields (category, estimated spend, urgency, suggested vendors), and an approver reviews and decides.

See [`PLAN.md`](PLAN.md) for the full roadmap and design decisions.

## Stack

- **Frontend:** Vite + React + TypeScript, TanStack Query, TanStack Router
- **Backend:** Fastify + TypeScript, Zod, Drizzle ORM
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
# Remaining commands (db:up, migrations, dev servers) come online as we build.
```

## Project structure

```
procure-ai-prep/
├── apps/
│   ├── api/                  # Fastify backend (scaffolded in step 3)
│   └── web/                  # React frontend (scaffolded in step 8)
├── packages/
│   └── shared/               # Zod schemas shared by api and web (step 5)
├── PLAN.md                   # Step-by-step build plan
├── pnpm-workspace.yaml       # Workspaces + supply-chain settings
├── tsconfig.base.json        # Strict shared TypeScript config
└── .env.example              # Environment variable template
```

## Status

Currently at **step 1 of 12** (monorepo scaffold complete). Next: Postgres via `docker-compose`.

### Build order

Steps execute in the order `1 → 2 → 3 → 8 → 4 → 5 → 6 → 7 → 9 → 10 → 11 → 12`. After step 8, a long-lived `scaffold` branch is frozen — monorepo + DB + API skeleton + web skeleton — so it can be reused as a starting point for future hackathon runs. Product-specific work (schemas, endpoints, screens) lives only on `main`.
