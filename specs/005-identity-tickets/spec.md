# Feature Specification: Local Identity and Tickets

## Users and Roles

The API owns local users with stable UUID, display name, unique normalized email, active state, password hash, and one or more roles. Roles are `ADMIN`, `SUPERVISOR`, `STAFF`, `CUSTOMER_SERVICE`, and `DOCUMENT_ASSISTANT`. Demo credentials and caller-supplied actor references are not production authorization.

Ticket authorization follows these role boundaries:

- `ADMIN` and `SUPERVISOR` may create, edit, assign, reassign, transition, comment on, or cancel any ticket.
- Active `STAFF`, `CUSTOMER_SERVICE`, and `DOCUMENT_ASSISTANT` users may create tickets and edit, transition, or comment on tickets they created or are assigned. They may not assign, reassign, or cancel tickets.

## Clarifications

### Session 2026-10-02

- Q: Which roles may perform ticket lifecycle operations? → A: `ADMIN` and `SUPERVISOR` may manage any ticket; other active roles may create tickets and update or comment on tickets they created or are assigned, but cannot assign, reassign, or cancel tickets.

## Tickets

A ticket has one context: `GENERAL`, `EVENT`, or `CUSTOMS_JOB`; one optional assignee; title, optional description, priority (`NORMAL`/`URGENT`), and status (`TODO`/`IN_PROGRESS`/`DONE`/`CANCELLED`). A job-context ticket references a canonical customs job; it does not duplicate event context.

Ticket comments and activities are append-only. Creation, edits, assignment, status transition, and comments write activity records. `DONE` requires an outcome. Reopening `DONE` requires a reason. Context and assignee references must exist and be active where applicable.

## Boundaries

This feature stores users and ticket workflows only. Password/session implementation, external SSO, approval policy, notifications, attachments, and browser migration are separate follow-up slices. The Next.js workspace uses these records only after API contracts and identity translation are available.

## Acceptance

- A user can create, assign, update, comment on, complete, and reopen a ticket with an auditable timeline.
- Invalid context, inactive assignee, completion without outcome, and reopen without reason are rejected atomically.
- Reloading the workspace after its adapter cutover returns the same API ticket records.
