# Project Intent: On-Premise PPJK Operations Assistant

## Intent

Build an on-premise operations assistant for Indonesian PPJK teams, with WhatsApp through OpenClaw as the primary interface.

PPJK work already happens through chat: customers and agents send instructions, corrections, PDFs, spreadsheets, shipment updates, and questions in an ongoing conversation. The product should meet operators in that workflow. Staff should be able to send a document or message naturally, and the assistant should turn it into structured operational work without forcing every interaction through a web form.

The assistant is not intended to replace licensed customs expertise or autonomously make final customs decisions. It reduces administrative effort, preserves context, checks completeness and consistency, coordinates follow-up, and prepares work for human review.

## Why on-premise

PPJK organizations handle commercially and legally sensitive information: customer identities, invoices, packing lists, cargo details, transport documents, customs records, permits, prices, and operational communications.

The operational database, stored documents, business rules, audit history, and agent-accessible services must therefore be deployable on infrastructure controlled by the customer. External communication channels such as WhatsApp remain external by nature, but they must not become the system of record.

## Intended user experience

A typical interaction should look like this:

1. A staff member sends a message, PDF, or spreadsheet through WhatsApp.
2. OpenClaw identifies the user, intent, document type, and relevant event, exhibitor, shipment, or customs job.
3. The agent extracts available facts, compares related documents, and identifies missing or conflicting information.
4. It asks focused clarification questions instead of guessing.
5. After confirmation, it invokes structured API operations to create or update records.
6. The user receives a concise result, next actions, or exception summary in WhatsApp.
7. Staff and supervisors use the web application when they need a dashboard, detailed editing, bulk review, approval, or an audit view.

Examples include:

- registering a new event, exhibitor, shipment, or customs job from conversation;
- extracting invoice, packing-list, B/L, AWB, or CIPL information;
- comparing commercial and transport documents and reporting discrepancies;
- tracking missing documents, blockers, deadlines, and responsible people;
- checking LARTAS or other supporting references while preserving source and effective-date context;
- preparing structured drafts and checklists for authorized human review;
- answering operational status questions from the on-premise system of record.

## System roles

### OpenClaw and WhatsApp

OpenClaw is the conversational agent and orchestration layer. It performs language and document understanding, maintains conversational context, asks for clarification, and uses approved tools to act on operational data.

In the upgraded system, OpenClaw replaces the document-understanding role previously embedded in the web app through Gemini. The application must not require Gemini for document extraction. The agent supplies structured extraction results together with provenance and confidence where applicable.

### VSS API

`apps/api/` is the authoritative on-premise backend. It should eventually own:

- users, roles, permissions, and agent identity;
- events, organizers, venues, exhibitors, and contacts;
- source messages and attachments;
- CIPL versions and item lineage;
- shipments and transport documents;
- customs jobs and explicit lifecycle transitions;
- tasks, blockers, confirmations, approvals, and audit events;
- validated tool operations used by OpenClaw and the web application.

The API must enforce invariants. The agent may propose an action, but prompts must not be the only protection against invalid or unauthorized state changes.

### VSS Project Management web app

`apps/project-management/` is the existing web-based operational workspace and domain reference. It provides the detailed visual interface for managing and reviewing the same operational data.

It should evolve into a client of the shared backend rather than remain a separate source of truth. Existing domain models, screens, document comparison behavior, and workflow research are valuable inputs, but browser-local or Supabase-specific persistence should not define the final on-premise architecture.

### Pesisir/INSW integration

The existing `apps/insw-gateway/` service provides INSW/LARTAS integration capabilities. It is a supporting service or integration boundary within the larger assistant, not the primary product.

## Safety and authority model

The assistant may automatically read, extract, reconcile, summarize, create drafts, update low-risk workflow data, and generate reminders when permitted.

It must request authorized human confirmation for high-impact actions, including final HS classification, customs or legal determinations, declaration submission, amendment or cancellation, payment, guarantees, and sensitive external communication unless an explicit approved policy says otherwise.

The system should fail safely when information, permission, or an authoritative source is missing. It must preserve the difference between:

- known and source-backed facts;
- user-confirmed facts;
- agent inferences or suggestions;
- unknown information;
- conflicting information;
- not-applicable information.

## Success criteria

The product succeeds when a PPJK team can operate primarily from WhatsApp while the organization retains structured, searchable, auditable, and locally controlled records.

The assistant should reduce repeated data entry and context loss without weakening professional oversight. Every meaningful operational action should remain attributable, reviewable, and recoverable through the web workspace and API audit history.

## Current transition

The repository currently contains components at different maturity levels:

- `apps/project-management/` contains the earlier web-first implementation and substantial domain/workflow knowledge.
- `apps/api/` is the beginning of the on-premise backend and system of record.
- `apps/insw-gateway/` contains the earlier INSW/LARTAS gateway.
- the OpenClaw/WhatsApp tool layer still needs to be designed and connected to the API.

Development should converge these pieces around one canonical domain and API. Avoid expanding independent data models or adding new embedded AI extraction paths that make that convergence harder.
