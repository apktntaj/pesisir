# Agent Context

Before changing this repository, read [`PROJECT_INTENT.md`](./PROJECT_INTENT.md). It is the product north star and applies to every subproject.

## Repository purpose

This repository is building an **on-premise PPJK operations assistant**. Its primary user interface is WhatsApp, connected through OpenClaw. It is not merely an event-management website or a generic CRUD API.

The product helps Indonesian customs-brokerage (PPJK) teams turn conversations and operational documents into structured, traceable work while keeping sensitive company and shipment data under the customer's control.

## Architecture boundaries

- **OpenClaw agent:** primary conversational interface and orchestration layer. It receives WhatsApp messages and files, understands user intent, extracts information from PDFs and spreadsheets, asks clarifying questions, and calls application tools/APIs.
- **`apps/api/`:** on-premise system of record and deterministic business API. It owns persisted operational data, validation, relationships, lifecycle rules, authorization boundaries, and auditability.
- **`apps/project-management/`:** web-based operational workspace and domain reference. It is the richer interface for supervisors and staff to inspect, correct, approve, and manage events, exhibitors, documents, shipments, customs jobs, and coordination work.
- **`apps/insw-gateway/`:** existing INSW/LARTAS gateway. Treat it as a supporting integration, not the overall product identity.

Do not reintroduce Gemini or another embedded cloud document-extraction dependency into the upgraded architecture. Document interpretation belongs to the OpenClaw agent. The backend and web app should accept structured results, preserve source-document lineage, validate inputs, and expose corrections and approvals.

## Product principles

- On-premise deployment is a core requirement because PPJK operational and customs data is sensitive.
- WhatsApp is the normal day-to-day interface; the web app complements it for workflows that need overview, review, or detailed editing.
- Preserve event/job context across conversations. A message or document must be linked to the correct operational entity rather than becoming isolated chat history.
- Never silently invent missing customs facts. Keep unknown, conflicting, inferred, and confirmed information distinguishable.
- Retain source lineage and an audit trail for extracted facts, corrections, state transitions, approvals, and agent actions.
- Automate preparation, reconciliation, reminders, and workflow coordination. High-impact customs, legal, financial, submission, amendment, and payment decisions require an authorized human.
- Prefer deterministic validation and explicit lifecycle commands over unrestricted agent writes or free-form status changes.
- Design all agent-triggered operations to be permission-aware, idempotent where practical, and safe to retry.

## Development guidance

- Keep domain rules independent from WhatsApp/OpenClaw message formatting.
- Expose narrow, structured tools/API operations for the agent instead of direct database access.
- Treat uploaded documents and extracted values as different records: retain the original source, extraction provenance, and later human corrections.
- Do not move business logic into prompts when it belongs in schemas, validation, lifecycle rules, or authorization checks.
- Reuse the mature domain knowledge and workflows in `apps/project-management/`, but migrate persistence and shared operations toward `apps/api/` rather than duplicating incompatible models.
- Follow any more specific `AGENTS.md` found inside a subproject in addition to these repository-wide instructions.

