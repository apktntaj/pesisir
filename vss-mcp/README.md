# VSS MCP

Local stdio MCP adapter for the VSS event-management API. It exposes event, organizer, venue, exhibitor-company, agent-company, participation, cancellation, and withdrawal operations to OpenClaw.

Mutating tools require OpenClaw to provide a stable actor reference, originating message ID when available, and an idempotency UUID. Organizer and venue IDs are always selected explicitly; there are no silent configured defaults.

## Configure

Copy `.env.example` to `.env` and set:

- `VSS_API_BASE_URL`: HTTPS base URL without `/api/v1`.
- `VSS_API_TOKEN`: optional bearer token expected by the deployment gateway.

## Verify

```bash
npm install
bun run typecheck
bun test
npm run build
```

OpenClaw launches the server over stdio; do not expose it as another network service.

```bash
openclaw mcp add vss \
  --command /usr/bin/node \
  --arg=--env-file=.env \
  --arg dist/server.js \
  --cwd /home/aa/Projects/pesisir/vss-mcp \
  --approval auto
```

The bundled `vss-events` skill requires exact user confirmation before every write and forbids agent assignment to local exhibitors.
