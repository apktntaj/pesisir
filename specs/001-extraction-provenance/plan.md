# Implementation Plan: Structured Extraction Provenance

**Branch**: `001-extraction-provenance` | **Date**: 2026-09-25 | **Spec**:
[spec.md](spec.md)

**Input**: Feature specification from
[`specs/001-extraction-provenance/spec.md`](spec.md)

## Summary

Persist immutable OpenClaw extraction submissions for existing source documents,
including fact-level information state, typed evidence locators, confidence, and
append-only human reviews. The VSS API validates and records structured results; it
does not extract document contents or create downstream CIPL, shipment, or customs-job
records.

## Technical Context

**Language/Version**: TypeScript on Bun

**Primary Dependencies**: Hono, Zod, Drizzle ORM, postgres.js

**Storage**: On-premise PostgreSQL; document bytes remain in the existing
`source_documents` table

**Testing**: Bun unit validation tests and API integration tests against local migrated
PostgreSQL

**Target Platform**: Linux-hosted on-premise HTTP API

**Project Type**: Backend API addition

**Performance Goals**: Retrieval excludes original document bytes; creating and
retrieving an extraction is one bounded transactional request.

**Constraints**: Every write uses existing actor attribution, idempotency replay, and
atomic audit protocol. No cloud extraction dependency, free-form operational payload
store, source-document mutation, MCP tool, or workspace UI is in scope.

**Scale/Scope**: One API slice covering source documents, extraction submissions,
fact evidence, and fact-review history. It deliberately does not model CIPL,
shipment, or customs-job facts.

## Constitution Check

| Gate | Status | Evidence |
|---|---|---|
| Canonical on-premise ownership | Pass | New records are API-owned PostgreSQL data and reference the existing canonical source document. |
| Evidence and information state | Pass | Fact state, source locator, confidence, and append-only review are first-class data. |
| Deterministic protection | Pass | Zod and SQL constraints validate state/value combinations; `auditedMutation` commits write, audit, and idempotency record atomically. |
| Human authority | Pass with constraint | Reviews retain actor attribution, but trusted reviewer identity/RBAC remains a production prerequisite and is not claimed as implemented. |
| Conversational structured operation | Pass | OpenClaw supplies structured output; this feature performs no document interpretation. |
| Contract-first evolution | Pass | This plan includes migration, API contract, validation, tests, and explicitly defers MCP/workspace callers. |

**Post-design re-check**: Pass. The data model has no alternate writer, does not expose
document bytes through provenance responses, and has no unapproved high-impact customs
command.

## Implementation Design

1. Add one numbered SQL migration and matching Drizzle schema definitions:
   - `document_extractions`, linked to `source_documents` with restricted deletion;
   - `document_extraction_facts`, linked to its extraction, with a per-extraction
     unique `field`;
   - `document_extraction_fact_reviews`, linked to a fact, append-only.
2. Store asserted and reviewed values as `jsonb`, confidence as an optional integer
   percent, and evidence locators as validated `jsonb` arrays. Add SQL checks for
   recognized information states, confidence bounds, and state/value/conflict
   nullability that SQL can enforce reliably.
3. Add strict Zod request schemas for extraction facts, evidence locators, and reviews.
   Schema refinement is the authoritative guard for JSON-value presence and locator
   shape. Reject duplicate fact fields before starting a transaction.
4. Add `extraction-provenance.ts` as an API module and register it from `app.ts`.
   Implement create/list document extractions, get extraction detail, and append fact
   review routes described in the feature contract.
5. Use `auditedMutation` for both writes. The extraction creation transaction inserts
   the extraction and all facts only after source-document existence and full payload
   validation succeed. The review transaction verifies its target fact.
6. Ensure response projections never select `source_documents.content`. Extraction
   detail returns reviews in deterministic creation order.
7. Merge the feature contract into `apps/api/openapi.yaml` and update
   `apps/api/README.md` plus its API usage guide only for the delivered endpoints.
8. Extend focused Zod tests and the existing API integration suite. Test successful
   state preservation, correction history, absent document, invalid combinations,
   atomic rejection, response byte exclusion, idempotent replay, and conflicting reuse.

## Project Structure

### Documentation (this feature)

```text
specs/001-extraction-provenance/
├── checklists/requirements.md
├── contracts/extraction-provenance.openapi.yaml
├── data-model.md
├── plan.md
├── quickstart.md
├── research.md
└── spec.md
```

### Source Code (repository root)

```text
apps/api/
├── migrations/
│   └── 0007_extraction_provenance.sql
├── src/
│   ├── app.ts
│   ├── db/schema.ts
│   └── modules/
│       ├── extraction-provenance.ts
│       └── schemas.ts
├── test/
│   ├── api.integration.test.ts
│   └── validation.test.ts
├── docs/EVENT_MANAGEMENT_API.md
├── openapi.yaml
└── README.md
```

**Structure Decision**: Add an API module adjacent to `source-lineage.ts` because
extraction facts and reviews have a separate immutable lifecycle, while retaining
`source_documents` as their only source parent. No code changes are planned in
`apps/mcp-server/`, `agents/openclaw/`, or `apps/project-management/` for this slice.

## API Contract Decisions

- `POST /api/v1/source-documents/{sourceDocumentId}/extractions` creates exactly one
  immutable extraction with one or more facts.
- `GET /api/v1/source-documents/{sourceDocumentId}/extractions` lists extraction
  summaries and never returns document bytes.
- `GET /api/v1/extractions/{extractionId}` returns facts, evidence locators, and
  chronological reviews.
- `POST /api/v1/extraction-facts/{extractionFactId}/reviews` appends, never updates,
  a `CONFIRM` or `CORRECT` review.
- Both mutation endpoints require the standard actor, idempotency, and optional source
  message headers. They return `201` on first success, replay the original response for
  an identical retry, and return `409` for conflicting key reuse.

## Verification Plan

Run from `apps/api/` after the migration:

1. `bun run typecheck`
2. `bun test test/validation.test.ts`
3. `bun test test/api.integration.test.ts`
4. Execute the four scenarios in [quickstart.md](quickstart.md), including retrieval
   of a source-backed, inferred, unknown, conflicting, and reviewed fact.

The integration test cleanup must delete review rows, facts, and extractions before
source documents, then remove associated audit/idempotency test records.
