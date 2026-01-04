# Ontology-Driven Domain Modeling

## Goal

Redesign the domain model so it is **ontology-driven**, not workflow-driven and not CRUD-first.

The model must reflect entities and concepts that exist prior to computation, not convenience structures created to serve runtime flow, UI, or persistence.

**This is a thinking model, not an implementation sketch.**

---

## Core Principle

> **Model concepts whose existence precedes the program.**
> 
> Do NOT let runtime behavior, UI flow, or storage concerns dictate domain structure.

If an idea exists before the program runs, it must exist as a **data definition**, not as:
- a boolean flag
- a string label
- a conditional branch
- a runtime convention

---

## Ontological Ordering

Before designing workflows, identify the **ontological order** of concepts:

- Which entities exist independently?
- Which entities emerge from relationships?
- Which concepts are consequences, not causes?

### Rules

1. **Root entities** do not depend on runtime
2. **Derived entities** cannot exist without their prerequisites
3. **Relationships create consequences, not identities**

Respect this ordering in the model.

### Example: Medical Domain

```
✅ Ontological Order:
Person (exists independently)
  ↓
Patient (Person in relationship to healthcare system)
  ↓
MedicalRecord (consequence of Patient existing in system)
  ↓
Prescription (consequence of clinical decision about Patient)
  ↓
Dispense (consequence of Prescription being filled)

❌ Wrong Order:
MedicalRecord (root entity)
  → Patient (derived from record existing)
```

**Why it matters:** If you model `Patient` as dependent on `MedicalRecord`, you can't represent a Person who should be a Patient but hasn't been registered yet.

---

## Entity Design Rules

### 1. Role Separation

**Separate entities that play different roles, even if structurally similar.**

- Structural similarity ≠ ontological identity
- Avoid collapsing roles into generic abstractions (`Actor`, `Party`, `BaseEntity`)

**Reason:**
- Roles exist before runtime
- Role confusion produces semantic bugs
- Shared shape should use composition, not inheritance

#### Example: Financial Domain

```
❌ Workflow-Driven:
class Party {
  id: string
  name: string
  type: "individual" | "institution" | "government"
}

class Transaction {
  from: Party
  to: Party
}

✅ Ontology-Driven:
class Individual { /* natural person */ }
class Institution { /* legal entity */ }
class GovernmentAgency { /* sovereign entity */ }

class Payment {
  payer: Individual | Institution
  payee: Individual | Institution | GovernmentAgency
}

class TaxRemittance {
  taxpayer: Individual | Institution
  authority: GovernmentAgency
}
```

**Why separate:** Tax authorities have different rules, responsibilities, and lifecycle than regular payees. A generic `Party` obscures this.

---

### 2. Domain Objects vs Artifacts

Distinguish between:
- **Domain objects** (concepts with meaning)
- **Artifacts** (representations, documents, records)

#### Domain Object Characteristics

A domain object:
- Has explicit states
- Has invariants
- Exists conceptually outside the program

**The program models claims and states, not ultimate truth.**

#### Example: Legal Domain

```
❌ Conflated:
class Contract {
  id: string
  parties: Party[]
  terms: string
  signed: boolean
}

✅ Separated:
// Domain object - the agreement itself
class Agreement {
  parties: ContractingParty[]
  obligations: Obligation[]
  effectiveDate: Date
  terminationConditions: Condition[]
}

// Artifact - evidence of the agreement
class ContractDocument {
  agreementId: AgreementId
  version: number
  format: DocumentFormat
  content: Binary
  signatures: Signature[]
}

// State - system's understanding
type AgreementStatus =
  | { type: "draft" }
  | { type: "pending_signature", awaitingFrom: PartyId[] }
  | { type: "executed", executionDate: Date }
  | { type: "disputed", disputeId: DisputeId }
  | { type: "terminated", terminationDate: Date, reason: string }
```

**Why separate:** The agreement exists even if the document is lost. The document is evidence, not the agreement itself.

---

### 3. State Modeling

