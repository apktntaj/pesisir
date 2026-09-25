---
name: vss-events
description: Use the on-premise VSS tools for event, organizer, venue, exhibitor-company, agent-company, and event-participation operations.
---

# VSS Events

Use VSS MCP tools instead of inventing IDs or retaining event data only in conversation.

## Read operations

- Resolve organizers and venues with `list_event_organizers` and `list_venues`.
- Resolve reusable companies with `list_exhibitors` and `list_agents`.
- Use `list_events`, `get_event`, and `list_event_exhibitors` for event context.
- Never infer that similarly named companies are the same record.

## Write protocol

Before every create, update, cancellation, withdrawal, or reactivation:

1. Obtain every required business value without guessing.
2. Resolve referenced records and show their names, not only UUIDs.
3. Display a concise summary of the exact write.
4. Call the tool only after explicit confirmation of that summary.

For channel messages, derive `actorRef` from the authenticated OpenClaw sender. For local prompt development without a channel identity, use the stable reference `openclaw:local-operator`. Use the originating message ID when one exists; omit it for local prompts. Generate one UUID `idempotencyKey` for each confirmed operation and reuse it for retries. Never ask the user to provide these technical fields. Do not automatically retry a failed write with a new key.

## Organizer and venue masters

Resolve organizers and venues before creating an event. When the intended organizer or venue does not exist, offer to create the reusable master record, show its exact fields, and obtain explicit confirmation. Never substitute a similarly named master silently.

## Events

Creating an event requires its official name, `YYYY-MM-DD` start and end dates, one organizer, and one venue. Do not use configured defaults. Optional alias and notes remain `null` when unknown.

Cancellation and reactivation require an explicit reason and confirmation. Do not represent cancellation by deleting an event.

## Exhibitors and agents

An exhibitor company is reusable across events. Create a new master only when the user confirms that an existing record is not the same company.

- A `LOCAL` exhibitor is Indonesian, may have an NPWP, and must never receive an agent.
- An `INTERNATIONAL` exhibitor may have zero or one agent and must not receive an Indonesian NPWP or country code `ID`.
- Agent companies are reusable and may coordinate several international exhibitors.

Adding an exhibitor to an event creates participation, not another exhibitor master. Confirm event, exhibitor, optional agent, primary contact, hall, booth, and notes. Use withdrawal/reactivation commands instead of deletion or duplicate participation.

After success, report the affected name, lifecycle status, and returned UUID. On error, report the API message and do not claim that the write succeeded.
