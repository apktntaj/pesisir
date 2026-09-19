# VSS Operations API

REST API awal untuk Event Organizer, Venue, Contact, dan Event. Tidak ada UI, WhatsApp, OpenClaw, MCP, atau LLM dalam service ini.

## Jalankan lokal

```bash
docker compose up -d postgres
bun install
bun run db:migrate
bun run dev
```

API tersedia pada `http://127.0.0.1:3001`; kontrak endpoint ada di [`openapi.yaml`](./openapi.yaml).

## Data awal

Database pengembangan diisi dengan empat Event Organizer dan empat Venue. Setiap record memiliki satu Contact dummy. Event sengaja tidak di-seed dan dibuat melalui API.

Lihat identifier yang tersedia:

```bash
curl http://127.0.0.1:3001/api/v1/event-organizers
curl http://127.0.0.1:3001/api/v1/venues
curl http://127.0.0.1:3001/api/v1/events
```

## Membuat Event

Gunakan UUID Event Organizer dan Venue dari endpoint daftar. Kedua UUID wajib ada, dan `endOn` tidak boleh lebih awal dari `startOn`.

```bash
curl -X POST http://127.0.0.1:3001/api/v1/events \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Manufacturing Indonesia 2026",
    "startOn": "2026-12-02",
    "endOn": "2026-12-05",
    "eventOrganizerId": "<UUID_EVENT_ORGANIZER>",
    "venueId": "<UUID_VENUE>"
  }'
```

Contoh mengambil daftar Event:

```bash
curl http://127.0.0.1:3001/api/v1/events
```

Filter berdasarkan Event Organizer, Venue, atau tanggal mulai:

```bash
curl 'http://127.0.0.1:3001/api/v1/events?eventOrganizerId=<UUID>'
curl 'http://127.0.0.1:3001/api/v1/events?venueId=<UUID>'
curl 'http://127.0.0.1:3001/api/v1/events?startsFrom=2026-01-01&startsUntil=2026-12-31'
```

UUID harus memiliki format `8-4-4-4-12`. Jika API mengembalikan `Invalid UUID`, salin ulang nilai `id` lengkap dari endpoint daftar.

## Verifikasi singkat

```bash
curl http://127.0.0.1:3001/health
bun run typecheck
bun test
```

## Data model

```text
Event Organizer ──< Event >── Venue
       │                         │
       └──< Contact              └──< Contact
```

`events` menolak `endOn` yang lebih awal dari `startOn`. Event Organizer dan Venue tidak dapat dihapus selama masih dirujuk oleh Event.
