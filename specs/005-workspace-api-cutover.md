# Workspace API Cutover

## Decision

`apps/project-management` becomes an API client of `apps/api`; it must not directly connect to PostgreSQL and must not retain a writable runtime store. `lib/data-client.ts` remains the sole UI data boundary, but its runtime re-exports are replaced aggregate-by-aggregate with HTTP API calls.

## Identity

Users remain canonical API records because actor attribution, assignment, approval, and authorization require them. `MOCK_USERS`, in-memory mutation, demo credentials, and the hard-coded NextAuth secret are development scaffolding to retire after local API identity/session support exists.

## Migration Order

1. Finish canonical APIs for Customs Job, users/roles, and tickets.
2. Add server-side API client/session identity translation in Next.js.
3. Cut over Event, CIPL, Shipment, Customs Job, and Ticket callers one aggregate at a time.
4. Add an explicit one-time import tool for any required runtime/mock records; never keep browser runtime and API as concurrent writers.
5. Remove runtime mutation APIs, mock seeding mode, and demo identity after every caller has moved.

## Acceptance Criteria

- Reload, a new tab, and a Next.js restart preserve every migrated record.
- OpenClaw and Next.js observe the same API record identifiers and lifecycle history.
- No component imports `lib/file.ts`.
- No production route authenticates against `MOCK_USERS`.
- Workspace mutation failures expose API validation errors and do not silently mutate local state.
