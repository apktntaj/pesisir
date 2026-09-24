# Event Management API Guide

This guide explains how OpenClaw, scripts, and future web clients use the VSS event-management REST API. The API is the canonical system of record; callers should retain returned UUIDs rather than matching records by name.

## 1. Start the API

From `apps/api/`:

```bash
docker compose up -d
bun run db:migrate
```

The Docker API service applies unapplied migrations automatically when it starts. For local Bun development:

```bash
docker compose up -d postgres
bun install
bun run db:migrate
bun run dev
```

The default base URL is `http://127.0.0.1:3001`.

```bash
curl http://127.0.0.1:3001/health
```

Expected response:

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-09-21T13:23:16.625Z"
}
```

## 2. Request conventions

### Read requests

`GET` requests do not require mutation headers. List endpoints use:

- `limit`: 1–100, default `50`;
- `offset`: zero-based offset, default `0`.

Paginated response:

```json
{
  "data": [],
  "meta": {
    "limit": 50,
    "offset": 0,
    "total": 0
  }
}
```

### Mutation requests

Every `POST` and `PATCH` request requires:

| Header | Required | Purpose |
|---|---:|---|
| `Content-Type: application/json` | Yes | Selects the JSON request format. |
| `X-Actor-Ref` | Yes | Stable caller identity, such as an authenticated OpenClaw sender reference. |
| `Idempotency-Key` | Yes | Stable operation key with at least eight characters; UUIDs are recommended. |
| `X-Source-Message-Id` | No | Originating WhatsApp or OpenClaw message identifier. |

Use one idempotency key for one confirmed operation. If a timeout makes the result uncertain, retry the same method, path, and JSON body with the same key. The API returns the original response without committing the action twice.

Reusing a key for a different operation returns:

```json
{
  "error": {
    "code": "IDEMPOTENCY_CONFLICT",
    "message": "Idempotency-Key sudah digunakan untuk request yang berbeda."
  }
}
```

Examples below use these reusable shell values:

```bash
BASE_URL=http://127.0.0.1:3001
ACTOR_REF='whatsapp:+628123456789'
```

Generate a new idempotency UUID for each new mutation. Do not generate a new key when retrying that same mutation.

### Errors

Errors use one envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request tidak valid.",
    "details": [
      { "field": "endOn", "message": "endOn tidak boleh sebelum startOn." }
    ]
  }
}
```

Common status codes:

| Status | Meaning |
|---:|---|
| `400` | Invalid UUID, query, or missing mutation metadata. |
| `404` | Referenced record was not found. |
| `409` | Lifecycle, archive, duplicate, or idempotency conflict. |
| `422` | JSON fields or a domain rule are invalid. |
| `500` | Unexpected server or database failure. |

## 3. Domain model

```text
Event Organizer ──< Event >── Venue
                         │
                         └──< Event Exhibitor >── Exhibitor company
                                      │
                                      ├── optional primary exhibitor contact
                                      └── optional Agent company
```

- Event organizers, venues, exhibitors, and agents are reusable master records.
- `event_exhibitors` represents one company participating in one event.
- One exhibitor company can participate in several events, but only once per event.
- A local exhibitor is normalized to country `ID` and cannot have an agent.
- An international exhibitor can have zero or one agent. It cannot use country `ID` or an Indonesian NPWP.
- One agent company can coordinate several international exhibitors.
- Venue NPWP is optional.
- Records are cancelled, withdrawn, or archived instead of being deleted.

## 4. Recommended workflow

### Step 1: Resolve or create the organizer

List active organizers:

```bash
curl "$BASE_URL/api/v1/event-organizers?limit=100&offset=0"
```

Create an organizer only after confirming that an existing record is not the same organization:

```bash
curl -X POST "$BASE_URL/api/v1/event-organizers" \
  -H 'Content-Type: application/json' \
  -H "X-Actor-Ref: $ACTOR_REF" \
  -H 'Idempotency-Key: 40fde203-bb86-4a5c-9654-ab978fe75021' \
  -d '{
    "name": "PT Pamerindo Indonesia",
    "npwp": "01.234.567.8-012.000",
    "address": "Jakarta",
    "website": "https://example.com"
  }'
```

