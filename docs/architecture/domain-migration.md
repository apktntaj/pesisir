# Domain Migration Inventory

`apps/api/` is the canonical system of record. `apps/project-management/` remains the reference implementation for mature workflow rules while its Supabase persistence and embedded Gemini routes are retired.

## Already canonical in VSS API

- event organizers and venues;
- reusable exhibitor and coordination-agent companies;
- event participation, including local/international agent constraints;
- explicit event and participation lifecycle commands;
- contacts, audit events, and idempotent mutation replay.

These capabilities must not be reimplemented from the Next.js persistence layer.

## Logic to migrate

| Slice | Reference implementation | Invariants to preserve | Target order |
|---|---|---|---:|
| Source documents and provenance | `domain/exhibition/types.ts`, `domain/v2/types.ts` | File metadata is separate from bytes; facts distinguish known, unknown, conflicting, and not applicable; every material fact can cite a source | 1 |
| CIPL and versions | `domain/exhibition/types.ts`, `domain/exhibition/validation.ts` | Immutable numbered versions; active version is explicit; READY requires at least one valid item; item quantity is positive and unit is present | 2 |
| Shipment and item allocation | `domain/exhibition/types.ts`, `domain/exhibition/validation.ts` | Shipment points to one source CIPL version; item and unit must originate from that version; cumulative allocation cannot exceed source quantity | 3 |
| Customs job and allocation | `domain/exhibition/types.ts`, `domain/exhibition/validation.ts` | Job allocation cannot exceed its shipment; forward lifecycle is sequential; backward/reopen transitions require reason and evidence | 4 |
| Document reconciliation | `lib/document-comparison.ts` | Missing data is `UNAVAILABLE`, not a mismatch; text comparison is normalized; numeric comparison uses explicit tolerance | 5 |
| Tickets, blockers, and completion | `domain/ticket/validation.ts`, `domain/v2/types.ts` | Every ticket has an assignee and context; DONE requires an outcome; reopening requires a reason; blocker resolution retains evidence | 6 |
| Billing, approval, and human authority | `domain/exhibition/types.ts`, `domain/v2/types.ts` | Not-ready, not-applicable, invoiced, and paid states remain distinct; high-impact customs and payment actions require authorized approval | 7 |

## Cross-cutting prerequisite

`X-Actor-Ref` is currently attribution supplied by the caller, not authenticated identity. Trusted identity, permissions, and approval enforcement must exist before migrated write operations are exposed for production use. This does not require a second database or business rules in OpenClaw prompts.

## Migration rules

1. Migrate one slice at a time into API schema, lifecycle commands, audit records, and narrow REST operations.
2. Keep the Next.js implementation operational until the equivalent API behavior and data migration are proven.
3. Do not copy the generic operational-record payload store into the API.
4. Do not copy Gemini extraction routes. OpenClaw supplies structured extraction results with provenance; the API validates and persists them.
5. Do not import `domain/v2` wholesale. Adopt its information-state and evidence concepts only where a concrete workflow needs them.
6. Migrate existing records explicitly; never make the old and new applications independent writers for the same entity.

## First implementation slice

Start with source documents and provenance. CIPL, shipment, customs-job, comparison, and approval records all require a stable reference to the originating message or attachment. Establishing that lineage first avoids introducing nullable source fields that later require a second migration.
