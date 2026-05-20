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
Pesisir API (VPS)
    │  GET/POST with Basic token + INSW headers
    ▼
api.insw.go.id
```

- Token is stored in `token.txt` (never committed).
- Service reads the token dynamically on each request.
- Token file updates take effect immediately — no restart needed.
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

## Setup

### Prerequisites

- [Bun](https://bun.sh) v1.2 or later

### Installation

```bash
git clone <repo-url>
cd pesisir-api
bun install
cp .env.example .env
```

### Configuration

Edit `.env`:

| Variable            | Default                     | Description                                  |
|---------------------|-----------------------------|----------------------------------------------|
| PORT                | 3001                        | Server port                                  |
| HOST                | 0.0.0.0                     | Server bind address                          |
| LARTAS_BASE_URL     | https://api.insw.go.id    | INSW API base URL                            |
| TOKEN_FILE_PATH     | ./token.txt                 | Path to the token file                       |
| TOKEN               | (empty)                     | Fallback token value (used when file missing) |
| REQUEST_TIMEOUT_MS  | 30000                       | Timeout in ms for external requests          |
| MAX_RETRIES         | 3                           | Number of retries for failed requests        |
| LOG_LEVEL           | info                        | Log level (debug, info, warn, error)         |
| API_KEY             | (empty)                     | Optional shared secret for /lartas auth      |

### Token File

Create `token.txt` in the project root with your INSW JWT token (the raw JWT after the `Basic ` prefix):

```
eyJhbGciOiJSUzI1NiIsInR5cCI6ImJzYStqd3QiLCJraWQiOiJYU1N0SFVmeGI1...
```

The service reads this file on every request and sends it as `Authorization: Basic <token>`. Changes take effect immediately — no restart needed.

**Never commit `token.txt`** (it's already in `.gitignore`).

### Development

```bash
bun run dev
```

Starts the server with hot-reload via `bun --watch`.

### Production

```bash
bun run start
```

## Deployment

### Systemd (Recommended)

1. Copy the service file:
```bash
sudo cp pesisir-api.service /etc/systemd/system/
```

2. Edit the service file to match your paths:
   - `WorkingDirectory` — path to your project
   - `EnvironmentFile` — path to your `.env`
   - `ExecStart` — path to bun binary and server.ts

3. Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable pesisir-api
sudo systemctl start pesisir-api
```

4. Check status:
```bash
sudo systemctl status pesisir-api
sudo journalctl -u pesisir-api -f
```

### PM2

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Create log and pid directories:
```bash
mkdir -p logs pids
```

3. Start:
```bash
pm2 start pm2.config.js
pm2 save
pm2 startup
```

### GitHub Auto-Deploy

Add a GitHub Actions workflow to SSH into your VPS and pull/restart:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/pesisir-api
            git pull origin main
            bun install
            sudo systemctl restart pesisir-api
```

### Docker

Build and run with Docker:

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

### Railway

[Railway](https://railway.app) supports Dockerfiles natively.

1. Push your repo to GitHub.
2. In Railway dashboard, click **New Project** → **Deploy from GitHub repo**.
3. Railway auto-detects the `Dockerfile`.
4. Set these environment variables in Railway dashboard:

| Variable | Value |
|---|---|
| `PORT` | `3001` |
| `LARTAS_BASE_URL` | `https://api.insw.go.id` |
| `TOKEN` | *(your INSW JWT token)* |
| `API_KEY` | *(optional shared secret)* |

> Railway uses the `PORT` env var to route traffic — make sure it matches `3001`.

The service will use the `TOKEN` env var since `token.txt` doesn't exist in Railway's filesystem.

No `railway.json` needed — the existing `Dockerfile` handles everything.

## Updating the Token

1. Extract the new token from browser devtools (Network tab → any INSW request → `authorization` header → copy value after `Basic `).
2. SSH into your VPS or edit the file directly:
```bash
echo "new-jwt-token" > /opt/pesisir-api/token.txt
```
3. Done. No restart needed. The next request picks up the new token.

Verify with:
```bash
curl http://localhost:3001/token-status
```

## Security

- `token.txt` is in `.gitignore` and must never be committed.
- The full token is never logged.
- `GET /token-status` only returns a masked version.
- Optional `API_KEY` env var protects the `/lartas` endpoint.
- Run behind a reverse proxy (nginx/Caddy) for TLS termination in production.

## Project Structure

```
src/
├── server.ts          # Entry point — starts Bun HTTP server
├── config/
│   └── index.ts       # Environment configuration loader
├── routes/
│   ├── index.ts       # Router — matches URLs to handlers, auth
│   ├── health.ts      # GET /health handler
│   ├── token-status.ts# GET /token-status handler
│   └── lartas.ts      # POST /lartas handler + validation
├── services/
│   └── lartas.ts      # LarTas API proxy logic
├── clients/
│   └── http.ts        # HTTP client with timeout + retry
├── utils/
│   ├── logger.ts      # Structured JSON logger
│   ├── token.ts       # Token file reader with hot-reload
│   └── errors.ts      # Error types and response helpers
└── types/
    └── index.ts       # Shared TypeScript types
```