Only `name` is mandatory. Optional values may be omitted or sent as `null`.

### Step 2: Resolve or create the venue

```bash
curl "$BASE_URL/api/v1/venues?limit=100&offset=0"
```

```bash
curl -X POST "$BASE_URL/api/v1/venues" \
  -H 'Content-Type: application/json' \
  -H "X-Actor-Ref: $ACTOR_REF" \
  -H 'Idempotency-Key: 4c85e978-fcf1-47c0-baa1-c598964310bf' \
  -d '{
    "name": "Jakarta International Expo",
    "npwp": null,
    "address": "Kemayoran, Jakarta",
    "website": "https://www.jiexpo.com",
    "loadingAccessNotes": "Confirm loading gate before move-in."
  }'
```

Venue NPWP, address, website, and loading-access notes are optional.

### Step 3: Create the event

Event creation requires explicit organizer and venue UUIDs. The API has no silent defaults.

```bash
curl -X POST "$BASE_URL/api/v1/events" \
  -H 'Content-Type: application/json' \
  -H "X-Actor-Ref: $ACTOR_REF" \
  -H 'X-Source-Message-Id: wamid.example-event' \
  -H 'Idempotency-Key: 5ba2c843-d5d6-4fee-9b25-83da704cd95e' \
  -d '{
    "name": "Manufacturing Indonesia 2026",
    "alias": "MI 2026",
    "notes": null,
    "startOn": "2026-12-02",
    "endOn": "2026-12-05",
    "eventOrganizerId": "<ORGANIZER_UUID>",
    "venueId": "<VENUE_UUID>"
  }'
```

Dates are date-only values formatted as `YYYY-MM-DD`. A one-day event is allowed; `endOn` must be the same as or later than `startOn`.

### Step 4: Resolve or create the exhibitor company

Search active exhibitors:

```bash
curl "$BASE_URL/api/v1/exhibitors?search=Global&kind=INTERNATIONAL&limit=100&offset=0"
```

Create a local exhibitor:

```bash
curl -X POST "$BASE_URL/api/v1/exhibitors" \
  -H 'Content-Type: application/json' \
  -H "X-Actor-Ref: $ACTOR_REF" \
  -H 'Idempotency-Key: b9fb8fc4-b150-4ff0-8f5c-929673cbdbef' \
  -d '{
    "legalName": "PT Contoh Indonesia",
    "alias": "Contoh",
    "kind": "LOCAL",
    "npwp": "01.234.567.8-012.000",
    "address": "Bekasi"
  }'
```

`countryCode` is normalized to `ID`. Never attach an agent to this exhibitor.

Create an international exhibitor:

```bash
curl -X POST "$BASE_URL/api/v1/exhibitors" \
  -H 'Content-Type: application/json' \
  -H "X-Actor-Ref: $ACTOR_REF" \
  -H 'Idempotency-Key: e111a3cd-7ccc-443e-a071-e19036f4ba41' \
  -d '{
    "legalName": "Global Display Co., Ltd.",
    "alias": "Global Display",
    "kind": "INTERNATIONAL",
    "countryCode": "KR",
    "address": "Seoul, Republic of Korea",
    "npwp": null
  }'
```

An international country may be `null` when it is genuinely unknown, but it cannot be `ID`.

### Step 5: Add an exhibitor contact

Contacts belong to master records. At least an email, phone, or legacy contact value is required.

```bash
curl -X POST "$BASE_URL/api/v1/exhibitors/<EXHIBITOR_UUID>/contacts" \
  -H 'Content-Type: application/json' \
  -H "X-Actor-Ref: $ACTOR_REF" \
  -H 'Idempotency-Key: b101d839-b160-48ca-bc25-0eb4b8851941' \
  -d '{
    "name": "Sophia Kim",
    "role": "Exhibition Coordinator",
    "email": "sophia@example.com",
    "phone": "+82-10-1234-5678",
    "isPrimary": true
  }'
```

Setting `isPrimary` to `true` clears the previous primary flag for that owner. The returned contact UUID can be selected as `primaryContactId` on event participation.

The same contact payload is supported by:

