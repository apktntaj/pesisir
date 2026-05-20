# Pesisir API

Lightweight Bun backend service that acts as a gateway for the **INSW** (Indonesia National Single Window) API. Decouples token management from the Next.js frontend deployment lifecycle.

## Architecture

```
Client (Browser)
    │
    ▼
Next.js on Vercel
    │  POST /lartas { method, path, body }
    ▼
Pesisir API (Docker container)
    │  GET/POST with Basic token + INSW headers
    ▼
api.insw.go.id
```

- Token can be passed via `TOKEN` env var (Railway) or `token.txt` file (VPS).
- Service reads the token on each request — no restart needed.
- Frontend never needs redeployment when the token changes.
- Sends INSW-required headers: `Origin: https://insw.go.id`, `Referer`, `Accept-Language`.

## API Endpoints

### `GET /health`

Returns service health status.

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 123456,
    "uptimeHuman": "1d 2h 3m 4s",
    "version": "1.0.0"
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### `GET /token-status`

Returns whether a token is loaded (never exposes the full token).

```json
{
  "success": true,
  "data": {
    "exists": true,
    "maskedToken": "abc4****7890"
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### `POST /lartas`

Proxies a request to the INSW API using the stored Basic token.

**Request body:**

```json
{
  "method": "GET",
  "path": "/api/cms/detail-komoditas",
  "params": { "hsCode": "12345678" },
  "body": null
}
```

| Field    | Type     | Required | Description                         |
|----------|----------|----------|-------------------------------------|
| method   | string   | yes      | HTTP method (GET, POST, PUT, PATCH, DELETE) |
| path     | string   | yes      | Path on the INSW API                |
| params   | object   | no       | URL query parameters                |
| body     | any      | no       | Request body for POST/PUT/PATCH     |

**Response:**

```json
{
  "success": true,
  "data": {
    "status": 200,
    "headers": { "content-type": "application/json" },
    "data": { ... }
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

**Example INSW paths:**

| Endpoint | Path |
|---|---|
| CMS Detail | `/api/cms/detail-komoditas` |
| CMS Search | `/api/cms/hscode` |
| Public HS Code | `/api-prod/ref/hscode` |
| Public Detail (BA) | `/api-prod-ba/ref/hscode/komoditas` |
| Public Detail | `/api-prod/ref/hscode/komoditas` |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Bun](https://bun.sh) (for local development only)

## Quick Start

```bash
git clone <repo-url>
cd pesisir-api
```

### 1. Set up the token

Create `token.txt` with your INSW JWT (the raw JWT after the `Basic ` prefix):

```
eyJhbGciOiJSUzI1NiIsInR5cCI6ImJzYStqd3QiLCJraWQiOiJYU1N0SFVmeGI1...
```

**Never commit `token.txt`** — it's already in `.gitignore`.

### 2. Configure environment

Copy and edit `.env`:

```bash
cp .env.example .env
```

| Variable            | Default                     | Description                                  |
|---------------------|-----------------------------|----------------------------------------------|
| PORT                | 3001                        | Server port                                  |
| LARTAS_BASE_URL     | https://api.insw.go.id    | INSW API base URL                            |
| TOKEN               | (empty)                     | Token value (fallback if `token.txt` missing) |
| TOKEN_FILE_PATH     | ./token.txt                 | Path to token file                           |
| API_KEY             | (empty)                     | Optional shared secret for `/lartas` auth    |
| REQUEST_TIMEOUT_MS  | 30000                       | Upstream request timeout                     |
| MAX_RETRIES         | 3                           | Upstream retry count                         |

### 3. Run with Docker

```bash
docker build -t pesisir-api .
docker run -d \
  --name pesisir-api \
  -p 3001:3001 \
  -v $(pwd)/token.txt:/app/token.txt \
  -v $(pwd)/.env:/app/.env \
  pesisir-api
```

Or with Docker Compose (`compose.yml`):

```yaml
services:
  pesisir-api:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ./token.txt:/app/token.txt
      - ./.env:/app/.env
    restart: unless-stopped
```

### 4. Verify

```bash
curl http://localhost:3001/health
curl http://localhost:3001/token-status
```

## Development (without Docker)

```bash
bun install
bun run dev
```

Starts with hot-reload via `bun --watch`.

## Deployment

### Railway (recommended for cloud)

[Railway](https://railway.app) auto-detects the `Dockerfile`.

1. Push repo to GitHub → **New Project** → **Deploy from GitHub repo**.
2. Set env vars in Railway dashboard:

| Variable | Value |
|---|---|
| `PORT` | `3001` |
| `LARTAS_BASE_URL` | `https://api.insw.go.id` |
| `TOKEN` | *(your INSW JWT)* |
| `API_KEY` | *(optional)* |

The service uses the `TOKEN` env var automatically since `token.txt` doesn't exist on Railway.

### Any Docker host

```bash
docker build -t pesisir-api .
docker run -d -p 3001:3001 \
  -e PORT=3001 \
  -e LARTAS_BASE_URL=https://api.insw.go.id \
  -e TOKEN=your-jwt-here \
  pesisir-api
```

Pass `TOKEN` as env var — no file mount needed.

## Updating the Token

**On Railway** — update the `TOKEN` env var in dashboard → redeploy.

**On a VPS** — edit `token.txt` and wait ~1s for hot-reload:

```bash
echo "new-jwt-token" > /app/token.txt
```

Verify:

```bash
curl http://localhost:3001/token-status
```

## Security

- `token.txt` is in `.gitignore` — never committed.
- Full token is never logged.
- `GET /token-status` only returns a masked version.
- Optional `API_KEY` env var protects `/lartas`.
- Run behind a reverse proxy (nginx/Caddy) for TLS in production.

## Project Structure

```
src/
├── server.ts          # Entry point
├── config/index.ts    # Env config loader
├── routes/
│   ├── index.ts       # Router + auth middleware
│   ├── health.ts      # GET /health
│   ├── token-status.ts# GET /token-status
│   └── lartas.ts      # POST /lartas + validation
├── services/
│   └── lartas.ts      # INSW API proxy logic
├── clients/
│   └── http.ts        # HTTP client with timeout + retry
├── utils/
│   ├── logger.ts      # Structured JSON logger
│   ├── token.ts       # Token reader (file + env fallback)
│   └── errors.ts      # AppError + response helpers
└── types/index.ts     # Shared TypeScript types
```