States must be:
- **Explicit**
- **Finite**
- **Exhaustive**

Use:
- Closed enums
- Sum types / tagged unions
- State machines

Avoid:
- Boolean flags for meaning
- Stringly-typed states
- Ad-hoc conditionals

**If behavior changes based on a condition, that condition probably deserves a type.**

#### Example: E-Commerce Domain

```
❌ Boolean Soup:
class Order {
  isPaid: boolean
  isShipped: boolean
  isCancelled: boolean
  isRefunded: boolean
  // What does isPaid=true + isCancelled=true mean?
  // Can isRefunded=true when isPaid=false?
}

✅ Explicit States:
type OrderState =
  | { type: "placed", at: Timestamp }
  | { type: "payment_pending", paymentId: PaymentId }
  | { type: "paid", paymentConfirmedAt: Timestamp }
  | { type: "preparing", estimatedShipDate: Date }
  | { type: "shipped", trackingNumber: string, carrier: Carrier }
  | { type: "delivered", signedBy: string, at: Timestamp }
  | { type: "cancelled", reason: CancellationReason, refundStatus: RefundState }

type RefundState =
  | { type: "not_applicable" }
  | { type: "pending", initiatedAt: Timestamp }
  | { type: "processed", amount: Money, at: Timestamp }
  | { type: "failed", reason: string }

class Order {
  state: OrderState
  // Illegal states are now unrepresentable
}
```

**Why explicit:** With booleans, you have 2^4 = 16 possible combinations, but only ~8 are valid. With sum types, only valid states exist.

---

## Data Definition Discipline

### Prefer Construction Over Validation

```
❌ Validate Everywhere:
class Email {
  value: string
  
  isValid(): boolean {
    return /\S+@\S+\.\S+/.test(this.value)
  }
}

function sendEmail(email: Email) {
  if (!email.isValid()) throw new Error("Invalid email")
  // send
}

✅ Validate Once:
class Email {
  private constructor(private value: string) {}
  
  static parse(raw: string): Email | ParseError {
    if (!/\S+@\S+\.\S+/.test(raw)) {
      return new ParseError("Invalid email format")
    }
    return new Email(raw)
  }
  
  toString(): string {
    return this.value
  }
}

function sendEmail(email: Email) {
  // Email is guaranteed valid by construction
  // send
}
```

### Validation Boundaries

Validation happens:
- **At system boundaries** (input, parsing, IO)
- **Once**

Inside the domain:
- Data is assumed meaningful
- Functions do not re-validate invariants

---

## What the Program MUST Model

| Concept | Representation |
|---------|----------------|
| Existence of concepts | Types, entities, value objects |
| Role distinctions | Separate types per role |
| Explicit states | Sum types, enums |
| Invariants | Constructor constraints |
| Allowed transitions | State machine rules |
| Consequences of relationships | Derived entities |

---

## What the Program MUST NOT Decide

The program **does not determine reality**. It models **claims, observations, and decisions made by humans**.

| ❌ Don't Model As Truth | ✅ Model As Claims/States |
|------------------------|---------------------------|
| "User is verified" | `VerificationClaim` with evidence and confidence |
| "Document is authentic" | `AuthenticityAssessment` by authority |
| "Payment succeeded" | `PaymentConfirmation` from payment processor |
| "Approval granted" | `ApprovalDecision` by authorized person |
| "Diagnosis is correct" | `ClinicalDiagnosis` by licensed practitioner |

### Example: Healthcare Domain

```
❌ Program Decides Truth:
class Patient {
  hasAllergies: boolean
  allergies: string[]
}

✅ Program Models Claims:
class AllergyReport {
  patient: PatientId
  reportedBy: PersonId  // patient, family, or clinician
  reportedAt: Timestamp
  allergen: Allergen
  reaction: Reaction
  severity: Severity
  verificationStatus: 
    | { type: "patient_reported" }
    | { type: "clinically_observed", observedBy: ClinicianId }
    | { type: "test_confirmed", testId: TestId }
    | { type: "disputed", reason: string }
}
```

