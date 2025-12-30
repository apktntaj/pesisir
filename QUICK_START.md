# Quick Start Example

This guide shows how to use the core MVP features with minimal setup.

## Prerequisites

- PostgreSQL running
- Database configured (see DEVELOPMENT.md)

## Start the Server

```bash
# Option 1: Using Clojure CLI
clojure -M -m pesisir.core 3000

# Option 2: Using REPL (recommended for development)
# Start REPL, then:
(dev-start)
```

## Test the API

### 1. Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-12-30T19:00:00Z"
}
```

### 2. Register a User (if needed)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "securepassword123"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "test@example.com",
    "full_name": "Test User"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Save the token for subsequent requests!

### 3. Upload and Process a Document

**Prepare a test file:**

Create a simple text file `test-bol.pdf` with Bill of Lading content:

```
B/L Number: MAEU123456789
Vessel: MAERSK EDINBURGH
Voyage: 123W
Port of Loading: SINGAPORE
Port of Discharge: JAKARTA, INDONESIA
Shipper: ABC Trading Company Ltd
Consignee: XYZ Import Export Corp
Date of Issue: 15/12/2024

Container Numbers:
ABCD1234567
EFGH7654321
```

**Upload via API:**

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@test-bol.pdf" \
  -F "document-type=bill-of-lading" \
  -F "customs-type=bc-1-1"
```

Expected response:
```json
{
  "success": true,
  "document": {
    "id": 1,
    "original_filename": "test-bol.pdf",
    "document_type": "bill-of-lading",
    "status": "completed",
    "confidence_score": 0.85,
    "created_at": "2025-12-30T19:05:00Z"
  },
  "confidence": 0.85,
  "excel-filename": "customs_bc-1-1_1_1735587000000.xlsx"
}
```

### 4. List Your Documents

```bash
curl http://localhost:3000/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected response:
```json
{
  "success": true,
  "documents": [
    {
      "id": 1,
      "original_filename": "test-bol.pdf",
      "document_type": "bill-of-lading",
      "status": "completed",
      "confidence_score": 0.85,
      "created_at": "2025-12-30T19:05:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### 5. Get Document Details

```bash
curl http://localhost:3000/api/documents/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected response:
```json
{
  "success": true,
  "document": {
    "id": 1,
    "original_filename": "test-bol.pdf",
    "file_size": 1024,
    "document_type": "bill-of-lading",
    "status": "completed",
    "extracted_data": {
      "raw-text": "B/L Number: MAEU123456789...",
      "parsed": {
        "document-type": "bill-of-lading",
        "bl-number": "MAEU123456789",
        "vessel-name": "MAERSK EDINBURGH",
        "voyage-number": "123W",
        "port-of-loading": "SINGAPORE",
        "port-of-discharge": "JAKARTA",
        "container-numbers": ["ABCD1234567", "EFGH7654321"]
      }
    },
    "confidence_score": 0.85
  }
}
```

### 6. Download Generated Excel

The Excel file is saved in `outputs/` directory:

```bash
# Check the outputs directory
ls -la outputs/

# You should see something like:
# customs_bc-1-1_1_1735587000000.xlsx
```

Open the Excel file to see the generated BC 1.1 (Manifest) document with data automatically filled in!

## Document Types Supported

### Bill of Lading (BOL)
```bash
-F "document-type=bill-of-lading"
-F "customs-type=bc-1-1"  # or bc-3-0
```

### Commercial Invoice (CI)
```bash
-F "document-type=commercial-invoice"
-F "customs-type=bc-2-3"
```

### Packing List (PL)
```bash
-F "document-type=packing-list"
-F "customs-type=bc-2-3"  # or bc-1-1
```

## What Happens Behind the Scenes

When you upload a document:

1. **File Upload** → Saved to `uploads/` directory
2. **PDF Extraction** → Apache PDFBox extracts text
3. **Data Parsing** → Regex patterns extract structured data:
   - BL Number: `MAEU123456789`
   - Vessel: `MAERSK EDINBURGH`
   - Ports: `SINGAPORE → JAKARTA`
   - Containers: `["ABCD1234567", "EFGH7654321"]`
4. **Confidence Scoring** → Calculate % of fields extracted (0.85 = 85%)
5. **Excel Generation** → Apache POI creates XLSX with parsed data
6. **Status Update** → Document marked as `completed` in database

Total time: **< 5 seconds** (vs 10 minutes manual work)

## Testing Different Scenarios

### Test with Missing Fields

Create `partial-bol.pdf` with incomplete data:
```
B/L Number: MAEU123456789
Vessel: MAERSK EDINBURGH
```

Upload it and check the confidence score - should be lower (e.g., 0.4 or 40%)

### Test with Commercial Invoice

Create `test-ci.pdf`:
```
Invoice Number: INV-2024-12345
Invoice Date: 01/12/2024
Seller: ABC Supplier Inc
Buyer: XYZ Buyer Corp
Total: USD 50,000.00
Currency: USD
Payment Terms: 30 Days Net
Incoterms: FOB
```

Upload with:
```bash
-F "document-type=commercial-invoice"
-F "customs-type=bc-2-3"
```

## Troubleshooting

### "Database connection failed"
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env.local`
- Run migrations: `psql -f db/migrations/001_initial_schema.sql`

### "Authentication required"
- Make sure you're sending the Bearer token
- Token format: `Authorization: Bearer eyJhbGc...`

### "Processing failed"
- Check the document status: `GET /api/documents/:id`
- Look at `processing_error` field for details
- Check server logs for more info

### "Low confidence score"
- Document may be scanned (OCR not supported in MVP)
- Text format may be different from expected patterns
- Try with searchable PDFs (text-based, not images)

## Next Steps

1. **Test with real PDFs** - Try actual BOL, CI, PL documents
2. **Check accuracy** - Compare generated Excel with expected output
3. **Provide feedback** - Report what works and what needs improvement
4. **Iterate** - We'll improve regex patterns based on real data

## Development Testing

If you're developing, use the REPL for faster iteration:

```clojure
;; In REPL
(require '[pesisir.document.pdf-parser :as pdf])
(require '[pesisir.document.data-parser :as parser])

;; Test PDF extraction
(def result (pdf/extract-text-from-pdf "test-bol.pdf"))
(:text result)

;; Test parsing
(def parsed (parser/parse-bill-of-lading (:text result)))
parsed

;; Test confidence scoring
(parser/calculate-confidence-score parsed)
```

## Performance Metrics

Expected performance for MVP:

- **Upload**: < 1 second
- **Text extraction**: 1-2 seconds
- **Parsing**: < 1 second
- **Excel generation**: 1-2 seconds
- **Total**: < 5 seconds

Compare to **10 minutes manual work** = **~120x faster**!

---

**Remember:** This is an MVP. Focus on validating the core concept works, then iterate based on real user feedback.
