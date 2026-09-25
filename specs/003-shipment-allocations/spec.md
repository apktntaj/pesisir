# Feature Specification: Shipment Allocations

**Feature Branch**: `003-shipment-allocations`
**Created**: 2026-09-25
**Status**: Draft

## User Scenarios & Testing

### User Story 1 - Create a shipment from a ready CIPL version (Priority: P1)

An operator creates one import or export shipment against exactly one ready CIPL version, retaining transport data and source-document lineage.

**Independent Test**: Create a shipment from a ready CIPL version and retrieve its source version, transport fields, and allocations without source bytes.

**Acceptance Scenarios**:

1. **Given** a ready CIPL version, **When** a shipment with valid allocations is created, **Then** the shipment references that version and preserves each allocation.
2. **Given** a draft CIPL version, **When** a shipment is created against it, **Then** the operation is rejected.
3. **Given** a nonexistent CIPL version or source document, **When** a shipment is created, **Then** no partial shipment persists.

### User Story 2 - Protect CIPL item quantities (Priority: P1)

An operator needs allocations to use only source-version items and units, without allocating more than each source item’s remaining quantity across all shipments.

**Independent Test**: Allocate an item across two shipments up to its quantity, then verify a third over-allocation is rejected.

**Acceptance Scenarios**:

1. **Given** a source CIPL item with quantity 10 PCS and 6 PCS already allocated, **When** another shipment allocates 4 PCS, **Then** it succeeds.
2. **Given** the same state, **When** another shipment allocates 5 PCS or uses another unit, **Then** it is rejected.
3. **Given** an item from another CIPL version, **When** it is allocated, **Then** it is rejected.

### User Story 3 - Preserve transport document lineage (Priority: P2)

A supervisor needs each shipment to retain its BL/AWB reference and source document separately from CIPL data.

**Acceptance Scenarios**:

1. **Given** a source BL/AWB document, **When** shipment data is recorded, **Then** the returned shipment exposes document metadata but never document bytes.

## Requirements

- **FR-001**: A shipment MUST reference exactly one CIPL version with status `READY`.
- **FR-002**: A shipment MUST retain document type (`BL` or `AWB`), document number, direction, optional transport fields, source-document identity, status, and timestamps.
- **FR-003**: Each allocation MUST reference an item belonging to the shipment’s source CIPL version, use its exact unit, and have a positive quantity.
- **FR-004**: The cumulative quantity allocated for each CIPL item across shipments MUST NOT exceed the source item quantity.
- **FR-005**: Allocation validation and shipment persistence MUST occur atomically and remain safe under concurrent requests.
- **FR-006**: Shipment writes MUST be attributable, audited, and idempotent.
- **FR-007**: Shipment responses MUST exclude original source-document bytes.
- **FR-008**: This feature MUST NOT create customs jobs, declarations, payments, or final customs decisions.

## Success Criteria

- **SC-001**: A valid shipment and its allocations remain retrievable after a new API session.
- **SC-002**: Cross-version items, unit mismatches, non-positive values, and over-allocation are rejected with no partial shipment.
- **SC-003**: Concurrent requests cannot commit allocations whose aggregate exceeds the CIPL item quantity.

## Assumptions

- CIPL versions/items are canonical records from feature 002.
- Existing source documents provide BL/AWB lineage.
- Shipment lifecycle commands are deferred; creation starts at `DOCUMENT_RECEIVED`.
