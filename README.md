# Pesisir - Platform Otomasi Dokumen Pabean

[![SDLC Phase](https://img.shields.io/badge/Phase-MVP%20Development-green.svg)]()
[![Focus](https://img.shields.io/badge/Focus-Core%20Features-orange.svg)]()
[![Tech Stack](https://img.shields.io/badge/Clojure-Full%20Stack-blue.svg)]()

## 📋 Overview

Pesisir adalah platform digital yang membantu staff PPJK (Perusahaan Pengurusan Jasa Kepabeanan) mengotomasi pembuatan draft dokumen pabean. Platform ini menggunakan teknologi PDF parsing untuk mengekstrak data dari dokumen PDF dan secara otomatis menghasilkan draft dokumen pabean yang siap digunakan.

**Core Value Proposition:**
- ⏱️ Reduce document processing time from 10 minutes to 1 minute (90% faster)
- 📄 Automated PDF → Excel conversion for customs declarations
- 🎯 Focus on solving the actual problem first, infrastructure second

## 🚀 Core MVP Features (Implemented)

### What's Working Now

✅ **PDF Text Extraction** - Upload PDF and extract text automatically  
✅ **Data Parsing** - Extract structured data (BL numbers, vessel names, ports, etc.)  
✅ **Excel Generation** - Generate BC 1.1, BC 2.3, BC 3.0 customs documents  
✅ **Complete Workflow** - Upload → Extract → Parse → Generate in one API call  
✅ **Status Tracking** - Track document processing status and confidence scores  

### Quick Start

```bash
# 1. Upload a Bill of Lading PDF and generate BC 1.1 Manifest
POST /api/documents/upload
  - file: bol.pdf
  - document-type: bill-of-lading
  - customs-type: bc-1-1

# 2. Get the generated Excel file
GET /api/documents/:id/download
```

**See [CORE_MVP_FEATURES.md](CORE_MVP_FEATURES.md) for detailed documentation.**

## 🎯 What Changed?

### Old Approach (Too Much Planning)
- ❌ Extensive authentication system first
- ❌ Complex sprint planning documents
- ❌ Development setup before features
- ❌ Focus on process over product

### New Approach (Core MVP First)
- ✅ Build the core feature: PDF → Excel conversion
- ✅ Use simple authentication (existing or basic)
- ✅ Validate the solution works before scaling
- ✅ Focus on user value: 90% time savings

## 📚 Documentation

### Core Features (Start Here!)
- **[CORE_MVP_FEATURES.md](CORE_MVP_FEATURES.md)** - How to use the PDF → Excel conversion features
  - API documentation
  - Code examples
  - Testing guide

### Architecture & Planning (Reference)


- **[prd.md](docs/prd.md)** - **Product Requirements Document (v2.0 - Agile Edition)**:
  - Product vision dan objectives
  - User personas dan user goals
  - Functional requirements dengan acceptance criteria
  - **NEW: Agile Sprint Planning (6 sprints)**
  - **NEW: Product Backlog dengan MoSCoW prioritization**
  - **NEW: Story points estimation untuk semua user stories**
  - **NEW: Agile ceremonies dan team structure**
  - **NEW: Definition of Done dan CI/CD strategy**
  - **NEW: Agile team metrics (velocity, cycle time, etc)**

- **[PRD_AGILE_REVISION_SUMMARY.md](docs/PRD_AGILE_REVISION_SUMMARY.md)** - **Agile Revision Summary**:
  - Overview perubahan dari waterfall ke Agile
  - Key additions dan improvements
  - Sprint breakdown details
  - Benefits of Agile approach
  - Migration guide dan next steps

- **[REQUIREMENTS.md](docs/REQUIREMENTS.md)** - Formal requirements specification:
  - Functional requirements
  - Non-functional requirements
  - User stories and acceptance criteria
  - Requirements traceability matrix

- **[RISK_ASSESSMENT.md](docs/RISK_ASSESSMENT.md)** - Detailed risk analysis:
  - Risk identification and categorization
  - Impact and probability assessment
  - Mitigation strategies
  - Contingency plans

- **[SDLC_CHECKLIST.md](docs/SDLC_CHECKLIST.md)** - Phase tracking checklist:
  - Planning phase items
  - Development phase gates
  - Testing checkpoints
  - Deployment readiness criteria

## 🎯 Project Status

**Current Phase:** MVP Development - Core Features Implemented  
**Focus:** Building and validating the core PDF → Excel conversion  
**Next Steps:** 
1. Manual testing with real PDF samples
2. Iterate on regex patterns based on results
3. User feedback and improvements

**What's Done:**
- ✅ PDF text extraction (Apache PDFBox)
- ✅ Data parsing for BOL, CI, PL documents
- ✅ Excel generation for BC 1.1, BC 2.3, BC 3.0
- ✅ Complete API workflow
- ✅ Database tracking

**What's Next:**
- [ ] Testing with real customs documents
- [ ] UI for document upload and review
- [ ] Improve parsing accuracy
- [ ] Add document editing capabilities

## 🏗️ Technology Stack

**Core Libraries:**
- **Backend:** Clojure + Ring + Reitit (REST API)
- **PDF Processing:** Apache PDFBox 2.0.31 (text extraction)
- **Excel Generation:** Apache POI 5.2.5 (XLSX files)
- **Database:** PostgreSQL (document tracking)
- **Authentication:** Buddy (JWT-based, simplified)

**Why These Choices:**
- PDFBox: Industry standard, works well with Clojure/Java
- Apache POI: Battle-tested Excel generation
- Regex parsing: Fast to implement, good enough for MVP
- PostgreSQL: Reliable, JSON support for flexible storage

## 🚀 Getting Started

### Quick Test (No Setup Required)

See [CORE_MVP_FEATURES.md](CORE_MVP_FEATURES.md) for API examples and usage.

### Full Development Setup

See [DEVELOPMENT.md](DEVELOPMENT.md) for complete setup instructions.

**Basic steps:**
```bash
# 1. Clone repository
git clone https://github.com/apktntaj/pesisir.git
cd pesisir

# 2. Setup database (PostgreSQL)
# See DEVELOPMENT.md for details

# 3. Start server
clojure -M -m pesisir.core 3000

# 4. Test the API
curl http://localhost:3000/health
```

## 🧪 Testing

```bash
# Run all tests
clojure -M:test

# Run specific test
clojure -M:test --focus pesisir.document.model-test
```

## 📊 Key Metrics

**Success Criteria for MVP:**
1. **Extraction Accuracy:** >80% of fields correctly extracted
2. **Confidence Score:** Average >0.8
3. **Processing Time:** <5 seconds per document
4. **User Satisfaction:** Reduces manual work by >80%

## 🎓 Lessons Learned

### What Worked
- ✅ Starting with core features instead of infrastructure
- ✅ Using battle-tested libraries (PDFBox, POI)
- ✅ Regex parsing is good enough for structured documents
- ✅ Focus on solving the actual problem first

### What to Avoid
- ❌ Building complex authentication before validating core value
- ❌ Over-planning with extensive sprint documentation
- ❌ Trying to build everything at once
- ❌ Perfectionism over iteration

## 📝 Contributing

We're focusing on core features first. Contributions welcome in these areas:
- Testing with real customs documents
- Improving regex patterns for data extraction
- Better error handling
- Documentation improvements

## 📧 Contact

Project Maintainer: @apktntaj

## 📄 License

[Add appropriate license]

---

**Philosophy:** Build the core value first, validate with users, then scale. Focus on solving the actual problem (PDF → Excel conversion) before adding bells and whistles.

**Last Updated:** December 30, 2025  
**Document Version:** 2.0 (MVP Focus)  
**Next Review:** After user testing with real documents