- `POST /api/v1/event-organizers/{id}/contacts`
- `POST /api/v1/venues/{id}/contacts`
- `POST /api/v1/exhibitors/{id}/contacts`
- `POST /api/v1/agents/{id}/contacts`

### Step 6: Resolve or create an agent for an international exhibitor

```bash
curl "$BASE_URL/api/v1/agents?search=Seoul&limit=100&offset=0"
```

```bash
curl -X POST "$BASE_URL/api/v1/agents" \
  -H 'Content-Type: application/json' \
  -H "X-Actor-Ref: $ACTOR_REF" \
  -H 'Idempotency-Key: bb1c0267-e266-47ae-a793-f684fa2bb93d' \
  -d '{
    "name": "Seoul Exhibition Logistics",
    "countryCode": "KR",
    "address": "Seoul, Republic of Korea",
    "website": null
  }'
```

Skip this step for local exhibitors.

### Step 7: Add the exhibitor to the event

International participation with an agent:

```bash
curl -X POST "$BASE_URL/api/v1/events/<EVENT_UUID>/exhibitors" \
  -H 'Content-Type: application/json' \
  -H "X-Actor-Ref: $ACTOR_REF" \
  -H 'X-Source-Message-Id: wamid.example-participation' \
  -H 'Idempotency-Key: 20367664-08ad-4a0a-88e8-17a5af839cc5' \
  -d '{
    "exhibitorId": "<EXHIBITOR_UUID>",
    "agentId": "<AGENT_UUID>",
    "primaryContactId": "<EXHIBITOR_CONTACT_UUID>",
    "hall": "A",
    "booth": "A-01",
    "notes": null
  }'
```

Local participation must omit `agentId` or send it as `null`:

```json
{
  "exhibitorId": "<LOCAL_EXHIBITOR_UUID>",
  "agentId": null,
  "hall": "B",
  "booth": "B-10"
}
```

The selected primary contact must belong to the selected exhibitor. Adding the same exhibitor to the same event twice returns `409 DUPLICATE_PARTICIPATION`.

## 5. Reading event data

List events:

```bash
curl "$BASE_URL/api/v1/events?limit=50&offset=0"
```

Supported event filters:

| Query | Meaning |
|---|---|
| `eventOrganizerId` | Exact organizer UUID. |
| `venueId` | Exact venue UUID. |
| `startsFrom` | Earliest `startOn`, formatted `YYYY-MM-DD`. |
| `startsUntil` | Latest `startOn`, formatted `YYYY-MM-DD`. |
| `status` | `ACTIVE` or `CANCELLED`. |

Get one event:

```bash
curl "$BASE_URL/api/v1/events/<EVENT_UUID>"
```

The response embeds organizer and venue summaries and returns active/withdrawn participation counts.

List an event's exhibitors:

```bash
curl "$BASE_URL/api/v1/events/<EVENT_UUID>/exhibitors"
```

Each result embeds the exhibitor, optional agent, and optional primary contact.

Get one participation:

```bash
curl "$BASE_URL/api/v1/event-exhibitors/<PARTICIPATION_UUID>"
```

Master detail endpoints embed their contacts:

```text
GET /api/v1/event-organizers/{id}
GET /api/v1/venues/{id}
GET /api/v1/exhibitors/{id}
GET /api/v1/agents/{id}
```

## 6. Updating data

Use `PATCH` and include only fields that should change. Send `null` to clear an optional field.

Update event metadata:

```bash
curl -X PATCH "$BASE_URL/api/v1/events/<EVENT_UUID>" \
  -H 'Content-Type: application/json' \
  -H "X-Actor-Ref: $ACTOR_REF" \
  -H 'Idempotency-Key: f56588cf-f564-4be2-a617-e403239a26ea' \
  -d '{ "notes": "Move-in briefing confirmed." }'
```

Update active participation:

```bash
curl -X PATCH "$BASE_URL/api/v1/event-exhibitors/<PARTICIPATION_UUID>" \
  -H 'Content-Type: application/json' \
  -H "X-Actor-Ref: $ACTOR_REF" \
  -H 'Idempotency-Key: acbbb77f-b9ad-4c6a-a1bd-64e22c77a255' \
  -d '{ "hall": "C", "booth": "C-12" }'
```

Supported master updates:

