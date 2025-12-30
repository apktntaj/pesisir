# Core MVP Features - Document Processing

This document explains the core MVP features that have been implemented, focusing on the actual problem solving (PDF → Excel conversion) rather than authentication and development setup.

## 🎯 Core Value Proposition

**Problem:** PPJK staff spend 10 minutes manually copying data from PDF documents to create customs declarations.

**Solution:** Automated PDF parsing and Excel generation reduces this to 1 minute per document (90% time savings).

## 🏗️ Architecture Overview

```
PDF Upload → Text Extraction → Data Parsing → Excel Generation → Download
   ↓              ↓                 ↓               ↓              ↓
 File I/O     PDFBox           Regex Parser    Apache POI      File Serve
```

## 📦 Core Modules

### 1. Document Model (`pesisir.document.model`)

Defines the domain models and validation:

```clojure
;; Document types
:bill-of-lading     ; BOL - shipping document
:commercial-invoice ; CI - invoice from seller  
:packing-list       ; PL - details of goods

;; Processing statuses
:uploaded → :extracting → :extracted → :parsing → :parsed → :generating → :completed

;; Output types
:bc-1-1  ; Manifest
:bc-2-3  ; Import Declaration for Temporary Storage
:bc-3-0  ; Transit/Transshipment Declaration
```

### 2. PDF Parser (`pesisir.document.pdf-parser`)

Extracts text from searchable PDF files using Apache PDFBox:

```clojure
(extract-text-from-pdf "path/to/file.pdf")
;; => {:success true 
;;     :text "extracted text..."
;;     :page-count 3
;;     :text-length 1024}

(validate-pdf "path/to/file.pdf")
;; => {:valid true}

(extract-metadata "path/to/file.pdf")
;; => {:title "Bill of Lading"
;;     :author "Shipping Company"
;;     :page-count 2
;;     ...}
```

### 3. Data Parser (`pesisir.document.data-parser`)

Extracts structured data from raw text using regex patterns:

```clojure
;; Parse Bill of Lading
(parse-bill-of-lading text)
;; => {:document-type :bill-of-lading
;;     :bl-number "MAEU123456789"
;;     :vessel-name "MAERSK EDINBURGH"
;;     :voyage-number "123W"
;;     :port-of-loading "SINGAPORE"
;;     :port-of-discharge "JAKARTA"
;;     :container-numbers ["ABCD1234567" "EFGH7654321"]
;;     ...}

;; Parse Commercial Invoice
(parse-commercial-invoice text)
;; => {:document-type :commercial-invoice
;;     :invoice-number "INV-2024-001"
;;     :seller "Supplier Inc"
;;     :buyer "Buyer Corp"
;;     :total-amount "50000.00"
;;     :currency "USD"
;;     ...}

;; Calculate confidence score
(calculate-confidence-score parsed-data)
;; => 0.85  ; 85% of fields were successfully extracted
```

### 4. Excel Generator (`pesisir.document.excel-generator`)

Generates customs declaration Excel files using Apache POI:

```clojure
;; Generate BC 1.1 (Manifest)
(generate-bc-1-1 bol-data "output/bc-1-1.xlsx")
;; => {:success true :file "output/bc-1-1.xlsx"}

;; Generate BC 2.3 (Import Declaration)
(generate-bc-2-3 ci-data "output/bc-2-3.xlsx")
;; => {:success true :file "output/bc-2-3.xlsx"}

;; Generate BC 3.0 (Transit Document)
(generate-bc-3-0 bol-data "output/bc-3-0.xlsx")
;; => {:success true :file "output/bc-3-0.xlsx"}
```

### 5. Document Service (`pesisir.document.service`)

Orchestrates the complete workflow:

```clojure
;; Complete workflow: upload → extract → parse → generate
(process-and-generate! 
  user-id
  file-data
  "invoice.pdf"
  :commercial-invoice  ; document type
  :bc-2-3)            ; customs type to generate

;; => {:success true
;;     :document {...}
;;     :parsed-data {...}
;;     :confidence 0.85
;;     :excel-path "outputs/customs_bc-2-3_123_1735587000000.xlsx"}
```

## 🔌 API Endpoints

### Upload and Process Document

**Complete workflow in one request:**

```bash
POST /api/documents/upload
Content-Type: multipart/form-data

Form Data:
  - file: [PDF file]
  - document-type: "bill-of-lading"
  - customs-type: "bc-1-1"

Response:
{
  "success": true,
  "document": {
    "id": 123,
    "original_filename": "bol.pdf",
    "status": "completed",
    "confidence_score": 0.85
  },
  "confidence": 0.85,
  "excel-filename": "customs_bc-1-1_123_1735587000000.xlsx"
}
```

### List User Documents