**Why:** Medical records document claims and observations, not absolute truth. A patient might be allergic but unreported, or reported but not actually allergic.

---

## Anti-Patterns to Avoid

### 1. Workflow-First Modeling

```
❌ Built Around Process:
class Application {
  step: "submitted" | "reviewing" | "approved" | "rejected"
  currentReviewer: UserId
}

✅ Built Around Concepts:
// The application itself
class Application {
  applicant: ApplicantId
  submittedAt: Timestamp
  documents: Document[]
}

// The review process (separate concern)
class ReviewProcess {
  application: ApplicationId
  assignments: ReviewerAssignment[]
  decisions: ReviewDecision[]
}

type ReviewDecision =
  | { type: "approved", by: ReviewerId, at: Timestamp, conditions: string[] }
  | { type: "rejected", by: ReviewerId, at: Timestamp, reasons: string[] }
  | { type: "deferred", by: ReviewerId, at: Timestamp, awaitingInfo: string }
```

### 2. Boolean Flags Encoding Meaning

```
❌ Flags:
class Document {
  isPublic: boolean
  isDraft: boolean
  isArchived: boolean
}

✅ States:
type DocumentStatus =
  | { type: "draft", author: UserId }
  | { type: "review", reviewers: UserId[] }
  | { type: "published", publishedAt: Timestamp, visibility: Visibility }
  | { type: "archived", archivedAt: Timestamp, reason: string }

type Visibility = 
  | { type: "public" }
  | { type: "restricted", allowedGroups: GroupId[] }
  | { type: "private", allowedUsers: UserId[] }
```

### 3. Generic Base Entities

```
❌ Generic:
class BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  status: string
}

class User extends BaseEntity { }
class Product extends BaseEntity { }
class Order extends BaseEntity { }

✅ Explicit:
// Composition over inheritance
interface Identifiable { id: string }
interface Timestamped { occurredAt: Timestamp }
interface Authored { author: PersonId }

// Domain entities with relevant traits
class User implements Identifiable {
  id: UserId
  registeredAt: Timestamp
  profile: UserProfile
}

class Product implements Identifiable {
  id: ProductId
  introducedAt: Timestamp
  specifications: ProductSpec
}

class Order implements Identifiable, Timestamped, Authored {
  id: OrderId
  occurredAt: Timestamp
  author: CustomerId
  items: OrderLine[]
}
```

### 4. Stringly-Typed Domain States

```
❌ Strings:
class Shipment {
  status: string  // "pending" | "in_transit" | "delivered" | "lost" ?
  
  canCancel(): boolean {
    return this.status === "pending" || this.status === "in_transit"
  }
}

✅ Types:
type ShipmentState =
  | { type: "pending_pickup", scheduledDate: Date }
  | { type: "in_transit", currentLocation: Location, estimatedArrival: Date }
  | { type: "out_for_delivery", driver: DriverId }
  | { type: "delivered", signature: string, at: Timestamp }
  | { type: "delivery_failed", attemptCount: number, nextAttempt: Date }
  | { type: "lost", reportedAt: Timestamp, investigationId: string }
  | { type: "returned_to_sender", reason: string }

class Shipment {
  state: ShipmentState
  
  canCancel(): boolean {
    return this.state.type === "pending_pickup" || 
           this.state.type === "in_transit"
  }
}
```

---

## Modeling Process

### Step 1: Identify Concepts That Exist Before The Program

Ask domain experts:
- "What things exist in your world?"
- "What are the fundamental entities?"
- "What can exist independently?"

**Output:** List of nouns that represent real-world concepts.

**Example (Library Domain):**
- Book (the intellectual work)
- Copy (physical instance of book)
- Person (library member or staff)
- Loan (relationship between person and copy)

### Step 2: Define Them As Data

For each concept:
- What are its essential properties?
- What are its invariants?
- What are its possible states?

**Output:** Type definitions with constraints.

