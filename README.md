# Pesisir - Multi-Tenant Customs Business Automation Platform

[![SDLC Phase](https://img.shields.io/badge/Sprint-0%20Planning-blue.svg)]()
[![Methodology](https://img.shields.io/badge/Methodology-Agile%20Scrum-green.svg)]()
[![Project Type](https://img.shields.io/badge/Type-Mini%20SaaS-green.svg)]()
[![Tech Stack](https://img.shields.io/badge/.NET-8.0-purple.svg)]()
[![Sprint Duration](https://img.shields.io/badge/Sprint-2%20Weeks-orange.svg)]()

## 📋 Overview

Pesisir is a one-stop solution for customs business operations, designed as a scalable multi-tenant SaaS platform. The MVP focuses on automating two core services:

1. **Shipment Record Management** - Automated vessel tracking, ETA notifications, and Bill of Lading OCR processing
2. **Customs Document Draft Automation** - Excel-based CEISA document generation with future API integration capability

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
**Next Sprint:** Sprint 1 - Authentication & Core Infrastructure  
**Estimated MVP Launch:** February 2026 (End of Sprint 6)  
**Total Development Duration:** 12 weeks (6 sprints @ 2 weeks each)

## 🏗️ Technology Stack

- **Backend:** .NET 8.0 with Microservices Architecture
- **Database:** SQL Server 2022 with Multi-tenant Row-Level Security
- **Authentication:** JWT with Role-Based Access Control
- **External Services:**
  - Azure Document Intelligence (OCR)
  - MarineTraffic API (Vessel Tracking)
  - Twilio WhatsApp API (Notifications)
  - EPPlus (Excel Generation)

## 🚀 Getting Started

### Prerequisites

- .NET 8.0 SDK
- Docker & Docker Compose
- Azure Account (for Document Intelligence)
- MarineTraffic API Key
- Twilio Account with WhatsApp enabled

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

### Sprint Timeline (MVP Development)

```
Sprint 0     Sprint 1       Sprint 2       Sprint 3       Sprint 4       Sprint 5       Sprint 6
[Setup]    [Auth/Core]  [Upload/OCR]  [Review/Edit]  [Generation]   [Payment]    [Polish/Test]
Week -1-0    Week 1-2      Week 3-4       Week 5-6       Week 7-8      Week 9-10     Week 11-12
                                                                                           ⭐ MVP LAUNCH
```

**Current Status**: 
- ✅ **Sprint 0**: Planning & Requirements (Completed)
- 🔄 **Sprint 1**: Authentication & Core Infrastructure (Next)

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
