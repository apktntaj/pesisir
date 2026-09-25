# Implementation Plan: Shipment Allocations

**Branch**: `003-shipment-allocations` | **Date**: 2026-09-25 | **Spec**:
[spec.md](spec.md)

## Summary

Add canonical shipments and allocation records. The API validates one ready CIPL version,
source-document lineage, item membership/unit/quantity, and aggregate allocation limits
inside the write transaction.

## Constitution Check

| Gate | Status | Evidence |
|---|---|---|
| Canonical API ownership | Pass | Shipments and allocations are PostgreSQL records owned by `apps/api`. |
| Evidence and lineage | Pass | Shipment and CIPL version each retain their source documents separately. |
| Deterministic protection | Pass | Item/version/unit and cumulative quantity are validated transactionally. |
| Human authority | Pass | No declaration, payment, or customs decision is included. |

## Implementation Design

1. Add `shipments` and `shipment_allocations` migration/schema tables.
2. Lock the source CIPL item rows while calculating allocated totals, preventing
   concurrent requests from exceeding source quantity.
3. Add strict Zod schemas for transport metadata and allocations.
4. Add create/get shipment API routes using `auditedMutation`.
5. Update OpenAPI/docs and tests for valid allocation, over-allocation, wrong version,
   wrong unit, missing source document, idempotency, and concurrent writes.

## Verification Plan

Apply migration, run typecheck and API tests, then create two shipments that consume a
CIPL item exactly and demonstrate rejection of a third over-allocation.