```typescript
class Book {
  isbn: ISBN
  title: Title
  authors: Author[]
  publicationYear: Year
}

class Copy {
  book: BookId
  copyNumber: PositiveInteger
  condition: CopyCondition
  location: ShelfLocation
}

type CopyCondition =
  | { type: "excellent" }
  | { type: "good" }
  | { type: "fair", damage: string }
  | { type: "poor", damage: string }
  | { type: "damaged_beyond_repair" }
```

### Step 3: Identify Relationships That Produce Consequences

Ask:
- "What happens when X and Y interact?"
- "What new entities emerge from relationships?"
- "What obligations or rights are created?"

**Output:** Derived entities and their lifecycle rules.

```typescript
class Loan {
  copy: CopyId
  borrower: MemberId
  checkedOutAt: Timestamp
  dueDate: Date
  
  // Invariant: dueDate must be after checkedOutAt
  // Consequence: Overdue fines may be generated
}

class OverdueFine {
  loan: LoanId
  amountPerDay: Money
  accruedSince: Date
  
  currentAmount(): Money {
    const daysOverdue = daysSince(this.accruedSince)
    return this.amountPerDay.multiply(daysOverdue)
  }
}
```

### Step 4: Define Derived Entities

Derived entities:
- Cannot exist without prerequisites
- Are consequences of other entities/relationships
- Often represent system computations or assessments

```typescript
class MemberStanding {
  member: MemberId
  overdueLoans: LoanId[]
  outstandingFines: Money
  status: MemberStatus
}

type MemberStatus =
  | { type: "good_standing" }
  | { type: "restricted", reason: RestrictionReason }
  | { type: "suspended", until: Date, reason: string }
  | { type: "banned", permanently: true }

type RestrictionReason =
  | { type: "overdue_items", count: number }
  | { type: "unpaid_fines", amount: Money }
  | { type: "damaged_items", severity: string }
```

### Step 5: Only Then Design Workflows

Now that domain model is clear, design workflows as:
- **State transitions** with preconditions
- **Commands** that trigger transitions
- **Events** that record what happened

```typescript
// Command
interface CheckOutBook {
  copyId: CopyId
  memberId: MemberId
  dueDate: Date
}

// Preconditions
function canCheckOut(copy: Copy, member: Member): Result<Unit, CheckOutError> {
  if (copy.status.type !== "available") {
    return Err({ type: "copy_not_available", copy })
  }
  if (member.standing.status.type !== "good_standing") {
    return Err({ type: "member_restricted", member })
  }
  return Ok(Unit)
}

// State transition
function checkOut(cmd: CheckOutBook): Result<Loan, CheckOutError> {
  const copy = findCopy(cmd.copyId)
  const member = findMember(cmd.memberId)
  
  return canCheckOut(copy, member).map(() => {
    const loan = new Loan({
      copy: cmd.copyId,
      borrower: cmd.memberId,
      checkedOutAt: now(),
      dueDate: cmd.dueDate
    })
    
    copy.markAsLoaned(loan.id)
    member.addActiveLoan(loan.id)
    
    emit(new BookCheckedOut({ loan }))
    
    return loan
  })
}
```

---

## Validation Questions

For each entity, ask:

### 1. Domain Expert Test

**"Can I describe this to a domain expert without mentioning software?"**

❌ Fails test:
- SessionState
- DTO
- ViewModel
- CacheEntry
- ApiResponse

✅ Passes test:
- Prescription
- Appointment
- Contract
- Invoice
- Shipment

### 2. Invariant Test

**"What invariants must always hold?"**

Define as **types**, not runtime checks.

```typescript
❌ Runtime checks:
class DateRange {
  start: Date
  end: Date
  
  isValid(): boolean {
    return this.end >= this.start
  }
}

✅ Type-level guarantee:
class DateRange {
  private constructor(
    readonly start: Date,
    readonly end: Date
  ) {}
  
  static create(start: Date, end: Date): Result<DateRange, string> {
    if (end < start) {
      return Err("End date must be after start date")
    }
    return Ok(new DateRange(start, end))
  }
  
  // No isValid() method needed - invalid ranges cannot be constructed
}
```

