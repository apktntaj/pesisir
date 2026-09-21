# VSS MCP

Local MCP adapter that gives the OpenClaw PPJK agent exactly three VSS actions:

- `list_events`
- `get_event`
- `create_event`

The existing REST API still requires an Event Organizer and Venue. For this initial WhatsApp test, `create_event` supplies configured default IDs so users only provide the event name and dates.

## Configure

Copy `.env.example` to `.env` and set:

- `VSS_API_BASE_URL`: HTTPS base URL without `/api/v1`.
- `VSS_API_TOKEN`: optional bearer token expected by the HTTPS gateway.
- `VSS_DEFAULT_EVENT_ORGANIZER_ID`: existing organizer UUID.
- `VSS_DEFAULT_VENUE_ID`: existing venue UUID.

## Verify

```bash
npm install
bun run typecheck
bun test
npm run build
```

OpenClaw launches this server over stdio; it should not be exposed as another network service.

Register the bundled server with OpenClaw:

```bash
openclaw mcp add vss \
  --command /usr/bin/node \
  --arg=--env-file=.env \
  --arg dist/server.js \
  --cwd /home/aa/Projects/pesisir/vss-mcp \
  --include list_events,get_event,create_event \
  --approval auto
```

The `vss-events` OpenClaw skill requires explicit user confirmation before `create_event`; the MCP server exposes no update or delete tools.
