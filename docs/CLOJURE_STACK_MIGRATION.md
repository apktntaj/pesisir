# Clojure Full-Stack Migration Rationale

**Project:** Pesisir - Platform Otomasi Dokumen Pabean  
**Version:** 3.0 (Solo Founder Edition)  
**Date:** December 29, 2025  
**Author:** Solo Founder

---

## Executive Summary

Pesisir telah di-redesign menggunakan **Clojure full-stack** (Clojure + ClojureScript + Datomic) untuk maksimalisasi produktivitas solo founder. Decision ini berdasarkan realitas: **satu developer, limited time, zero team support**.

**Previous Stack (v2.0):** .NET 8.0 + Microservices + SQL Server + Azure services  
**New Stack (v3.0):** Clojure + Ring/Reitit + ClojureScript/Re-frame + Datomic/PostgreSQL

## Why Clojure? (The Solo Founder Perspective)

### 1. Same Language, Less Context Switching

**Problem:** Switching between C# (backend), TypeScript/JavaScript (frontend), SQL (database) = cognitive overhead.

**Solution:** 
- **Backend**: Clojure
- **Frontend**: ClojureScript (compiles to JavaScript)
- **Database queries**: Datalog (Datomic) or Clojure SQL libraries

**Impact:** Write functions in Clojure, reuse them in both frontend and backend. No mental context switch.

```clojure
;; Backend validation function
(defn valid-email? [email]
  (re-matches #".+@.+\..+" email))

;; Same function works in ClojureScript frontend!
;; No need to rewrite in TypeScript
```

### 2. REPL-Driven Development = Faster Iteration

**Problem:** Traditional compile → run → test cycle is slow. Especially painful when solo.

**Solution:** Clojure REPL lets you:
- Write function
- Test it immediately in REPL
- See results in < 1 second
- Modify and re-test without restart

**Real Example:**
```clojure
;; Write in editor
(defn parse-bol-number [text]
  (re-find #"B/L No\.?\s*:\s*([A-Z0-9]+)" text))

;; Test in REPL immediately
(parse-bol-number "B/L No: ABC123")  ;; => "ABC123"

;; Doesn't work? Adjust regex and re-test in 2 seconds
(defn parse-bol-number [text]
  (second (re-find #"B/L No\.?\s*:\s*([A-Z0-9]+)" text)))
```

**vs .NET:** Edit → Build → Run → Debug → Repeat = 30+ seconds per iteration.

### 3. Monolith Over Microservices (Simplicity Wins)

**Previous Design (v2.0):**
- Pesisir.Identity.API
- Pesisir.Shipment.API  
- Pesisir.Document.API
- Pesisir.Notification.API
- API Gateway
- Message Queue
- Multiple Docker containers

**Problem:** Microservices = complexity overhead unsuitable untuk solo founder:
- Multiple repositories or complex monorepo
- Inter-service communication (HTTP, message queues)
- Distributed debugging nightmares
- Deployment complexity (orchestrate multiple services)
- Local development needs 5+ Docker containers

**New Design (v3.0):**
- **Single Clojure application**
- All features dalam one codebase
- One deployment unit
- One database
- Easy to understand, debug, deploy

**Benefits:**
- ✅ Simpler mental model
- ✅ Shared code/utilities easy
- ✅ Database transactions straightforward
- ✅ Single process debugging
- ✅ Deploy satu binary/uberjar

### 4. Datomic: Audit Log Built-In (Perfect for Customs Documents)

**Problem:** Customs documents need audit trail:
- Who uploaded document?
- What data was extracted?
- What was manually edited?
- Who downloaded generated document?

**Traditional SQL Approach:**
```sql
-- Need separate audit tables
CREATE TABLE document_audit (
  id INT,
  document_id INT,
  field_name VARCHAR,
  old_value TEXT,
  new_value TEXT,
  changed_by INT,
  changed_at TIMESTAMP
);

-- Complex triggers or application code
```

