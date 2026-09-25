# Research: Structured Extraction Provenance

## Decisions

### Store extractions separately from source documents

**Decision**: A source document can have zero or more immutable extraction submissions.

**Rationale**: Reinterpretation may improve over time or surface different document facts. Replacing the original interpretation would destroy auditability.

**Alternatives considered**:
- One mutable extraction per document: rejected because it loses prior agent output.
- Add extracted fields to `source_documents`: rejected because document identity and interpreted facts have distinct lifecycles.

### Represent fact values as structured JSON

**Decision**: Retain each asserted value as JSON while requiring a stable string field identifier.

**Rationale**: The first provenance slice must support values from invoices, packing lists, and transport documents without prematurely creating a generic operational-record schema or locking CIPL/shipment fields into the wrong domain.

**Alternatives considered**:
- One text value column: rejected because monetary values, quantities, parties, and line-item structures lose type and shape.
- Domain-specific CIPL tables now: rejected because CIPL is the next migration slice and needs its own invariants.

### Enforce information-state combinations at the API and database boundary

**Decision**: Validate state/value/conflict combinations in request schemas and repeat essential nullability checks in database constraints.

**Rationale**: Prompts and UI validation cannot prevent invalid agent writes. The database remains the last deterministic guard.

**Alternatives considered**:
- Validation only in OpenClaw: rejected because retries and other clients bypass prompts.
- Free-text state notes: rejected because consumers cannot deterministically distinguish unknown, conflict, and confirmation.

### Make reviews append-only

**Decision**: Confirmation and correction create a new review record linked to an extraction fact; neither mutates the original fact.

**Rationale**: Human oversight must preserve what the agent proposed, why a reviewer changed it, and the evidence used.

**Alternatives considered**:
- Update the fact in place: rejected because audit records alone do not provide a usable factual lineage.
- Store only latest reviewed value: rejected because it hides the original extraction.

### Reuse existing audited mutation protocol

**Decision**: New write endpoints use `auditedMutation` and the current actor, source-message, and idempotency headers.

**Rationale**: This preserves atomic mutation, audit, retry replay, and idempotency-key conflict behavior already used by source lineage routes.

**Alternatives considered**:
- A feature-specific audit system: rejected because it duplicates a stable cross-cutting protocol.

### Defer MCP and workspace changes

**Decision**: This slice publishes REST/OpenAPI contracts only; it does not add MCP tools or a workspace review screen.

**Rationale**: The existing MCP server exposes only event domain operations and does not yet own source-document upload. Adding partial conversational writes before the API contract and identity boundary would create a second incomplete workflow.

**Alternatives considered**:
- Add generic MCP extraction tools now: rejected because the tool input and caller identity policy are not yet production-ready.
- Add a workspace screen now: rejected because `apps/project-management` remains a runtime-store reference and has no canonical extraction client.
