# Pesisir System Architecture

**Project:** Pesisir - Platform Otomasi Dokumen Pabean  
**Version:** 0.1.0 (Sprint 0)  
**Date:** December 30, 2025

---

## Architecture Overview

Pesisir uses a **monolithic architecture** optimized for solo founder development with rapid iteration and minimal operational complexity.

```
┌─────────────────────────────────────────────────┐
│           Frontend (ClojureScript)              │
│  Re-frame + Reagent + Tailwind CSS             │
│  (SPA running in browser)                       │
└────────────┬────────────────────────────────────┘
             │ HTTP/JSON
┌────────────▼─────────────────────────────────────────┐
│          Ring HTTP Server (port 3000)               │
│                                                      │
│  ┌─────────────────────────────────────────┐        │
│  │  Reitit Router / Routes                 │        │
│  ├─────────────────────────────────────────┤        │
│  │  Middleware Stack:                      │        │
│  │  - CORS                                 │        │
│  │  - JSON parsing/serialization           │        │
│  │  - Exception handling                   │        │
│  │  - Parameters                           │        │
│  └─────────────────────────────────────────┘        │
│                                                      │
│  ┌─────────────────────────────────────────┐        │
│  │  Application Logic (Namespaces)         │        │
│  │                                         │        │
│  │  /routes       → Route handlers         │        │
│  │  /domain       → Business logic         │        │
│  │  /db           → Database operations    │        │
│  │                                         │        │
│  │  Sprint 1: User domain                  │        │
│  │  Sprint 2: Document domain              │        │
│  │  Sprint 3+: Processing domain           │        │
│  └─────────────────────────────────────────┘        │
└────────────┬─────────────────────────────────────────┘
             │ JDBC
┌────────────▼──────────────────────┐
│    PostgreSQL Database             │
│                                    │
│  Tables:                           │
│  - users (authentication)          │
│  - documents (metadata)            │
│  - transactions (audit trail)      │
└────────────────────────────────────┘
```

---

## Technology Decisions

### Why Clojure Full-Stack?

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Backend** | Clojure + Ring + Reitit | REPL-driven development, immutability, Java interop |
| **Frontend** | ClojureScript + Re-frame + Reagent | Same language as backend, time-travel debugging, functional |
| **Database** | PostgreSQL | Free, robust, JSON support, good Clojure ecosystem |
| **Architecture** | Monolith | Simpler for solo founder, easier debugging, easy to split later |
| **Deployment** | Fly.io | Simple, affordable ($30/month), good for Clojure |

### Why Not...?

| Alternative | Why Not |
|-------------|---------|
| **Node.js (JavaScript)** | Require learning 3+ languages (JS, backend, DB) |
| **Python** | Slower development iteration, less immutable defaults |
| **Java** | Verbose, slow development cycle |
| **Microservices** | Too complex for solo founder, operational overhead |
| **Multi-tenant from day 1** | MVP validation more important than multi-tenancy |

---

## API Architecture

### HTTP API Design

All APIs are **REST** with **JSON** request/response bodies.

```
BASE_URL = http://localhost:3000
API_PREFIX = /api/v1  (future, currently /api)
AUTH = JWT Bearer token in Authorization header
```

### Response Format

**Success (2xx):**
```json
{
  "status": "success",
  "data": {...},
  "timestamp": "2025-12-30T08:00:00Z"
}
```

**Error (4xx/5xx):**
```json
{
  "status": "error",
  "error": "error_code",
  "message": "Human readable message",
  "timestamp": "2025-12-30T08:00:00Z"
}
```

### API Routes Structure

```
GET    /health                    → Health check
GET    /                          → API info

POST   /api/auth/register         → User registration (Sprint 1)
POST   /api/auth/login            → User login (Sprint 1)
POST   /api/auth/refresh          → Token refresh (Sprint 1)

POST   /api/documents/upload      → Upload document (Sprint 2)
GET    /api/documents             → List user's documents (Sprint 2)
GET    /api/documents/:id         → Get document metadata (Sprint 3)

POST   /api/documents/:id/process → Start PDF parsing (Sprint 3)
GET    /api/documents/:id/status  → Check processing status (Sprint 3)

GET    /api/documents/:id/review  → Get extracted data (Sprint 4)
PUT    /api/documents/:id/data    → Update extracted data (Sprint 4)

POST   /api/documents/:id/generate → Generate Excel document (Sprint 5)
GET    /api/documents/:id/download → Download generated file (Sprint 5)

POST   /api/payments/top-up       → Request credit top-up (Sprint 6)
GET    /api/transactions          → Transaction history (Sprint 6)
```

---

## Database Schema

### Current Schema (Sprint 0)

```sql
-- Users table
users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  credit_balance BIGINT (initial: 50,000 Rp),
  email_verified BOOLEAN,
  verification_token VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
)

-- Documents table (skeleton)
documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER FK → users,
  original_filename VARCHAR(255),
  file_path VARCHAR(255),
  file_size BIGINT,
  document_type VARCHAR(50),
  status VARCHAR(20) (uploaded, processing, processed, failed),
  extracted_data JSONB,
  confidence_score NUMERIC(3,2),
  processing_error TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
)

-- Transactions table (skeleton)
transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER FK → users,
  transaction_type VARCHAR(20),
  amount BIGINT,
  description TEXT,
  reference_id VARCHAR(255),
  created_at TIMESTAMP
)
```

### Schema Evolution

