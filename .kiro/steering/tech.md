# Tech Stack

## Subprojects at a glance

| Subproject | Runtime | Framework | DB | Package manager |
|---|---|---|---|---|
| `apps/api` | Bun | Hono | PostgreSQL 16 (Drizzle ORM) | Bun |
| `apps/mcp-server` | Bun (build) / Node (serve) | `@modelcontextprotocol/server` v2 | — | npm |
| `apps/project-management` | Node | Next.js 14 App Router | — (IndexedDB → API migration) | npm |
| `apps/insw-gateway` | Bun | `Bun.serve()` (manual routing) | — | Bun |
| `agents/pi/ppjk-tools` | Node | Pi agent framework | — | npm |

No monorepo tooling — each subproject is managed independently. There is no root `package.json`.

---

## `apps/api` — VSS Operations API

**Stack:** TypeScript · Hono · Drizzle ORM · PostgreSQL 16 · Zod v4 · Bun  
**Config:** strict TypeScript, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `moduleResolution: "bundler"`, `types: ["bun-types"]`

```bash
bun install
bun run dev               # bun --watch src/server.ts (port 3001)
bun run start             # bun src/server.ts
bun run db:migrate        # runs src/db/migrate.ts
bun run typecheck         # tsc --noEmit
bun test test/validation.test.ts
bun test test/api.integration.test.ts   # requires live PostgreSQL

# Docker (PostgreSQL)
docker compose up -d postgres
docker compose up         # api + postgres
```

**Key patterns:**
- All routes: `GET|POST|PATCH /api/v1/{resource}` with UUID path params
- No hard deletes — resources are archived via lifecycle commands
- Every write requires headers: `X-Actor-Ref`, `Idempotency-Key` (UUID ≥8 chars), optionally `X-Source-Message-Id`
- `auditedMutation()` in `src/shared/mutations.ts` wraps all writes: executes mutation + inserts `audit_events` row + inserts `idempotency_records` row atomically inside a DB transaction
- `ApiError` class with `.status`, `.code`, `.message`, `.details`
- Error response shape: `{ error: { code, message, details } }`
- List response shape: `{ data: [...], meta: { limit, offset, total } }`
- Single response shape: `{ data: {...} }`
- Route modules registered via `register*Routes(app, db)` functions in `src/modules/`

---

## `apps/mcp-server` — MCP Tool Adapter

**Stack:** TypeScript · `@modelcontextprotocol/server` v2 · Zod v4 · Bun (build) · Node (serve)

```bash
npm install
bun run build             # bundles to dist/server.js (target: node)
node --env-file=.env dist/server.js
bun run typecheck         # tsc --noEmit
bun run smoke:mcp         # bun scripts/mcp-smoke.ts
```

**Key patterns:**
- Served over stdio (not HTTP)
- Tools split into `readAnnotations` (readOnlyHint: true) and `writeAnnotations` (readOnlyHint: false, idempotentHint: true)
- All write tools require `actorRef`, `sourceMessageId`, `idempotencyKey` in their input schema
- `VssClient` in `src/vss-client.ts` handles HTTP to `apps/api`
- `textResult()` / `errorResult()` helpers normalize all tool return values

---

## `apps/project-management` — Next.js Web Workspace

**Stack:** TypeScript · Next.js 14 App Router · React 18 · Tailwind CSS 3 · Zod 3.x · NextAuth v5 beta · `@base-ui/react` · `dnd-kit` · npm

```bash
npm install
npm run dev               # next dev
npm run build             # next build
npm run lint              # next lint (eslint next/core-web-vitals)
npm run domain:test       # tsx domain validation tests
npx tsc --noEmit          # type check
```

**Style:** Prettier — `singleQuote: true, semi: false, tabWidth: 2, trailingComma: "all", printWidth: 100`  
**Path alias:** `@/` resolves to the `apps/project-management` root  
**Data access rule:** UI code in `app/` and `components/` must access data only through `@/lib/data-client` — never import storage adapters directly (enforced by ESLint)  
**Toast rule:** All form feedback (success + failure) uses toast notifications, bottom-right only. Field-level errors stay near their inputs.

---

## `apps/insw-gateway` — INSW/LARTAS Gateway

**Stack:** TypeScript · `Bun.serve()` · Bun  
**Style:** 4-space indentation (differs from other subprojects)

```bash
bun install
bun run dev               # bun --watch src/server.ts
bun run start             # bun src/server.ts
bun run typecheck         # tsc --noEmit
```

---

## `agents/pi/ppjk-tools` — Pi PPJK Tool Package

**Stack:** TypeScript · Pi agent framework (`@earendil-works/pi-coding-agent`) · Node built-in test runner

```bash
node --test tests/*.test.ts
```

---

## Docker — deployment on-premise

Semua service dijalankan dari root repository lewat satu `compose.yml`.

```bash
# Salin dan isi konfigurasi
cp .env.example .env
# Edit .env — minimal isi AUTH_SECRET (wajib):
#   openssl rand -base64 32

# Jalankan semua service
docker compose up -d

# Hanya database (untuk pengembangan lokal tanpa Docker)
docker compose up -d postgres
```

**Port mapping (localhost only):**

| Service | Port | Keterangan |
|---|---|---|
| `project-management` | 3000 | Next.js web UI |
| `api` | 3001 | VSS Operations API |
| `insw-gateway` | 3002 | INSW/LARTAS gateway |
| `postgres` | 5432 | PostgreSQL 16 |

**Dockerfile per subproject:**

| Subproject | Ada Dockerfile | Catatan |
|---|---|---|
| `apps/api` | ✅ | Bun, single-stage, auto-migrate saat start |
| `apps/project-management` | ✅ | Node, multi-stage (deps → builder → production), `output: 'standalone'` |
| `apps/insw-gateway` | ✅ | Bun, single-stage, volume untuk `token.txt` |
| `apps/mcp-server` | ❌ | Dijalankan via stdio oleh OpenClaw — belum dikontainerisasi |

**Variable wajib di `.env` root:**
- `AUTH_SECRET` — rahasia sesi NextAuth, buat dengan `openssl rand -base64 32`
- `POSTGRES_PASSWORD` — ganti dari default `vss` di production

---

## Shared conventions

- **TypeScript everywhere**, strict mode in all subprojects
- **Zod** for runtime validation (v4 in API/MCP, v3 in project-management)
- **Naming:** camelCase vars/functions, PascalCase types/classes, `SCREAMING_SNAKE` for enum values and error codes
- **DB columns:** `snake_case`; Drizzle maps to camelCase TS properties
- **API routes:** `kebab-case` resource names (`event-organizers`, `cipl-versions`)
- **`actorRef`:** stable string reference like `whatsapp:+628123456789` — not a DB user ID
- Do not introduce Gemini or any cloud document-extraction dependency into the backend or web app
