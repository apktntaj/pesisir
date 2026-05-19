# Pesisir API

Lightweight Bun backend service that acts as a gateway for LarTas/government API communication. Decouples token management from the Next.js frontend deployment lifecycle.

## Architecture

```
Client (Browser)
    │
    ▼
Next.js on Vercel
    │  POST /lartas { method, path, body }
    ▼
Pesisir API (VPS)
    │  GET/POST with Bearer token
    ▼
LarTas Government API
```

- Token is stored in `token.txt` (never committed).
- Service reads the token dynamically on each request.
- Token file updates take effect immediately — no restart needed.
- Frontend never needs redeployment when the token changes.

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

Proxies a request to the LarTas API using the stored bearer token.

**Request body:**

```json
{
  "method": "GET",
  "path": "/api/shipments",
  "params": { "page": "1", "limit": "10" },
  "body": null
}
```

| Field    | Type     | Required | Description                         |
|----------|----------|----------|-------------------------------------|
| method   | string   | yes      | HTTP method (GET, POST, PUT, PATCH, DELETE) |
| path     | string   | yes      | Path on the LarTas API              |
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
| LARTAS_BASE_URL     | https://api.lartas.go.id    | Government API base URL                      |
| TOKEN_FILE_PATH     | ./token.txt                 | Path to the bearer token file                |
| REQUEST_TIMEOUT_MS  | 30000                       | Timeout in ms for external requests          |
| MAX_RETRIES         | 3                           | Number of retries for failed requests        |
| LOG_LEVEL           | info                        | Log level (debug, info, warn, error)         |
| API_KEY             | (empty)                     | Optional shared secret for /lartas auth      |

### Token File

Create `token.txt` in the project root with your LarTas bearer token:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The service reads this file on every request. Changes take effect immediately — no restart needed.

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

## Updating the Token

1. Extract the new token from browser devtools (Network tab → any LarTas request → Authorization header).
2. SSH into your VPS or edit the file directly:
```bash
echo "new-token-value" > /opt/pesisir-api/token.txt
```
3. Done. No restart needed. The next request will pick up the new token.

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
