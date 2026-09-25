# Pesisir Constitution

## Core Principles

### I. Canonical On-Premise System of Record

`apps/api/` MUST own persisted operational data, domain invariants, lifecycle
transitions, authorization enforcement, idempotency, and audit history. OpenClaw,
MCP, and every web workspace MUST use narrow API operations rather than maintain
independent writable copies of canonical entities. A migration MUST have one
authoritative writer at a time and MUST explicitly migrate existing records before
retiring a legacy writer.

### II. Evidence, Information State, and Lineage

The system MUST preserve source messages and original documents separately from
structured extraction results and human corrections. Every material operational fact
MUST be traceable to its source or confirmation and MUST distinguish source-backed,
human-confirmed, agent-inferred, unknown, conflicting, and not-applicable states.
Missing information MUST NOT be silently invented or represented as a confirmed fact.

### III. Deterministic Domain Protection

Business rules MUST live in schemas, database constraints, deterministic services, and
explicit lifecycle commands—not only in agent prompts or UI validation. Write
operations MUST validate referenced records, enforce domain invariants, produce an
audit event atomically with the mutation, and be safe to retry through idempotency
where practical.

### IV. Human Authority for High-Impact Decisions

The assistant MAY read, extract, reconcile, summarize, prepare drafts, and update
authorized low-risk workflow data. Final HS classification, customs or legal
determinations, declaration submission, amendment or cancellation, payment,
guarantee, and sensitive external communication MUST require an authorized human
approval unless an explicit approved policy defines otherwise. Production agent write
operations MUST NOT rely on caller-supplied attribution as identity.

### V. Conversational Interface, Structured Operations

WhatsApp through OpenClaw is the primary operational interface; the web workspace
supports overview, review, correction, approval, and detailed editing. OpenClaw MUST
interpret messages and documents, resolve operational context, ask focused questions
for missing or conflicting data, and invoke confirmed structured operations. The API
MUST accept validated structured results with provenance; it MUST NOT regain an
embedded cloud document-understanding dependency.

### VI. Slice-by-Slice, Contract-First Evolution

Each material capability MUST begin with a feature specification that states user
outcomes, scope boundaries, entities, invariants, authority, failure behavior, and
acceptance scenarios before implementation planning. Plans MUST identify schema,
API, MCP, workspace, migration, and verification impacts. Implementations MUST reuse
the established domain model and delete superseded paths after a proven cutover; they
MUST NOT add compatibility aliases or duplicate models without a documented need.

## Operational Constraints

- All operational data, documents, business rules, audit history, and agent-accessible
  services MUST remain deployable on infrastructure controlled by the customer.
- The system MUST fail safely when an authoritative source, required information,
  permission, or approval is absent.
- Persistent records that require historical traceability MUST use explicit lifecycle
  or archival behavior rather than destructive deletion.
- APIs exposed to agents MUST be permission-aware, narrowly scoped, and idempotent
  where retry can occur.
- `apps/project-management/` is a domain and workflow reference while its runtime
  persistence remains non-canonical. Its embedded Gemini extraction paths MUST NOT be
  reproduced in the target architecture.

## Delivery Workflow

1. Create or amend the feature specification under `specs/` before planning a
   material domain, API, lifecycle, or persistence change.
2. Check the plan against this constitution before design and again before
   implementation. A conflict requires either a constitution amendment or an explicit,
   documented exception.
3. Implement complete vertical slices: migration/schema, deterministic API behavior,
   API contract, agent/MCP boundary where needed, and affected workspace callers.
4. Verify observable behavior with an end-to-end scenario or narrow integration test.
   Tests MUST protect consumer-visible contracts, boundaries, invariants,
   authorization, and lifecycle transitions—not implementation plumbing.
5. Update API contracts, migration guidance, and feature artifacts when the delivered
   behavior changes. Remove temporary scaffolding and obsolete paths after verification.

## Governance

This constitution supersedes repository-local development preferences where they
conflict. `PROJECT_INTENT.md` remains the product north star; `AGENTS.md` provides
runtime delivery rules; feature specifications and plans MUST conform to both.

Any amendment MUST state the reason, affected principles, compatibility or migration
impact, and semantic version change. Additive principles or material expansions
increase the minor version; clarifications increase the patch version; removed or
meaningfully weakened protections increase the major version. Every material plan and
review MUST record constitution compliance or justify an approved exception.

**Version**: 1.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-09-25
