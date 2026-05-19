# Pesisir - Platform Otomasi Dokumen Pabean

[![SDLC Phase](https://img.shields.io/badge/Sprint-0%20Planning-blue.svg)]()
[![Methodology](https://img.shields.io/badge/Methodology-Agile%20Scrum-green.svg)]()
[![Project Type](https://img.shields.io/badge/Type-MVP%20SaaS-green.svg)]()
[![Tech Stack](https://img.shields.io/badge/Clojure-Full%20Stack-blue.svg)]()
[![Sprint Duration](https://img.shields.io/badge/Sprint-3%20Weeks-orange.svg)]()
[![Team](https://img.shields.io/badge/Team-Solo%20Founder-red.svg)]()

## 📋 Overview

Pesisir adalah platform digital yang membantu staff PPJK (Perusahaan Pengurusan Jasa Kepabeanan) mengotomasi pembuatan draft dokumen pabean. Dibangun oleh solo founder dengan Clojure full-stack untuk rapid development dan maintainability.

**MVP Focus (Ultra-Minimal):**
1. **Document Upload & Processing** - PDF parsing dan ekstraksi data otomatis
2. **Customs Document Generation** - Template-based Excel generation untuk BC 1.1, BC 2.3, BC 3.0
3. **Pay-per-document Model** - Simple credit system tanpa subscription complexity

## 📚 Documentation

This repository follows **Agile Scrum methodology** for iterative and incremental development:

### Core Documents

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

**Current Phase:** Sprint 0 - Planning & Requirements (Agile Scrum)  
**Team Size:** Solo Founder (with GitHub Copilot)  
**Next Sprint:** Sprint 1 - Foundation & Authentication  
**Estimated MVP Launch:** May 2026 (End of Sprint 8)  
**Total Development Duration:** 24 weeks (8 sprints @ 3 weeks each)

**Solo Founder Adjustments:**
- Sprint duration: 3 weeks (not 2) - sustainable pace
- Focus: One major feature per sprint
- Buffer: 20% time for learning & debugging
- MVP scope: Ultra-minimal, defer all non-essential features

## 🏗️ Technology Stack (Clojure End-to-End)

**Solo Founder Stack - Optimized for Rapid Development:**

- **Backend:** Clojure + Ring + Reitit (REST API)
- **Frontend:** ClojureScript + Re-frame + Reagent (SPA)
- **Database:** Datomic Cloud (Immutable, time-travel queries)
- **Authentication:** Buddy (JWT-based)
- **Job Processing:** core.async / Goose
- **PDF Parsing:** Apache PDFBox (Java interop)
- **Excel Generation:** Apache POI (Java interop)
- **Deployment:** Fly.io (simple, affordable)
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry + LogTail

**Why Clojure Full-Stack:**
- Same language frontend & backend = less context switching
- REPL-driven development = faster iteration
- Datomic = built-in audit log, time-travel queries
- Monolith architecture = simpler deployment & debugging
- Java interop = access to mature PDF/Excel libraries

## 🚀 Getting Started

### Prerequisites

- **Clojure CLI** (deps.edn)
- **Java 21** (for Clojure runtime)
- **Datomic Cloud** or **Datomic Pro** (local dev)
- **Node.js 20+** (for ClojureScript compilation)
- **Fly.io CLI** (for deployment)
- **Git** (version control)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/apktntaj/pesisir.git
cd pesisir

# Review planning documents
cd docs
ls -la

# Follow the SDLC checklist for development phases
# See SDLC_CHECKLIST.md for detailed steps
```

## 📊 SDLC Methodology

This project follows an **Agile Scrum** approach with 2-week sprints:

### Agile Sprint Cycle

**Sprint Duration**: 2 weeks (6 sprints total for MVP)

**Sprint Ceremonies**:
- **Sprint Planning**: 2 hours (every 2 weeks) - Define sprint goal and commit to user stories
- **Daily Standup**: 15 minutes (daily) - Sync on progress and blockers
- **Sprint Review**: 1 hour (end of sprint) - Demo working software to stakeholders
- **Sprint Retrospective**: 1 hour (end of sprint) - Continuous improvement discussion
- **Backlog Refinement**: 1 hour (mid-sprint) - Prepare upcoming stories

### Sprint Timeline (Solo Founder MVP - 24 Weeks)

```
Sprint 0      Sprint 1        Sprint 2        Sprint 3        Sprint 4
[Planning]  [Foundation]  [PDF Upload]  [Data Extract]  [Review UI]
Week -2-0     Week 1-3       Week 4-6        Week 7-9       Week 10-12

  Sprint 5        Sprint 6        Sprint 7         Sprint 8
[Generation]  [Credit System]   [Polish]    [Testing/Launch]
  Week 13-15      Week 16-18      Week 19-21      Week 22-24
                                                        ⭐ MVP LAUNCH
```

**Current Status**: 
- ✅ **Sprint 0**: Planning & Stack Decision (Completed)
- 🔄 **Sprint 1**: Clojure Setup + Authentication (Next - Jan 2026)
- 🎯 **Target Launch**: May 2026

### Agile Principles Applied

1. ✅ **Working Software Over Documentation**: Focus on delivering functional increments every sprint
2. ✅ **Customer Collaboration**: Regular sprint reviews with stakeholders and early user feedback
3. ✅ **Responding to Change**: Adaptive planning based on sprint learnings and velocity
4. ✅ **Iterative Development**: Each sprint builds on previous increments
5. ✅ **Continuous Delivery**: CI/CD pipeline enables bi-weekly production deployments
6. ✅ **Team Empowerment**: Self-organizing cross-functional development team

## 📝 Contributing

This is currently a planning and architecture phase. Contributions to documentation review and technical design are welcome.

Please refer to [SDLC_REVIEW.md](docs/SDLC_REVIEW.md) for review guidelines and feedback areas.

## 📧 Contact

Project Maintainer: @apktntaj

## 📄 License

[Add appropriate license]

---

**Last Updated:** December 8, 2025  
**Document Version:** 1.0  
**Next Review:** After Requirements Analysis completion
