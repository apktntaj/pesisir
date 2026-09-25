# Feature Specification: Structured Extraction Provenance

**Feature Branch**: `001-extraction-provenance`
**Created**: 2026-09-25
**Status**: Draft
**Input**: Persist structured extraction results with fact-level provenance,
information state, confidence, evidence locators, and append-only human corrections
for source documents. OpenClaw provides interpretations; the on-premise API validates
and retains them.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preserve an agent extraction (Priority: P1)

After OpenClaw interprets an uploaded operational document, an operator needs the
structured facts retained with a reliable link to the original document, so later work
does not depend on chat memory or a repeat interpretation.

**Why this priority**: All later CIPL, shipment, reconciliation, and review work
needs durable, attributable extracted information.

**Independent Test**: Submit one extraction for a stored source document, then
retrieve it and confirm every submitted fact, its information state, confidence, and
evidence locator are preserved.

**Acceptance Scenarios**:

1. **Given** a stored source document, **When** OpenClaw records an extraction with
   material facts, **Then** each fact is linked to that document through its extraction
   and can be retrieved without exposing the document bytes.
2. **Given** a stored source document, **When** an extraction contains a value whose
   state is inferred, **Then** consumers can distinguish it from source-backed and
   human-confirmed facts.
3. **Given** no stored source document, **When** a caller attempts to record an
   extraction, **Then** the operation is rejected and creates no partial record.

---

### User Story 2 - Record unresolved or conflicting information (Priority: P2)

An operator needs incomplete and contradictory document information represented
explicitly, so the assistant asks for clarification instead of treating absent or
conflicting values as confirmed facts.

**Why this priority**: Silent guessing is unsafe in customs operations and makes
reconciliation misleading.

**Independent Test**: Record unknown, not-applicable, and conflicting facts for one
document and retrieve their states and conflict explanation.

**Acceptance Scenarios**:

1. **Given** a document omits a required commercial value, **When** OpenClaw records
   that field as unknown, **Then** no substitute value is stored as confirmed.
2. **Given** document evidence supports incompatible values for one field, **When**
   OpenClaw records the conflict, **Then** the conflict remains visible with its
   explanation and evidence.
3. **Given** a field is legitimately irrelevant to the document, **When** it is
   recorded as not applicable, **Then** it is distinguishable from unknown.

---

### User Story 3 - Preserve human review without rewriting extraction history (Priority: P3)

An authorized reviewer needs to confirm or correct a material extracted fact while
retaining the agent’s original proposal and evidence for audit and later review.

**Why this priority**: Human oversight is required, but overwriting the extraction
would destroy lineage and obscure what was changed.

**Independent Test**: Record an extraction fact, append a human confirmation or
correction, and verify that the original fact remains unchanged while the latest
reviewed result is identifiable.

**Acceptance Scenarios**:

1. **Given** an inferred commercial value, **When** an authorized reviewer confirms
   it, **Then** the confirmation is recorded with actor, time, and reason without
   altering the original extraction.
2. **Given** an extracted value is wrong, **When** an authorized reviewer corrects
   it, **Then** the correction cites the affected fact and preserves both values.
3. **Given** a correction references no extracted fact or has no reason, **When** it
   is submitted, **Then** the operation is rejected.

### Edge Cases

- A single source document may have more than one extraction attempt; each attempt
  remains distinct and retrievable.
- A fact with state `UNKNOWN` or `NOT_APPLICABLE` has no asserted value; a fact with
  state `CONFLICTING` preserves an explanation and the competing evidence.
- An evidence locator may identify a PDF page, spreadsheet sheet and cell/range, image
  region, or text location; the system accepts only a structured, non-empty locator.
- Retrying an accepted write returns its original result; reusing its idempotency key
  for a different request is rejected.
- A source document may not be removed or replaced by extraction and review actions.
- This feature does not decide which reviewer roles are authorized; identity and
  permission enforcement are a production prerequisite described by the constitution.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST permit a caller to create a distinct structured
  extraction only for an existing source document.
- **FR-002**: Each extraction MUST retain its origin, creation time, submitting actor,
  and a collection of material facts.
- **FR-003**: Each material fact MUST include a stable field identifier, an
  information state, and zero or more evidence locators.
- **FR-004**: The system MUST support the states `SOURCE_BACKED`, `CONFIRMED`,
  `INFERRED`, `UNKNOWN`, `CONFLICTING`, and `NOT_APPLICABLE`.
- **FR-005**: A fact in `SOURCE_BACKED`, `CONFIRMED`, or `INFERRED` state MUST have
  an asserted value. A fact in `UNKNOWN` or `NOT_APPLICABLE` state MUST NOT assert a
  value. A fact in `CONFLICTING` state MUST include an explanation.
- **FR-006**: The system MUST preserve optional confidence as the submitter’s numeric
  assessment and MUST NOT convert confidence into confirmation.
- **FR-007**: The system MUST allow append-only human confirmation or correction of
  an extracted fact, preserving the original fact, reviewer, time, reason, and
  evidence.
- **FR-008**: The system MUST expose extraction facts and their review history without
  returning original document bytes.
- **FR-009**: Extraction and review writes MUST be attributable, audited, and
  idempotent under the repository-wide mutation protocol.
- **FR-010**: Invalid source-document references, invalid fact-state combinations,
  empty field identifiers, empty evidence locators, and invalid review targets MUST
  be rejected without partial persistence.
- **FR-011**: The system MUST NOT perform OCR, classify documents, infer values, or
  make customs determinations in this feature.
- **FR-012**: The system MUST NOT make extraction facts a second source of truth for
  CIPL, shipment, customs-job, or other future operational records; those records
  will explicitly reference or adopt reviewed facts in later features.

### Key Entities *(include if feature involves data)*

- **Extraction**: One submitted structured interpretation of one stored source
  document, with submitting actor and creation time.
- **Extraction Fact**: A material field proposal in an extraction, including state,
  asserted value when applicable, optional confidence, and evidence locators.
- **Evidence Locator**: A structured pointer to the relevant location within the
  source document.
- **Fact Review**: An append-only human confirmation or correction of one extraction
  fact, including actor, time, reason, replacement value or state where applicable,
  and optional evidence.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can retrieve every submitted extraction fact and its
  evidence locators for a stored document after a new API session.
- **SC-002**: In an end-to-end scenario containing source-backed, inferred, unknown,
  conflicting, and not-applicable facts, consumers distinguish all five states without
  inspecting free-text notes.
- **SC-003**: In an end-to-end correction scenario, the original agent fact and its
  later human review are both retrievable and attributable.
- **SC-004**: Invalid fact-state combinations and invalid review targets leave no
  persisted extraction or review records.
- **SC-005**: A repeated mutation with the same idempotency key returns the original
  result, while a different payload with that key is rejected.

## Assumptions

- Source messages and source documents are already persisted by the existing
  on-premise API.
- OpenClaw or another trusted integration submits structured interpretations; this
  feature stores and validates them but does not interpret file bytes.
- JSON-compatible scalar, object, and array values are sufficient for the first
  extraction payload; domain-specific CIPL and shipment schemas are deferred.
- Fact-review authorization will integrate with future trusted identity and permission
  enforcement. Until then, attribution is retained but is not a production authorization
  boundary.
- Existing source-document size and content restrictions remain unchanged.
