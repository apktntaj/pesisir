# Pesisir Development Guide

**Project:** Pesisir - Platform Otomasi Dokumen Pabean  
**Version:** 0.1.0 (Sprint 0)  
**Last Updated:** December 30, 2025

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation & Setup](#installation--setup)
3. [Project Structure](#project-structure)
4. [Running the Application](#running-the-application)
5. [REPL Workflow](#repl-workflow)
6. [Running Tests](#running-tests)
7. [Common Development Tasks](#common-development-tasks)
8. [Database Management](#database-management)
9. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Essential
- **Java 21 LTS** - Required for Clojure runtime
  - Check: `java -version`
  - Download: https://adoptopenjdk.net/ or `brew install openjdk@21`

- **Clojure CLI Tools** - Required for dependency management
  - Check: `clojure --version`
  - Install: https://clojure.org/guides/install_clojure

- **Git** - Required for version control
  - Check: `git --version`

- **PostgreSQL 14+** - Database server
  - Option 1: Native install - https://www.postgresql.org/download/
  - Option 2: Docker - `docker run --name pesisir-db -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres`

### Recommended Tools
- **VS Code** + **Calva extension** (Clojure IDE integration)
  - Calva extension ID: `betterthantomorrow.calva`
  - Provides REPL integration, syntax highlighting, format on save

- **pgAdmin** or **DBeaver** - Database GUI (optional but helpful)

- **Postman** or **curl** - API testing

---

## Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/pesisir.git
cd pesisir
```

### 2. Setup Database

#### Option A: Docker (Recommended for quick start)

```bash
# Start PostgreSQL container
docker run --name pesisir-db \
  -e POSTGRES_PASSWORD=dev \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps | grep pesisir-db

# Create database and user
docker exec -it pesisir-db psql -U postgres -c "CREATE DATABASE pesisir_dev;"
docker exec -it pesisir-db psql -U postgres -c "CREATE USER pesisir WITH PASSWORD 'dev';"
docker exec -it pesisir-db psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE pesisir_dev TO pesisir;"
```

#### Option B: Native PostgreSQL Install

```bash
# Create database
createdb pesisir_dev

# Create user
psql -U postgres -c "CREATE USER pesisir WITH PASSWORD 'dev';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE pesisir_dev TO pesisir;"
```

### 3. Run Database Migrations

```bash
# Apply initial schema
psql -U pesisir -d pesisir_dev -f db/migrations/001_initial_schema.sql
```

### 4. Setup Environment

Create `.env.local` file in project root (this file is gitignored):

```bash
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/pesisir_dev?user=pesisir&password=dev
DATABASE_USER=pesisir
DATABASE_PASSWORD=dev

# Server
PORT=3000
ENVIRONMENT=development

# JWT (change in production!)
JWT_SECRET=dev-secret-key-change-in-production

# Email (optional for development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@pesisir.app
```

### 5. Download Dependencies

```bash
clojure -M -e "(println (str \"Clojure version: \" (clojure-version)))"
```

This will download all dependencies defined in `deps.edn`.

---

## Project Structure

```
pesisir/
├── src/pesisir/                    # Source code
│   ├── core.clj                   # Main entry point
│   ├── server.clj                 # HTTP server setup
│   ├── routes.clj                 # API route handlers
│   ├── db.clj                     # Database utilities
│   └── domain/                    # Domain logic (future)
│       ├── user.clj               # User domain (Sprint 1)
│       └── document.clj           # Document domain (Sprint 2+)
│
├── test/pesisir/                   # Tests
│   ├── core_test.clj              # Core tests
│   └── domain/                    # Domain tests
│
├── resources/                      # Resources
│   └── config.edn                 # Configuration
│
├── db/migrations/                  # Database migrations
│   └── 001_initial_schema.sql    # Initial schema
│
├── dev/                            # Development utilities
│
├── deps.edn                        # Dependency management
├── tests.edn                       # Test configuration
├── DEVELOPMENT.md                  # This file
└── ARCHITECTURE.md                 # System architecture
```

---

## Running the Application

### Option 1: Using CLI (Production-like)

```bash
# Build and run
clojure -M -m pesisir.core 3000

# The server should start on http://localhost:3000
# You should see: "Pesisir is running!"
```

### Option 2: Using REPL (Development - Recommended)

If using **VS Code + Calva**:

1. Open VS Code in the project directory
2. Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
3. Type "Calva: Start a Project REPL and Connect"
4. Wait for REPL to start

In the REPL, run:

```clojure
(dev-start)
```

You should see:
```
Starting server on port 3000...
Database connection healthy
Server started successfully on port 3000
```

### Verify the Server is Running

In a new terminal:

```bash
# Test health endpoint
curl http://localhost:3000/health
# Expected response: {"status":"healthy",...}

# Test root endpoint
curl http://localhost:3000/
# Expected response: {"message":"Pesisir API","version":"0.1.0"}
```

---

## REPL Workflow

The REPL is your best friend for Clojure development. With Calva + VS Code, you can:

### Starting/Stopping Server

```clojure
; Start server
(dev-start)

; Stop server
(dev-stop)

; Restart server (after code changes)
(dev-restart)
```

### Database Operations

```clojure
; Check database health
(db-health)
; => {:status :healthy :timestamp #inst "..."}

; Get database config
(db-config)

; Query example (after Sprint 1)
(db/query "SELECT * FROM users LIMIT 5")
```

### Evaluating Code

In VS Code + Calva:
- `Ctrl+Alt+C, Ctrl+Alt+K` - Connect to REPL
- `Ctrl+Enter` - Evaluate current expression
- `Alt+Enter` - Evaluate current expression and paste result
- `Ctrl+Shift+P` → "Calva: Load File" - Load current file

### Common REPL Tasks

```clojure
; Test if server is running
(require '[ring.adapter.jetty :as jetty])

; Reload a namespace (after editing)
(require '[pesisir.routes :as routes] :reload)

; Run tests from REPL
(require '[clojure.test :as test]
          '[pesisir.core-test])
(test/run-tests 'pesisir.core-test)
```

---

## Running Tests

### Run All Tests

```bash
# Using Kaocha test runner
clojure -M:test -m kaocha.cli

# Or shorter:
clojure -M:test
```

### Run Specific Test

```bash
# Run a specific test file
clojure -M:test -m kaocha.cli test/pesisir/core_test.clj

# Run a specific test function
clojure -M:test -m kaocha.cli --focus pesisir.core-test/health-check-test
```

### Run Tests with Coverage

```bash
clojure -M:test -m kaocha.cli --plugin kaocha.plugin/cloverage
```

---

## Common Development Tasks

### Editing and Reloading Code

With REPL (recommended):

```clojure
; Edit a file in your editor
; Then in REPL, reload the namespace:
(require '[pesisir.routes :as routes] :reload)

; Or reload all namespaces:
(require '[pesisir.core :as core] :reload-all)
```

### Checking Code Syntax

```bash
# Clojure can't catch all syntax errors until runtime,
# but your IDE should highlight them.
# To validate:
clojure -M -e "(do)" 2>&1 | head -10
```

### Formatting Code

There's no automatic formatter configured yet. Consider adding:
- `cljfmt` - Clojure formatter
- Setup in your IDE to format on save

### Building for Production

```bash
# Create JAR file (when needed)
# This is handled by build tool (to be configured)
```

---

## Database Management

### Connect to Database

Using `psql`:

```bash
# Using .env values
psql -U pesisir -d pesisir_dev -h localhost

# Or with explicit password
PGPASSWORD=dev psql -U pesisir -d pesisir_dev -h localhost
```

### View Database Schema

```sql
-- In psql:
\dt                    -- Show all tables
\d users               -- Show users table structure
\d documents           -- Show documents table structure
\d transactions        -- Show transactions table structure
```

### Reset Database (Development Only!)

```bash
# Drop all tables (careful!)
psql -U pesisir -d pesisir_dev -f db/migrations/001_initial_schema.sql

# Or from command line:
dropdb -U postgres pesisir_dev
createdb -U postgres pesisir_dev
psql -U pesisir -d pesisir_dev -f db/migrations/001_initial_schema.sql
```

### Backup Database

```bash
# Backup to SQL file
pg_dump -U pesisir -d pesisir_dev > pesisir_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U pesisir -d pesisir_dev < pesisir_backup_20251230_120000.sql
```

---

## Troubleshooting

### "Connection refused" error

```
Error: FATAL: Ident authentication failed for user "pesisir"
```

**Solution:**
1. Check PostgreSQL is running: `psql -U postgres`
2. Check user exists: `psql -U postgres -l` (should show pesisir_dev)
3. Reset user password: `ALTER USER pesisir WITH PASSWORD 'dev';`

### "Database pesisir_dev does not exist"

**Solution:**
```bash
createdb -U postgres pesisir_dev
```

### "Could not find or load main class clojure.main"

**Solution:**
```bash
# Update Clojure:
clojure -Sdescribe

# If that doesn't work, reinstall:
# macOS:
brew upgrade clojure

# Linux:
# Follow https://clojure.org/guides/install_clojure
```

### REPL not connecting in VS Code

**Solution:**
1. Check Calva is installed: Extensions → Search "Calva"
2. Check Java 21 is available: `java -version`
3. Restart VS Code
4. Try again: Ctrl+Shift+P → "Calva: Start Project REPL"

### "Address already in use" on port 3000

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port:
(dev-start 8080)
```

### Tests failing with "Unknown host: localhost"

**Solution:**
1. Make sure database is running
2. Check DATABASE_URL in .env.local
3. Verify database exists: `psql -l | grep pesisir_dev`

---

## Next Steps

After Sprint 0 setup is complete:

1. **Sprint 1** - Implement authentication (register/login)
2. **Sprint 2** - Implement file upload
3. **Sprint 3** - Implement PDF parsing

See [SPRINT_0_EXECUTION.md](SPRINT_0_EXECUTION.md) for detailed Sprint 0 tasks.

---

## Additional Resources

- [Clojure Official Site](https://clojure.org/)
- [Ring HTTP Server](https://github.com/ring-clojure/ring)
- [Reitit Routing](https://metosin.github.io/reitit/)
- [Calva Documentation](https://calva.io/)
- [JDBC for Clojure](https://github.com/clojure/java.jdbc)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## Contributing

When making changes:

1. Create a branch: `git checkout -b feature/your-feature`
2. Write tests first (TDD approach)
3. Run tests: `clojure -M:test`
4. Commit with clear messages
5. Push and create Pull Request

See [README.md](README.md) for more info.