```bash
GET /api/documents?limit=10&offset=0

Response:
{
  "success": true,
  "documents": [
    {
      "id": 123,
      "original_filename": "bol.pdf",
      "document_type": "bill-of-lading",
      "status": "completed",
      "confidence_score": 0.85,
      "created_at": "2025-12-30T10:00:00Z"
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

### Get Document Details

```bash
GET /api/documents/123

Response:
{
  "success": true,
  "document": {
    "id": 123,
    "original_filename": "bol.pdf",
    "file_size": 102400,
    "document_type": "bill-of-lading",
    "status": "completed",
    "extracted_data": {...},
    "confidence_score": 0.85
  }
}
```

## 🎬 Example Usage Flow

### 1. User uploads a Bill of Lading PDF

```javascript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('document-type', 'bill-of-lading');
formData.append('customs-type', 'bc-1-1');

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});

const result = await response.json();
// result.success === true
// result.excel-filename === "customs_bc-1-1_123_1735587000000.xlsx"
```

### 2. System automatically:

1. **Saves the PDF** to `uploads/` directory
2. **Extracts text** using PDFBox
3. **Parses data** using regex patterns:
   - BL Number: `MAEU123456789`
   - Vessel: `MAERSK EDINBURGH`
   - Port of Loading: `SINGAPORE`
   - Container Numbers: `["ABCD1234567", "EFGH7654321"]`
4. **Generates Excel** BC 1.1 with parsed data
5. **Returns result** with 85% confidence score

### 3. User downloads the Excel file

```javascript
const downloadUrl = `/api/documents/${documentId}/download`;
// Download the generated Excel file
```

## 🧪 Testing

Run tests for core functionality:

```bash
# Test document model
clojure -M:test -m kaocha.cli --focus pesisir.document.model-test

# Test data parser
clojure -M:test -m kaocha.cli --focus pesisir.document.data-parser-test

# Run all tests
clojure -M:test
```

## 🚀 What's Different from Original Plan?

### ❌ Removed (Deferred to later):
- Complex authentication system (use simple auth for MVP)
- Email verification flow
- Password reset flow
- Extensive SDLC documentation
- Sprint planning overhead

### ✅ Added (Core MVP):
- **PDF text extraction** (Apache PDFBox)
- **Data parsing** (regex-based, good enough for MVP)
- **Excel generation** (Apache POI)
- **Complete workflow** (upload → process → download)
- **Database tracking** (document status, confidence scores)
- **RESTful API** (simple, focused endpoints)

## 📊 Technical Decisions

### Why Apache PDFBox?
- ✅ Pure Java, works with Clojure
- ✅ No external dependencies
- ✅ Handles text-based PDFs well
- ❌ Doesn't do OCR (defer to Phase 2)

### Why Apache POI?
- ✅ Industry standard for Excel generation
- ✅ Comprehensive API
- ✅ Creates proper .xlsx files
- ✅ Widely used, well documented

### Why Regex Parser?
- ✅ Fast to implement
- ✅ Good enough for structured documents
- ✅ No ML/AI complexity
- ✅ Deterministic and debuggable
- ❌ May need improvement for edge cases (iterate based on user feedback)

## 🎯 Success Metrics

For MVP validation, we track:

1. **Extraction accuracy**: % of fields successfully extracted
2. **Confidence score**: 0.0 - 1.0 (aim for >0.8)
3. **Processing time**: < 5 seconds per document
4. **User feedback**: Manual corrections needed per document

## 🔄 Iteration Plan

### Phase 1: MVP (Current)
- ✅ Basic PDF text extraction
- ✅ Regex-based parsing
- ✅ Excel generation
- ✅ Status tracking

### Phase 2: Improvements
- [ ] Improve regex patterns based on real data
- [ ] Add document review/edit UI
- [ ] Better error messages
- [ ] Batch processing

### Phase 3: Advanced
- [ ] OCR for scanned PDFs
- [ ] ML-based data extraction
- [ ] Custom templates
- [ ] Multi-language support

## 🎓 Lessons Learned

1. **Start with the core problem**: Users need PDF → Excel, not auth flows
2. **Use existing libraries**: PDFBox + POI = problem solved in days, not months
3. **Regex is good enough**: Don't over-engineer with ML when regex works
4. **Defer non-essentials**: Authentication can be simple for MVP
5. **Focus on user value**: 90% time savings is the metric that matters

## 📝 Notes

- Current implementation supports **searchable PDFs only**
- OCR for scanned documents is **deferred to Phase 2**
- Regex patterns may need **fine-tuning** based on real documents
- Excel templates are **simplified** - can be enhanced based on feedback
- Authentication is **kept simple** - existing system can be used or simplified further

---

**Remember:** The goal is to validate that users want automated PDF → Excel conversion, not to build a perfect system from day one. Ship fast, get feedback, iterate.
