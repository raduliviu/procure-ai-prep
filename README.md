# Scaffold — React + Hono + Postgres monorepo

A hackathon-ready starter: pnpm monorepo with a Vite + React + TypeScript web app, a Hono + TypeScript API, Postgres via Docker, Prettier, ESLint, and TanStack Query + Router pre-wired with a typed API client.

This branch is intentionally product-free. Drop your schemas, endpoints, and screens onto your own branch.

## Stack

- **Frontend:** Vite + React + TypeScript, TanStack Query, TanStack Router
- **Backend:** Hono + TypeScript, Drizzle-ready
- **Shared:** `packages/shared` workspace for cross-app types (empty starter)
- **Database:** PostgreSQL 18 (via `docker-compose`)
- **Monorepo:** pnpm workspaces with `minimumReleaseAge` supply-chain gate

## Prerequisites

- **Node 24** (pinned via `.nvmrc`; `nvm use` to switch)
- **pnpm 10.33+** (install via `corepack enable && corepack prepare pnpm@latest --activate`)
- **Docker** (for Postgres)

## Getting started

```bash
cp .env.example .env
pnpm install
pnpm db:up                    # start Postgres in Docker
pnpm dev                      # run api + web in parallel
```

## Next steps for your project

1. Rename `@procure/*` workspace names to match your product
2. Update root `package.json` `name` and `description`
3. Update this README
4. Add secrets to `.env.example` (LLM keys, etc.) as needed