**Datomic Approach:**
```clojure
;; Every change is automatically stored with timestamp
;; Query history of any entity at any point in time

;; Get document state as of yesterday
(d/as-of db #inst "2025-12-28")

;; Get all changes to a document
(d/history db)

;; Built-in, zero extra code!
```

**Alternative:** If Datomic too expensive ($50-100/month), PostgreSQL is acceptable fallback.

### 5. Java Interop = Leverage Mature Libraries

**Problem:** PDF parsing dan Excel generation are complex. Building from scratch = months of work.

**Solution:** Clojure runs on JVM → use mature Java libraries:

```clojure
;; Apache PDFBox for PDF parsing
(import '[org.apache.pdfbox.pdmodel PDDocument]
        '[org.apache.pdfbox.text PDFTextStripper])

(defn extract-pdf-text [file-path]
  (with-open [doc (PDDocument/load (io/file file-path))]
    (let [stripper (PDFTextStripper.)]
      (.getText stripper doc))))

;; Apache POI for Excel generation
(import '[org.apache.poi.xssf.usermodel XSSFWorkbook])

(defn generate-excel [data output-path]
  (let [workbook (XSSFWorkbook.)
        sheet (.createSheet workbook "BC 1.1")]
    ;; Populate cells...
    (with-open [out (io/output-stream output-path)]
      (.write workbook out))))
```

**vs Building from Scratch:** Would take weeks/months to build reliable PDF parser. PDFBox = production-ready, battle-tested.

### 6. Simple Deployment (Fly.io = $20-50/month)

**Previous Design:** Azure App Service ($100+/month) + SQL Server ($50+/month) + Azure services ($200+/month)

**New Design:** 
- Fly.io: $20-50/month (includes compute + PostgreSQL database)
- Single uberjar deployment
- Zero Docker complexity (Fly.io handles containers)

**Deployment:**
```bash
# Build uberjar
clj -T:build uber

# Deploy to Fly.io
fly deploy

# Done! (< 2 minutes)
```

**vs .NET Microservices:** Would need:
- Container orchestration (Kubernetes or Docker Compose)
- Multiple container images
- Complex CI/CD pipeline
- Much higher infrastructure cost

### 7. Re-frame: State Management Without Redux Boilerplate

**Frontend State Management:**

**React/Redux Approach (lots of boilerplate):**
```javascript
// Actions
const UPLOAD_FILE = 'UPLOAD_FILE';
const UPLOAD_FILE_SUCCESS = 'UPLOAD_FILE_SUCCESS';
const UPLOAD_FILE_ERROR = 'UPLOAD_FILE_ERROR';

// Action creators
function uploadFile(file) { return { type: UPLOAD_FILE, payload: file }; }
function uploadFileSuccess(data) { return { type: UPLOAD_FILE_SUCCESS, payload: data }; }
function uploadFileError(error) { return { type: UPLOAD_FILE_ERROR, payload: error }; }

// Reducer
function documentsReducer(state = initialState, action) {
  switch (action.type) {
    case UPLOAD_FILE:
      return { ...state, uploading: true };
    // ... more cases
  }
}

// Thunk for async
function uploadFileAsync(file) {
  return async (dispatch) => {
    dispatch(uploadFile(file));
    try {
      const response = await api.uploadFile(file);
      dispatch(uploadFileSuccess(response));
    } catch (error) {
      dispatch(uploadFileError(error));
    }
  };
}
```

**Re-frame Approach (minimal boilerplate):**
```clojure
;; Events (handle actions)
(re-frame/reg-event-fx
 :upload-file
 (fn [{:keys [db]} [_ file]]
   {:http-xhrio {:method :post
                 :uri "/api/documents/upload"
                 :body file
                 :on-success [:upload-file-success]
                 :on-failure [:upload-file-error]}
    :db (assoc db :uploading? true)}))

(re-frame/reg-event-db
 :upload-file-success
 (fn [db [_ response]]
   (-> db
       (assoc :uploading? false)
       (update :documents conj response))))

;; Subscribe (read state)
(re-frame/reg-sub
 :documents
 (fn [db _]
   (:documents db)))

;; Component (use state)
(defn documents-list []
  (let [documents (re-frame/subscribe [:documents])]
    [:div
     (for [doc @documents]
       [:div {:key (:id doc)} (:name doc)])]))
```