### 3. Mutual Exclusion Test

**"What states are mutually exclusive?"**

Use **sum types**, not optional fields.

```typescript
❌ Optional fields (allows impossible states):
class Payment {
  amount: Money
  creditCard?: CreditCardInfo
  bankTransfer?: BankTransferInfo
  cash?: boolean
  // Can be both cash and credit card?
}

✅ Sum types (impossible states impossible):
type PaymentMethod =
  | { type: "credit_card", card: CreditCardInfo }
  | { type: "bank_transfer", account: BankAccount }
  | { type: "cash" }
  | { type: "check", checkNumber: string }

class Payment {
  amount: Money
  method: PaymentMethod
}
```

### 4. Authority Test

**"Who decides transitions between states?"**

- **Human → Track the decision**
- **System → Enforce the rules**

```typescript
type ApplicationState =
  // System-enforced: automatically moves forward
  | { type: "submitted", at: Timestamp }
  
  // Human decision: requires explicit action
  | { type: "under_review", assignedTo: ReviewerId }
  | { type: "approved", by: ReviewerId, at: Timestamp, notes: string }
  | { type: "rejected", by: ReviewerId, at: Timestamp, reason: string }
  
  // System-enforced: automated consequence
  | { type: "expired", expirationDate: Date }
```

---

## Relationship Modeling

### Use Entity Reference When:

1. **Relationship can change over time**
   - Employee → Manager (manager can change)
   - Student → Course (enrollment can be added/removed)

2. **Multiple entities share the reference**
   - Multiple Orders → same Customer
   - Multiple Prescriptions → same Medication

3. **Entity has independent lifecycle**
   - Product exists before/after Orders reference it
   - Location exists before/after Events reference it

```typescript
class Order {
  customer: CustomerId  // Reference
  items: OrderLine[]
}

class OrderLine {
  product: ProductId    // Reference
  quantity: number
  priceAtOrder: Money
}
```

### Use Composition When:

1. **Part cannot exist without whole**
   - Invoice → InvoiceLines (lines are meaningless without invoice)
   - Prescription → Dosage (dosage is specific to this prescription)

2. **Part is private to one entity**
   - Person → DateOfBirth (not shared with other persons)
   - Contract → ContractTerms (terms are specific to this contract)

3. **Strong lifecycle binding**
   - When parent is deleted, children are deleted
   - When parent is created, children are created

```typescript
class Invoice {
  lines: InvoiceLine[]  // Composition - owned by invoice
  
  total(): Money {
    return this.lines.reduce((sum, line) => sum.add(line.amount), Money.zero())
  }
}

class InvoiceLine {
  // No invoiceId reference - it's part of the invoice
  description: string
  amount: Money
}
```

---

## When Pragmatism Is Acceptable

Pure ontological modeling can conflict with:
- **Performance** (denormalization for queries)
- **Frameworks** (ORM constraints, serialization)
- **Team velocity** (learning curve, migration cost)
- **Third-party integration** (API contracts)

### Compromise Strategies

#### 1. Dual Model Approach

Maintain two models:
- **Conceptual Schema** (ontology-driven, documentation)
- **Physical Schema** (implementation, persistence)

```typescript
// Conceptual model (internal domain)
class Order {
  state: OrderState
  customer: Customer
  items: OrderLine[]
}

// Physical model (database/API)
interface OrderRecord {
  id: string
  status: string          // Flattened from OrderState
  customer_id: string     // Denormalized
  customer_name: string   // Denormalized for queries
  items: OrderLineRecord[]
}

// Explicit mapping
class OrderMapper {
  toDomain(record: OrderRecord): Order { /* ... */ }
  toRecord(order: Order): OrderRecord { /* ... */ }
}
```

#### 2. Adapters At Boundaries

Use **ports and adapters** to isolate pragmatic concerns:
