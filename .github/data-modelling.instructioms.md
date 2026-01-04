# Domain Modeling Prompt — Logistics / Shipping System

## Goal
Redesign the logistics domain model so it is **not shipment-oriented**, but **ontology-driven**.
The model must reflect **entities that exist prior to runtime**, not convenience structures.

This is a **thinking model**, not a CRUD-first design.

---

## Core Principle

> Model entities whose **existence precedes computation**.  
> Do NOT let runtime flow dictate domain structure.

If an idea exists *before* the program runs, it must exist as a **data definition**, not as a conditional or flag.

---

## Ontological Ordering (Must Be Respected)

1. **Shipper**
2. **Consignee**
3. **Carrier**
4. **Bill of Lading (BL)**
5. **Shipment**

Rules:
- Shipment **does not create** shipper/consignee/BL
- Shipment **emerges from** their relationship
- Shipment cannot exist unless:
  - shipper exists
  - consignee exists
  - BL exists

Shipment is a **consequence**, not a root entity.

---

## Entity Design Rules

### 1. Shipper & Consignee
- Separate entities, even if structurally similar
- Similar shape ≠ same ontology
- Do not merge into a generic `Party`

Reason:
- They play **distinct roles**
- Roles exist before runtime
- Role confusion causes semantic bugs

---

### 2. Bill of Lading (BL)
BL is **not a document blob**, but a domain object.

BL represents:
- A formal claim of carriage
- An agreement reference
- A precursor to shipment

BL states are **explicit and finite**:
- Draft
- Issued
- Void
- Superseded
- Disputed

BL validity is:
- Structurally enforceable (program)
- Legally enforceable (human)

The program models **claims**, not legal truth.

---

### 3. Shipment
Shipment is:
- A relation between shipper, consignee, carrier, and BL
- Always complete at creation
- Never partially defined

Shipment states must be:
- Enumerated
- Exhaustive
- Invariant-checked

No flags like:
- `is_fcl`
- `is_lcl`
- `shipment_type = string`

Use **closed enums / sum types** instead.

---

## Data Definition Discipline

- Prefer **constructors over validators**
- Prefer **types over flags**
- Prefer **illegal states unrepresentable**

Validation happens:
- At boundaries (input, parsing)
- Once

Business logic assumes:
- Data is already meaningful

---

## What the Program MUST Model

- Entity existence
- Role separation
- State machines
- Invariants
- Explicit transitions

---

## What the Program MUST NOT Decide

- Legal truth
- Disputes
- Fraud
- Intent
- Human judgment

Instead, model:
- Status markers
- Escalation points
- Manual review states

---

## Anti-Patterns to Avoid

- Shipment as root aggregate
- Boolean flags for domain meaning
- Runtime conditionals that imply missing types
- “We’ll validate later”
- Generic `Party` or `Actor` types
- Stringly-typed states

---

## Output Expectation

When redesigning:
- Start from ontology, not UI
- Define entities before workflows
- Justify each entity’s existence **before runtime**
- Reject convenience abstractions

---

## Final Check Question

For every entity or field, ask:

> “Does this concept exist before the program runs?”

If yes → **type / entity**  
If no → **function / behavior**