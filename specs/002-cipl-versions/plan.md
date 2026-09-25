# Implementation Plan: Immutable CIPL Versions

**Branch**: `002-cipl-versions` | **Date**: 2026-09-25 | **Spec**:
[spec.md](spec.md)

## Summary

Add canonical CIPL aggregates, immutable source-backed versions, and immutable items to
the VSS API. A ready command validates complete items and atomically selects the active
version. Shipment allocation, customs jobs, and CIPL document interpretation remain
outside this slice.

## Technical Context

**Language/Version**: TypeScript on Bun  
**Primary Dependencies**: Hono, Zod, Drizzle ORM, postgres.js  
**Storage**: On-premise PostgreSQL with existing source-document records  
**Testing**: Bun validation and PostgreSQL-backed API integration tests  
**Target Platform**: Linux on-premise HTTP API  
**Project Type**: Backend API addition  
**Constraints**: Existing mutation audit/idempotency protocol; CIPL versions and items
are never updated after creation; document bytes are excluded from responses.

## Constitution Check

| Gate | Status | Evidence |
|---|---|---|
| Canonical system of record | Pass | CIPL, version, and item records are API-owned PostgreSQL entities. |
| Evidence and lineage | Pass | Every version references its source document and records receipt/actor metadata. |
| Deterministic protection | Pass | SQL and Zod guard parent status, version/item uniqueness, and ready prerequisites. |
| Human authority | Pass | This slice records operational preparation only; no customs decision or submission occurs. |
| Contract-first evolution | Pass | Migration, API routes, OpenAPI, docs, and integration tests move together. |

## Implementation Design

1. Add migration and Drizzle schema for `cipls`, `cipl_versions`, and `cipl_items`.
   CIPL references one event participation and optional active version. Versions reference
   one source document; items reference one version.
2. Create CIPL atomically with version 1 and immutable items. Create revisions with the
   next version number under the CIPL transaction. Reject inactive event participation
   and missing source documents.
3. Validate item line numbers, descriptions, quantities, units, optional commercial
   fields, and unique lines. Store numeric commercial values as PostgreSQL numeric.
4. Implement the ready command. It verifies at least one valid item and atomically marks
   the version ready, selects it as active, and sets the CIPL status to `READY`.
5. Add list/detail routes. Detail nests versions and items plus source-document metadata,
   never source bytes.
6. Update OpenAPI/API guide and add validation plus integration scenarios for immutability,
   readiness, active-version replacement, lineage, and idempotent retries.

## Project Structure

```text
apps/api/
├── migrations/0008_cipl_versions.sql
├── src/db/schema.ts
├── src/modules/cipl-versions.ts
├── src/modules/schemas.ts
├── src/app.ts
├── openapi.yaml
├── docs/EVENT_MANAGEMENT_API.md
├── test/validation.test.ts
└── test/api.integration.test.ts
```

## Verification Plan

1. Apply migration against local PostgreSQL.
2. Run `bun run typecheck`, validation tests, and integration tests.
3. Create a CIPL with a valid version, ready it, create and ready a revision, retrieve
   history, and verify the earlier version is unchanged.