```text
PATCH /api/v1/event-organizers/{id}
PATCH /api/v1/venues/{id}
PATCH /api/v1/exhibitors/{id}
PATCH /api/v1/agents/{id}
PATCH /api/v1/contacts/{id}
```

Changing an exhibitor to `LOCAL` is rejected until agents have been removed from all its participation records.

## 7. Lifecycle commands

Lifecycle commands always require a non-empty reason.

Cancel an event:

```bash
curl -X POST "$BASE_URL/api/v1/events/<EVENT_UUID>/cancel" \
  -H 'Content-Type: application/json' \
  -H "X-Actor-Ref: $ACTOR_REF" \
  -H 'Idempotency-Key: 5961508e-1b3a-486b-a790-fd3a67309105' \
  -d '{ "reason": "Organizer cancelled the exhibition." }'
```

A cancelled event remains readable but cannot accept participation changes.

Reactivate it:

```bash
curl -X POST "$BASE_URL/api/v1/events/<EVENT_UUID>/reactivate" \
  -H 'Content-Type: application/json' \
  -H "X-Actor-Ref: $ACTOR_REF" \
  -H 'Idempotency-Key: f5ca5890-752c-422c-bb4c-5c737cb72647' \
  -d '{ "reason": "Organizer restored the event." }'
```

Withdraw a participation:

```bash
curl -X POST "$BASE_URL/api/v1/event-exhibitors/<PARTICIPATION_UUID>/withdraw" \
  -H 'Content-Type: application/json' \
  -H "X-Actor-Ref: $ACTOR_REF" \
  -H 'Idempotency-Key: f069c475-7e4f-4aa6-b366-399b30b1d9a1' \
  -d '{ "reason": "Exhibitor withdrew from the event." }'
```

Reactivate it with `POST /api/v1/event-exhibitors/{id}/reactivate`. The parent event must be active first.

## 8. Archiving master data

Archive obsolete master data instead of deleting it:

```bash
curl -X POST "$BASE_URL/api/v1/venues/<VENUE_UUID>/archive" \
  -H 'Content-Type: application/json' \
  -H "X-Actor-Ref: $ACTOR_REF" \
  -H 'Idempotency-Key: 9182865f-7f54-47ef-b49d-29ece0ef9093' \
  -d '{ "reason": "Venue is no longer used." }'
```

Archive endpoints exist for:

```text
POST /api/v1/event-organizers/{id}/archive
POST /api/v1/venues/{id}/archive
POST /api/v1/exhibitors/{id}/archive
POST /api/v1/agents/{id}/archive
POST /api/v1/contacts/{id}/archive
```

Archived records:

- remain embedded in historical event data;
- cannot receive new references;
- are excluded from master lists by default.

Use `?includeArchived=true` on organizer, venue, exhibitor, and agent lists when an administrative view needs archived records. `DELETE` is intentionally rejected with `405`.

## 9. Endpoint summary

| Resource | Operations |
|---|---|
| Health | `GET /health` |
| Organizers | `GET/POST /api/v1/event-organizers`, `GET/PATCH /api/v1/event-organizers/{id}`, contacts, archive |
| Venues | `GET/POST /api/v1/venues`, `GET/PATCH /api/v1/venues/{id}`, contacts, archive |
| Events | `GET/POST /api/v1/events`, `GET/PATCH /api/v1/events/{id}`, cancel, reactivate |
| Exhibitors | `GET/POST /api/v1/exhibitors`, `GET/PATCH /api/v1/exhibitors/{id}`, contacts, archive |
| Agents | `GET/POST /api/v1/agents`, `GET/PATCH /api/v1/agents/{id}`, contacts, archive |
| Participation | `GET/POST /api/v1/events/{eventId}/exhibitors`, `GET/PATCH /api/v1/event-exhibitors/{id}`, withdraw, reactivate |
| Contacts | `PATCH /api/v1/contacts/{id}`, archive through `POST /api/v1/contacts/{id}/archive` |

The machine-readable contract is [`../openapi.yaml`](../openapi.yaml). OpenClaw-specific tool and confirmation behavior is documented in [`../../../agents/openclaw/skills/vss-events/SKILL.md`](../../../agents/openclaw/skills/vss-events/SKILL.md).