**Much cleaner, less boilerplate, easier to reason about.**

## Stack Comparison

| Aspect | .NET Stack (v2.0) | Clojure Stack (v3.0) | Winner |
|--------|-------------------|----------------------|--------|
| **Learning Curve** | Moderate (C#, EF, Blazor) | Steep initially (Lisp syntax) | .NET (short term) |
| **Solo Productivity** | Good | Excellent (REPL) | **Clojure** |
| **Context Switching** | High (C#/JS/SQL) | Low (Clojure everywhere) | **Clojure** |
| **Deployment Complexity** | High (microservices) | Low (monolith) | **Clojure** |
| **Infrastructure Cost** | $300-500/month | $50-100/month | **Clojure** |
| **PDF/Excel Libraries** | EPPlus, iTextSharp | PDFBox, POI (Java) | **Tie** |
| **Built-in Audit Log** | Manual implementation | Datomic (free) | **Clojure** |
| **Community Support** | Large (.NET) | Smaller but high quality | .NET |
| **Hiring Later** | Easy | Harder (fewer Clojure devs) | .NET |
| **Long-term Scaling** | Excellent | Good | .NET |
| **MVP Speed (solo)** | 4-6 months | 3-4 months | **Clojure** |

**Conclusion:** Clojure wins for solo founder MVP. .NET better if building team later.

## What We're Giving Up

**Honest Assessment:**

1. **Smaller Community**: Fewer Stack Overflow answers, fewer libraries
   - **Mitigation**: Core use cases (web, DB) well-supported. Java interop fills gaps.

2. **Hiring Difficulty**: Hard to find Clojure developers
   - **Mitigation**: Not hiring for 12+ months. Can migrate or train later if needed.

3. **Corporate Acceptance**: Some enterprises scared of "exotic" languages
   - **Mitigation**: B2C product, not selling to enterprises initially.

4. **Frontend Ecosystem**: React ecosystem larger than ClojureScript
   - **Mitigation**: Re-frame is mature. Can use React components via interop.

5. **Steeper Learning Curve**: Lisp syntax, functional paradigm
   - **Mitigation**: Solo founder can invest time learning. Pays off in productivity.

## MVP Scope Adjustments (Because Solo)

**What We're Deferring to Post-MVP:**

1. **OCR for Scanned Documents**
   - **Why Defer**: Azure Document Intelligence costs $1-2 per document. Self-hosted OCR complex.
   - **MVP**: Support searchable/text-based PDFs only. Most BOLs are digital nowadays.

2. **WhatsApp Notifications**
   - **Why Defer**: Twilio WhatsApp = $0.005-0.02 per message. Needs approval process.
   - **MVP**: Email notifications only (basically free with SMTP).

3. **Real-time Vessel Tracking**
   - **Why Defer**: MarineTraffic API expensive, complex integration.
   - **MVP**: Users manually input ETA. Good enough for MVP validation.

4. **Multi-tenant Architecture**
   - **Why Defer**: Adds complexity (tenant isolation, billing per tenant, etc.)
   - **MVP**: Single-tenant approach. Each user is isolated by user_id, not tenant_id.
   - **Post-MVP**: Can add tenant grouping later if needed.

5. **Automated Payment Gateway**
   - **Why Defer**: Payment gateway integration takes time. Need business verification.
   - **MVP**: Manual bank transfer + admin approval. Automate later when volume justifies.

## Technical Architecture (Clojure)

### Backend Structure

```
pesisir/
├── src/
│   └── pesisir/
│       ├── core.clj              # Main entry point
│       ├── server.clj            # Ring server setup
│       ├── routes.clj            # API routes (Reitit)
│       ├── middleware.clj        # JWT auth, CORS, etc
│       ├── db.clj                # Database connection
│       ├── auth/
│       │   ├── handlers.clj      # Register, login, JWT
│       │   └── password.clj      # Bcrypt hashing
│       ├── documents/
│       │   ├── handlers.clj      # Upload, process, download
│       │   ├── parser.clj        # PDF parsing (PDFBox)
│       │   ├── extractor.clj     # Data extraction logic
│       │   └── generator.clj     # Excel generation (POI)
│       ├── credits/
│       │   └── handlers.clj      # Balance, transactions
│       └── utils/
│           ├── email.clj         # Send emails
│           └── file.clj          # File operations
├── resources/
│   ├── templates/                # Excel templates
│   └── config.edn                # Configuration
├── test/
│   └── pesisir/                  # Tests mirror src/
└── deps.edn                      # Dependencies
```

### Frontend Structure

```
frontend/
├── src/
│   └── pesisir/
│       ├── core.cljs             # Main entry, mount app
│       ├── events.cljs           # Re-frame events
│       ├── subs.cljs             # Re-frame subscriptions
│       ├── routes.cljs           # Frontend routing
│       ├── db.cljs               # App state structure
│       ├── views/
│       │   ├── login.cljs        # Login page
│       │   ├── register.cljs     # Register page
│       │   ├── dashboard.cljs    # Main dashboard
│       │   ├── upload.cljs       # Upload component
│       │   ├── review.cljs       # Review & edit page
│       │   └── history.cljs      # Document history
│       └── components/
│           ├── navbar.cljs       # Reusable navbar
│           └── file_upload.cljs  # Drag & drop upload
└── shadow-cljs.edn               # ClojureScript build config
```

### Database Schema (Simplified)

**Datomic Schema:**
```clojure
;; User
{:db/ident :user/id
 :db/valueType :db.type/uuid
 :db/cardinality :db.cardinality/one
 :db/unique :db.unique/identity}

{:db/ident :user/email
 :db/valueType :db.type/string
 :db/cardinality :db.cardinality/one
 :db/unique :db.unique/identity}

{:db/ident :user/password-hash
 :db/valueType :db.type/string
 :db/cardinality :db.cardinality/one}

{:db/ident :user/credit-balance
 :db/valueType :db.type/long
 :db/cardinality :db.cardinality/one}

;; Document
{:db/ident :document/id
 :db/valueType :db.type/uuid
 :db/cardinality :db.cardinality/one
 :db/unique :db.unique/identity}

{:db/ident :document/user
 :db/valueType :db.type/ref
 :db/cardinality :db.cardinality/one}

{:db/ident :document/filename
 :db/valueType :db.type/string
 :db/cardinality :db.cardinality/one}

{:db/ident :document/status
 :db/valueType :db.type/keyword
 :db/cardinality :db.cardinality/one}  ;; :pending, :processing, :completed

;; Extracted data stored as map or separate entities
{:db/ident :document/extracted-data
 :db/valueType :db.type/string  ;; JSON or EDN
 :db/cardinality :db.cardinality/one}
```

**PostgreSQL Alternative (if budget constrained):**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  credit_balance INTEGER DEFAULT 50000,  -- in Rupiah
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  filename VARCHAR(255),
  file_path VARCHAR(500),
  status VARCHAR(50),  -- pending, processing, completed, failed
  extracted_data JSONB,  -- Store as JSON
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount INTEGER,  -- in Rupiah
  type VARCHAR(50),  -- debit (usage) or credit (topup)
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Development Workflow

### Day-to-Day Solo Founder Workflow

**Morning (9am-12pm): Focus Block**
```bash
# Start REPL
clj -M:dev

# Load namespace
(require '[pesisir.documents.parser :as parser] :reload)

# Work on PDF parsing
(parser/extract-bol-number sample-text)  ;; Test in REPL

# Adjust function, re-evaluate, test again
# No compile/restart needed!

# Write tests
(require '[clojure.test :refer [deftest is]])
(deftest test-extract-bol-number
  (is (= "ABC123" (parser/extract-bol-number "B/L No: ABC123"))))

# Run tests
(clojure.test/run-tests 'pesisir.documents.parser-test)
```

**Afternoon (1pm-4pm): Feature Implementation**
```bash
# Frontend development
cd frontend
npx shadow-cljs watch app  # Auto-reload on save

# Edit ClojureScript files
# Save → Browser auto-reloads → See changes immediately

# REPL in browser console
js/console.log(cljs.user.app_state)
```

**Evening (7pm-9pm): Deploy & Test**
```bash
# Run tests
clj -M:test

# Build uberjar
clj -T:build uber

# Deploy to staging
fly deploy --config fly.staging.toml

# Smoke test staging
curl https://staging.pesisir.app/health

# If good, deploy to production
fly deploy --config fly.production.toml
```

### Sprint Cadence (3 weeks)

**Week 1:** Focus on implementation
- Build main feature
- REPL-driven development
- Write tests as you go

**Week 2:** Polish & integration
- Integrate frontend & backend
- Fix bugs
- Edge case handling

**Week 3:** Testing & deployment
- Manual testing
- Beta user feedback (if available)
- Deploy to production
- Sprint retrospective
- Plan next sprint

## Success Metrics

**MVP Launch (Sprint 8, Week 24):**
- ✅ Users can register and login
- ✅ Upload PDF documents (searchable PDFs)
- ✅ System extracts data (80%+ accuracy)
- ✅ Users can review and edit data
- ✅ Generate BC 1.1, BC 2.3, BC 3.0 Excel files
- ✅ Download generated documents
- ✅ Credit system working
- ✅ Manual payment confirmation
- ✅ Deployed to production (Fly.io)
- ✅ 5-10 beta users actively using

**3 Months Post-Launch:**
- 🎯 30-50 active users
- 🎯 $5-10 million Rupiah revenue (validate willingness-to-pay)
- 🎯 90%+ data extraction accuracy (with user feedback)
- 🎯 <5% error rate (bugs/crashes)
- 🎯 Positive user testimonials

**6 Months Post-Launch:**
- 🎯 100+ active users
- 🎯 $20-30 million Rupiah revenue
- 🎯 Product-market fit validated
- 🎯 Decide: Continue solo or start hiring

## Decision: Commit to Clojure

**Final Decision:** YES, commit to Clojure full-stack.

**Reasons:**
1. ✅ Solo founder productivity > team scalability (at this stage)
2. ✅ REPL-driven development = faster iteration
3. ✅ Same language frontend/backend = less context switching
4. ✅ Monolith simplicity > microservices complexity
5. ✅ Lower infrastructure costs ($50 vs $300/month)
6. ✅ Datomic audit log perfect for document tracking
7. ✅ Can migrate later if needed (but likely won't need to)

**Risks Accepted:**
- ⚠️ Smaller community (acceptable for MVP)
- ⚠️ Hiring harder later (cross bridge when we get there)
- ⚠️ Steeper learning curve (solo founder can invest time)

**Commitment:**
- 📅 Stick with Clojure for entire MVP (24 weeks)
- 📅 Re-evaluate after MVP launch
- 📅 If product fails, it won't be because of tech stack
- 📅 If product succeeds, Clojure will have been a major contributor

---

**Let's build this! 🚀 Make 2026 productive! 🎯**

**Next Steps:**
1. ✅ Update all documentation (DONE)
2. ⏭️ Setup Clojure development environment (Sprint 1, Week 1)
3. ⏭️ Build MVP one sprint at a time
4. ⏭️ Ship early, ship often, get user feedback
5. ⏭️ Iterate based on real usage

**Remember:** 
- Focus on MVP scope (no feature creep!)
- Sustainable pace (3-week sprints with buffer)
- Quality > speed (maintainable code for solo founder)
- Deploy every sprint (get feedback early)
- Celebrate small wins (avoid burnout)

---

*"Premature optimization is the root of all evil. Premature scaling is even worse."* - Solo Founder Wisdom

**Sprint 1 starts January 2026. Let's make it count! 💪**