- **Sprint 1**: User authentication fields added
- **Sprint 2**: Document upload fields complete
- **Sprint 3**: PDF parsing fields complete
- **Sprint 4**: Extracted data structure finalized
- **Sprint 5**: Document generation fields added
- **Sprint 6**: Payment integration fields added

---

## Application Layers

### 1. HTTP/Router Layer (`routes.clj`)
- Request handling
- Parameter validation
- Response formatting
- Route definitions

### 2. Domain Logic Layer (`domain/*.clj`)
- Business rules
- Data validation
- Domain calculations
- No HTTP concerns

### 3. Data Access Layer (`db.clj`)
- Database queries
- CRUD operations
- Query building
- Connection management

### 4. External Services (Future)
- PDF parsing (Spring 3)
- Excel generation (Sprint 5)
- Payment gateway (Sprint 6)
- Email sending (Sprint 1)

---

## Development Workflow

### Local Development

```
Developer
    ↓
[VS Code + Calva]
    ↓
Clojure REPL
    ↓
[dev-start/dev-reload]
    ↓
Ring HTTP Server
    ↓
Application Code
    ↓
PostgreSQL
```

### Testing

```
TDD Cycle:
1. Write test in REPL
2. Write failing test
3. Implement code
4. Run test → green
5. Refactor
6. Repeat
```

---

## Deployment Architecture (Future - Sprint 8)

```
┌──────────────────────────────────────────────┐
│         GitHub Repository                     │
│  (source code + schema migrations)            │
└────────────────┬─────────────────────────────┘
                 │
                 │ Push to main
                 ↓
        ┌────────────────┐
        │ GitHub Actions │ (CI/CD)
        │ - Run tests    │
        │ - Build JAR    │
        │ - Deploy       │
        └────────┬───────┘
                 │
                 ↓
    ┌────────────────────────────┐
    │     Fly.io Deployment      │
    │                            │
    │  Container:                │
    │  - Clojure app JAR        │
    │  - Environment vars        │
    │  - Port 3000               │
    └────────────┬───────────────┘
                 │
        ┌────────▼────────┐
        │  PostgreSQL DB   │
        │  (managed)       │
        └──────────────────┘
```

---

## Performance Considerations

### Current (Sprint 0-2)
- Single-threaded processing
- Simple in-memory caching
- No optimization needed yet

### Future (Sprint 3+)
- PDF parsing → async with core.async
- Batch document processing
- Database query optimization (indexes)
- Caching layer (possibly Redis)
- CDN for static assets (if needed)

---

## Security Architecture

### Authentication (Sprint 1)
- JWT tokens (Buddy library)
- Password hashing (bcrypt)
- Token expiration (configurable)
- CORS protection

### Authorization (Sprint 1+)
- User can only access own documents
- Admin role (future)
- Rate limiting (future)

### Data Protection
- HTTPS only in production
- Secrets in environment variables
- SQL prepared statements (via JDBC)
- Input validation

### Audit Trail
- Transaction table logs all actions
- Soft deletes (deleted_at field)
- Timestamp tracking (created_at, updated_at)

---

## Error Handling Strategy

### Error Types

1. **User Errors** (4xx) - Client responsibility
   - Invalid input
   - Unauthorized
   - Not found

2. **Server Errors** (5xx) - Server responsibility
   - Database connection failed
   - PDF parsing error
   - Unexpected exception

### Error Response

```json
{
  "status": "error",
  "error": "validation_error",
  "message": "Email is required",
  "details": {...}
}
```

---

## Scalability Notes

### Current Limitations (Solo Founder)
- Single server instance
- In-memory caching not distributed
- No load balancing
- Synchronous PDF parsing

### How to Scale (Future)
1. Add read replicas to PostgreSQL
2. Implement Redis for caching
3. Move to async PDF processing
4. Split into services if needed
5. Add CDN for static files
6. Implement job queue (Goose/RabbitMQ)

---

## Monitoring & Logging

### Current (Sprint 0)
- Timbre structured logging
- Console output
- Basic error logging

### Future (Sprint 8)
- Sentry for error tracking
- LogTail for log aggregation
- Prometheus for metrics
- Grafana for visualization

---

## Local Development Setup

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup instructions.

Key files:
- `deps.edn` - Dependencies
- `resources/config.edn` - Configuration
- `.env.local` - Environment variables (gitignored)
- `db/migrations/` - Database schema

---

## Architectural Decisions (ADRs)

### ADR-001: Monolith vs Microservices
**Decision:** Start with monolith  
**Rationale:** Solo founder needs simplicity and fast iteration  
**When to reconsider:** After 1000+ users or architectural bottleneck found

### ADR-002: PostgreSQL vs Datomic
**Decision:** Use PostgreSQL  
**Rationale:** Free, simpler ops, good Clojure support  
**When to reconsider:** If time-travel queries become critical

### ADR-003: JWT vs Session-based auth
**Decision:** Use JWT  
**Rationale:** Stateless, easier to scale, SPA-friendly  
**When to reconsider:** If token revocation becomes important issue

---

## Future Architecture Improvements

1. **Separate Worker Service** - Move PDF parsing to background worker
2. **Event-Driven Architecture** - Use event sourcing for transactions
3. **GraphQL API** - Add GraphQL for complex queries (optional)
4. **Multi-tenancy** - Add tenant isolation (after MVP validation)
5. **Mobile App** - Native iOS/Android (post-MVP)

---

## References

- Clojure: https://clojure.org/
- Ring: https://github.com/ring-clojure/ring
- Reitit: https://metosin.github.io/reitit/
- Pedestal: https://pedestal.io/ (alternative framework)
- PostgreSQL: https://www.postgresql.org/docs/
