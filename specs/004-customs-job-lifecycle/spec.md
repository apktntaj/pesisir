# Feature Specification: Customs Job Lifecycle

A customs job is an auditable operational case for exactly one shipment. It retains its BC document type, job allocations, lifecycle history, and evidence.

## Requirements

- A job MUST reference one existing shipment and may allocate only its items, units, and remaining quantities.
- New jobs start `DRAFT`.
- Normal transitions are `DRAFT → PREPARING → SUBMITTED → REGISTERED → RELEASED → COMPLETED`.
- `ON_HOLD` and `CANCELLED` require a non-empty reason. Resume, reopening, or backward transitions require both reason and source-document evidence.
- Every transition is append-only, attributable, audited, and idempotent.
- `SUBMITTED`, registration, release, completion, payment, and customs determinations remain authorized-human operations; this API records validated commands but does not autonomously make them.
- A job allocation MUST have positive quantity, exact shipment unit, and cumulative quantity no greater than its shipment allocation.
- This slice excludes billing, payment, declaration transmission, and approval policy implementation.

## Acceptance Scenarios

1. A job created from a shipment starts `DRAFT` with valid allocations.
2. A job allocation using another shipment item, wrong unit, or excess quantity is rejected atomically.
3. The normal lifecycle accepts only the next state.
4. A hold/cancel without reason and a backward transition without evidence are rejected.
5. Every accepted transition remains retrievable in chronological history.
