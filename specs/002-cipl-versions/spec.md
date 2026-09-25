# Feature Specification: Immutable CIPL Versions

**Feature Branch**: `002-cipl-versions`
**Created**: 2026-09-25
**Status**: Draft
**Input**: Migrate CIPL and immutable numbered versions into the canonical on-premise API. A CIPL version has one or more positive-quantity items with required units; only a valid version may become READY; the active version is explicit and prior versions remain readable.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register a CIPL and its source-backed version (Priority: P1)

An operator needs to record a CIPL for one event exhibitor and preserve the exact item list received in a source document, so later shipment allocation has a stable commercial source.

**Why this priority**: CIPL is the source for item quantities and is required before shipment and customs-job migration.

**Independent Test**: Create a CIPL with a source document and a first numbered version containing multiple items, then retrieve it with the same version and items.

**Acceptance Scenarios**:

1. **Given** an active event participation and stored source document, **When** an operator creates a CIPL with items, **Then** the CIPL receives version number 1 and each item retains line number, description, positive quantity, and unit.
2. **Given** a CIPL with an existing version, **When** an operator creates a revision, **Then** the revision receives the next number and the previous version remains readable unchanged.
3. **Given** a missing event participation or source document, **When** an operator creates a CIPL version, **Then** the operation is rejected with no partial CIPL or version.

---

### User Story 2 - Mark only complete versions ready (Priority: P2)

An operator needs to make one reviewed CIPL version active only when it has complete operational items, so shipment allocation never starts from an incomplete version.

**Why this priority**: A ready CIPL is a cross-domain guard for shipment and customs-job operations.

**Independent Test**: Attempt to ready invalid versions and a valid version, then verify only the valid version becomes active.

**Acceptance Scenarios**:

1. **Given** a version with at least one item, non-empty descriptions and units, and positive quantities, **When** it is marked ready, **Then** the version status becomes `READY` and it becomes the CIPL's active version.
2. **Given** a version with no items, missing unit, missing description, or non-positive quantity, **When** it is marked ready, **Then** the operation is rejected and no active version changes.
3. **Given** an already active ready version and a later valid revision, **When** the revision is marked ready, **Then** the revision becomes active and the earlier version remains ready and readable.

---

### User Story 3 - Preserve document and review lineage (Priority: P3)

A supervisor needs each CIPL version to retain its received time, submitter, source-document reference, and revision note, so changes can be reviewed without relying on chat history.

**Why this priority**: Customs operations need attributable historical versions, not a mutable current item list.

**Independent Test**: Retrieve a CIPL containing two versions and verify each version keeps independent lineage and item data.

**Acceptance Scenarios**:

1. **Given** two versions sourced from different documents, **When** the CIPL is retrieved, **Then** each version exposes its own source-document identity and received metadata without document bytes.
2. **Given** a created version, **When** a caller attempts to edit its item values or source document, **Then** no mutable update operation exists; a revision must be created instead.

### Edge Cases

- A CIPL may have zero versions immediately after creation, but cannot have an active version until a valid version is ready.
- `referenceNumber`, revision note, valuation, currency, weights, country of origin, identifiers, intended use, and intended disposal are optional; readiness depends only on item presence, description, positive quantity, and unit.
- CIPL versions are numbered sequentially per CIPL even when earlier versions are not ready.
- More than one historical version can be `READY`; only one `activeVersionId` is current.
- A cancelled or withdrawn event participation cannot receive a new CIPL.
- Source-document bytes never appear in CIPL responses.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST create a CIPL only for an active event participation.
- **FR-002**: A CIPL MUST retain its event participation, optional reference number, explicit active-version identity, status, creation time, and update time.
- **FR-003**: The system MUST create an immutable numbered version for an existing CIPL or atomically with a new CIPL.
- **FR-004**: Every version MUST retain its CIPL identity, version number, received time, submitting actor, source-document identity, optional revision note, status, and immutable items.
- **FR-005**: Each CIPL version item MUST retain a positive line number, non-empty description, positive quantity, and non-empty unit.
- **FR-006**: Optional item details MAY include unit value, currency, gross/net weight, country of origin, identifiers, intended use, and intended disposal.
- **FR-007**: The system MUST reject duplicate version numbers and duplicate item line numbers within their parent records.
- **FR-008**: A version may become `READY` only when it has at least one valid item. Marking a valid version ready MUST set it as its CIPL's active version atomically.
- **FR-009**: The system MUST retain prior versions and their items unchanged when a revision is created or activated.
- **FR-010**: CIPL creation, version creation, and ready commands MUST be attributable, audited, and idempotent.
- **FR-011**: CIPL responses MUST expose source-document metadata only and MUST NOT expose source-document bytes.
- **FR-012**: This feature MUST NOT allocate CIPL items to shipments, create customs jobs, or make a customs determination.

### Key Entities

- **CIPL**: The canonical commercial-invoice and packing-list aggregate for one event participation, with one optional active version.
- **CIPL Version**: An immutable, sequentially numbered source-backed revision of a CIPL.
- **CIPL Item**: An immutable line item owned by exactly one CIPL version.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A CIPL with two revisions retrieves both numbered versions and their original item details after a new API session.
- **SC-002**: A ready command accepts a valid version and rejects each invalid readiness condition without changing the CIPL's active version.
- **SC-003**: Creating a revision never alters the item count, item values, source-document reference, or received metadata of earlier versions.
- **SC-004**: Retried identical creation and ready commands return their original result; a reused idempotency key with different input is rejected.
- **SC-005**: No CIPL response exposes original document bytes.

## Assumptions

- Event participation and source-document APIs already provide canonical parent records.
- The first API slice uses source documents as version lineage; document extraction facts may be adopted by a later CIPL review workflow.
- Existing trusted identity/RBAC work remains a production prerequisite; this slice retains attribution under the current mutation protocol.
