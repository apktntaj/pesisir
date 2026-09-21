---
name: vss-events
description: Use the on-premise VSS event API through its three MCP tools whenever the user asks to list events, view one event, or create an event.
---

# VSS Events

Use only the VSS MCP tools for VSS event operations:

- `list_events` lists stored events.
- `get_event` retrieves one event by UUID.
- `create_event` creates one event using the configured default organizer and venue.

## Listing and detail

- Use `list_events` when the user asks what events exist or asks for upcoming event records.
- Use `get_event` when the user supplies an event UUID or selects an unambiguous event from a list.
- Never invent an event UUID.

## Creating an event

Before calling `create_event`, obtain all three fields:

- official event name;
- start date;
- end date.

Normalize dates to `YYYY-MM-DD`. Never guess a missing date or silently resolve an ambiguous date.

Always show this short confirmation before writing:

```text
Create this event?
- Name: ...
- Start: YYYY-MM-DD
- End: YYYY-MM-DD
```

Call `create_event` only after the user explicitly confirms the displayed values. A request to create an event is not itself confirmation; confirmation must follow the summary. If the user changes a value, show the revised summary and ask again.

After a successful write, reply with the event name, dates, and returned UUID. If the tool returns an error, explain it without claiming the event was created and do not retry a write automatically.

## Scope

Organizer and venue are configured defaults for this initial test. Do not ask for them and do not imply that the user selected them. Do not perform event updates or deletions; those tools are intentionally unavailable.
