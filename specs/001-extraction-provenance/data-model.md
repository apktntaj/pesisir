# Data Model: Structured Extraction Provenance

## Source Document

Existing immutable record. One source document has zero or more **Extractions**. Deleting or replacing document bytes is outside this feature.

## Extraction

| Field | Rules |
|---|---|
| `id` | Stable UUID. |
| `sourceDocumentId` | Required reference to an existing source document; deletion restricted. |
| `submittedByActorRef` | Required stable attribution of the extraction submitter. |
| `createdAt` | Immutable creation time. |

An extraction is immutable after creation. A source document can have several extractions.

## Extraction Fact

| Field | Rules |
|---|---|
| `id` | Stable UUID. |
| `extractionId` | Required parent extraction. |
| `field` | Required non-empty, stable field identifier; unique within an extraction. |
| `informationState` | One of `SOURCE_BACKED`, `CONFIRMED`, `INFERRED`, `UNKNOWN`, `CONFLICTING`, `NOT_APPLICABLE`. |
| `assertedValue` | Structured value; required for source-backed, confirmed, and inferred states; absent for unknown and not-applicable states. |
| `confidencePercent` | Optional integer from 0 through 100; submitter assessment only. |
| `conflictExplanation` | Required non-empty text only for conflicting state. |
| `evidenceLocators` | Structured array of zero or more non-empty evidence locators. |
| `createdAt` | Immutable creation time. |

`CONFLICTING` facts retain their competing values and/or references in `evidenceLocators`; they do not declare one authoritative asserted value. `confidencePercent` never upgrades an inferred fact to confirmed.

## Evidence Locator

A structured pointer inside the parent source document:

| Field | Rules |
|---|---|
| `kind` | `PDF_PAGE`, `SPREADSHEET_RANGE`, `IMAGE_REGION`, or `TEXT_SPAN`. |
| `reference` | Non-empty structured location appropriate to the kind. |
| `excerpt` | Optional non-empty quoted or normalized source excerpt. |

A locator is embedded in a fact or review for this slice. It is not a separate operational entity.

## Fact Review

| Field | Rules |
|---|---|
| `id` | Stable UUID. |
| `extractionFactId` | Required referenced fact. |
| `kind` | `CONFIRM` or `CORRECT`. |
| `resultingState` | Required information state after review. |
| `resultingValue` | Follows the same state/value rules as an extraction fact. |
| `conflictExplanation` | Required non-empty text only when `resultingState` is `CONFLICTING`. |
| `reason` | Required non-empty explanation. |
| `evidenceLocators` | Structured array of zero or more locators. |
| `reviewedByActorRef` | Required stable reviewer attribution. |
| `createdAt` | Immutable creation time. |

Reviews are append-only. The latest review is a derived presentation concern; the API retains chronological history. A review cannot be created without its target extraction fact.

## Relationships and Invariants

```text
SourceDocument 1 ──< Extraction 1 ──< ExtractionFact 1 ──< FactReview
```

- No partial extraction: its parent and all facts are committed in one transaction.
- No partial review: validation failure leaves no review record.
- Source document bytes are excluded from all extraction and review responses.
- All writes add an audit event and support idempotent replay.
- This model records proposals and reviews only; it creates no CIPL, shipment, customs job, or canonical business fact.
