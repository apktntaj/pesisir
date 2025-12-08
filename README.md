# Pesisir - Multi-Tenant Customs Business Automation Platform

[![SDLC Phase](https://img.shields.io/badge/SDLC-Planning-blue.svg)]()
[![Project Type](https://img.shields.io/badge/Type-Mini%20SaaS-green.svg)]()
[![Tech Stack](https://img.shields.io/badge/.NET-8.0-purple.svg)]()

## 📋 Overview

Pesisir is a one-stop solution for customs business operations, designed as a scalable multi-tenant SaaS platform. The MVP focuses on automating two core services:

1. **Shipment Record Management** - Automated vessel tracking, ETA notifications, and Bill of Lading OCR processing
2. **Customs Document Draft Automation** - Excel-based CEISA document generation with future API integration capability

## 📚 Documentation

This repository follows the Software Development Life Cycle (SDLC) methodology for comprehensive planning and implementation:

### Core Documents

- **[PESISIR_PLAN.md](docs/PESISIR_PLAN.md)** - Complete MVP planning document including:
  - Feature specifications
  - Technology stack decisions
  - Architecture design
  - Database schema
  - Implementation phases
  - External service integrations

- **[SDLC_REVIEW.md](docs/SDLC_REVIEW.md)** - Comprehensive SDLC review covering:
  - Phase-by-phase analysis
  - Best practices assessment
  - Gap analysis and recommendations
  - Quality assurance guidelines

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

**Current Phase:** Planning & Requirements Analysis  
**Estimated MVP Launch:** February 2026  
**Total Development Duration:** 8 weeks

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

This project follows a structured SDLC approach:

1. **Planning** ✅ (Current Phase)
   - Requirements gathering
   - Feasibility analysis
   - Resource allocation
   - Timeline estimation

2. **Requirements Analysis** 🔄 (In Progress)
   - Functional requirements specification
   - Non-functional requirements
   - Use case development
   - Requirements validation

3. **Design** ⏳ (Next)
   - System architecture design
   - Database schema design
   - API design and documentation
   - UI/UX wireframes

4. **Implementation** ⏳
   - Microservices development
   - API implementation
   - Integration with external services
   - Unit and integration testing

5. **Testing** ⏳
   - System testing
   - Integration testing
   - User acceptance testing
   - Performance testing

6. **Deployment** ⏳
   - Production environment setup
   - CI/CD pipeline configuration
   - Monitoring and logging setup
   - Launch preparation

7. **Maintenance** ⏳
   - Bug fixes
   - Feature enhancements
   - Performance optimization
   - User support

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
