# Project Structure

## Repository layout

```
pesisir/
├── apps/
│   ├── api/                    # VSS Operations API — system of record (Hono + Drizzle + PostgreSQL)
│   ├── mcp-server/             # MCP tool adapter bridging OpenClaw ↔ apps/api (stdio, MCP protocol)
│   ├── project-management/     # Next.js 14 web workspace (operational overview, review, editing)
│   ├── insw-gateway/           # INSW/LARTAS integration gateway (supporting service)
│   └── workspace/              # Svelte scaffold — FROZEN, not under active development
├── agents/
│   └── pi/
│       └── ppjk-tools/         # Pi PPJK domain tools (document identification, HS classification, verification)
├── specs/                      # Feature specifications (e.g. 005-workspace-api-cutover.md)
├── AGENTS.md                   # Repo-wide agent/dev constraints — read before changing anything
└── PROJECT_INTENT.md           # Product north star — applies to every subproject
```

No monorepo tooling. Each subproject has its own `package.json` and is managed independently.

---

## `apps/api` layout

```
apps/api/
├── src/
│   ├── app.ts                  # Hono app factory — registers all route modules
│   ├── server.ts               # Entry point — creates DB connection, starts server
│   ├── db/
│   │   ├── client.ts           # Drizzle + postgres client setup
│   │   ├── migrate.ts          # Migration runner
│   │   └── schema.ts           # All Drizzle table definitions (single source of truth)
│   ├── modules/                # Route modules, one file per aggregate
│   │   ├── event-management.ts
│   │   ├── shipments.ts
│   │   ├── customs-jobs.ts
│   │   ├── cipl-versions.ts
│   │   ├── tickets.ts
│   │   ├── source-lineage.ts
│   │   ├── extraction-provenance.ts
│   │   └── schemas.ts          # Zod schemas for all request bodies
│   └── shared/
│       ├── mutations.ts        # auditedMutation() — transactional write + audit + idempotency
│       ├── errors.ts           # ApiError class and notFound() helper
│       └── responses.ts        # Shared Zod schemas (idSchema, paginationSchema)
├── migrations/                 # SQL migration files (sequential: 0001_, 0002_, …)
├── docs/                       # API documentation markdown
├── compose.yml                 # Docker Compose for local PostgreSQL + API
└── Dockerfile
```

**Adding a new aggregate:** create `src/modules/{aggregate}.ts`, add Drizzle tables to `src/db/schema.ts`, write a new SQL migration in `migrations/`, register with `register*Routes(app, db)` in `src/app.ts`.

---

## `apps/mcp-server` layout

```
apps/mcp-server/
├── src/
│   ├── server.ts               # MCP server — all tool registrations
│   ├── vss-client.ts           # HTTP client for apps/api
│   └── config.ts               # Loads env config (API base URL, etc.)
├── scripts/
│   └── mcp-smoke.ts            # Smoke test for MCP tools
└── dist/                       # Built output (node target, gitignored)
```

---

## `apps/project-management` layout

```
apps/project-management/
├── app/                        # Next.js App Router route segments
│   ├── (auth)/                 # Login route group
│   ├── (dashboard)/            # Main workspace route group
│   └── api/                    # Next.js API routes (classify, export, parse, etc.)
├── components/                 # Reusable UI components (never import storage adapters here)
├── domain/                     # Storage-agnostic entity types and Zod schemas (v1 and v2)
├── lib/
│   ├── data-client.ts          # Public data façade — only import point for UI code
│   ├── file/                   # Browser-local persistence adapters (IndexedDB-backed)
│   ├── mock-data.ts            # Demo data seeding
│   └── demo-users.ts           # Server-only demo auth users
└── public/
```

**Migration status:** persistence is being migrated from browser-local storage to `apps/api` HTTP client one aggregate at a time (see `specs/005-workspace-api-cutover.md`). Always check `lib/data-client.ts` to understand the current backing adapter before changing persistence code.

---

## `agents/pi/ppjk-tools` layout

```
agents/pi/ppjk-tools/
├── extensions/                 # Pi tool extensions (identify-trade-document, verify-trade-documents)
├── lib/                        # Deterministic domain logic (trade-document-verification)
├── prompts/                    # Prompt markdown files for Pi tools
├── skills/                     # Pi skill definitions (document-intake, klasifikasi-barang-pabean, pemeriksaan-dokumen-impor)
└── tests/
```

---

## Architecture data flow

```
WhatsApp
  └─→ OpenClaw agent
        ├─→ apps/mcp-server  (MCP tools over stdio)
        │     └─→ apps/api   (HTTP, system of record, PostgreSQL)
        └─→ agents/pi/ppjk-tools  (deterministic PPJK tools)

apps/project-management  (Next.js web UI)
  └─→ apps/api  (HTTP — migration in progress, currently also browser-local)

apps/insw-gateway  (LARTAS/INSW queries — supporting service)
```

## Key constraints

- `apps/workspace/` is frozen — do not modify it
- `agents/pi/ppjk-tools` does not own operational data; it only provides deterministic primitive tools
- `apps/project-management` UI code must access data only through `@/lib/data-client` — no direct storage adapter imports from `app/` or `components/`
- Read `AGENTS.md` and `PROJECT_INTENT.md` before making architectural decisions
