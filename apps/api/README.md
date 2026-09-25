# VSS Operations API

Canonical on-premise API for operational records, source messages and documents, event organizers, venues, events, reusable exhibitor and agent companies, and their event participation. OpenClaw and web clients use this service instead of owning independent operational data.

## Run locally

```bash
docker compose up -d postgres
bun install
bun run db:migrate
bun run dev
```

The API listens on `http://127.0.0.1:3001`.

- See [`docs/EVENT_MANAGEMENT_API.md`](./docs/EVENT_MANAGEMENT_API.md) for the complete usage guide and end-to-end examples.
- See [`openapi.yaml`](./openapi.yaml) for the machine-readable contract.

## Mutation metadata

Every `POST` and `PATCH` requires:

- `X-Actor-Ref`: stable OpenClaw sender or trusted caller reference;
- `Idempotency-Key`: stable operation key of at least eight characters;
- `X-Source-Message-Id`: optional WhatsApp/OpenClaw source message.

An identical retry returns the stored response. Reusing the key for a different request returns `409 IDEMPOTENCY_CONFLICT`. Each successful mutation and its audit event are committed together.

## Domain

```text
Event Organizer ──< Event >── Venue
                         │
                         └──< Event Exhibitor >── Exhibitor company
                                      │
                                      └── optional Agent company
```

- An exhibitor company is reusable across events but can participate only once in a given event.
- `LOCAL` exhibitors are normalized to country `ID` and cannot have agents.
- `INTERNATIONAL` exhibitors can have zero or one reusable agent and cannot carry an Indonesian NPWP.
- Venue NPWP is optional.
- Event cancellation and exhibitor withdrawal are explicit, reversible lifecycle commands.
- Referenced master data is archived rather than deleted; archived records remain readable historically and cannot receive new references.

## Source lineage

- `POST /api/v1/source-messages` preserves WhatsApp message identity, sender, conversation, time, and optional text.
- `POST /api/v1/source-documents` preserves the original document bytes and immutable metadata. Attachments from WhatsApp must reference a stored source-message UUID; manual uploads must not invent one.
- Supported inputs are PDF, XLS, XLSX, CSV, JPEG, and PNG up to 20 MiB.
- Document responses and audit records exclude file bytes. Retrieve the original through `GET /api/v1/source-documents/{id}/content`.
- PostgreSQL is the on-premise byte store for this initial implementation; no external object-storage dependency is required.

Example event creation:

```bash
curl -X POST http://127.0.0.1:3001/api/v1/events \
  -H 'Content-Type: application/json' \
  -H 'X-Actor-Ref: whatsapp:+628123456789' \
  -H 'X-Source-Message-Id: wamid.example' \
  -H 'Idempotency-Key: 5ba2c843-d5d6-4fee-9b25-83da704cd95e' \
  -d '{
    "name": "Manufacturing Indonesia 2026",
    "startOn": "2026-12-02",
    "endOn": "2026-12-05",
    "eventOrganizerId": "<UUID_EVENT_ORGANIZER>",
    "venueId": "<UUID_VENUE>"
  }'
```

## Verify

```bash
bun run typecheck
bun test
```

The integration suite requires the local PostgreSQL service and migrated schema.
