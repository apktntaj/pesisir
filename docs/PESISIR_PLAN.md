# Pesisir Customs Business Application - MVP Plan

**Project Name:** Pesisir  
**Type:** Multi-Tenant Customs Business Automation Platform  
**Planning Date:** December 7, 2025  
**SDLC Phase:** Planning

---

## Executive Summary

Pesisir is a one-stop solution for customs business operations. The MVP focuses on two core services:

1. **Shipment Record Management** - Automated vessel tracking, ETA notifications, and Bill of Lading OCR processing
2. **Customs Document Draft Automation** - Excel-based CEISA document generation with future API integration capability

---

## MVP Features

### Service 1: Shipment Record Management

#### Features:

- **Auto-fetch ETA** - Automatic vessel tracking and ETA data retrieval from maritime data providers
- **ETA Arrival Notifications** - Real-time alerts to users when vessels are approaching arrival
- **Bill of Lading OCR** - Automated form filling using OCR technology to extract data from Bill of Lading documents provided by users

#### Key Capabilities:

- Multi-tenant shipment tracking
- Background jobs for continuous ETA monitoring
- Intelligent document parsing and data extraction
- User preference-based notification system

### Service 2: Customs Document Draft Automation

#### Implementation Approaches:

**Phase 1 (MVP Priority):** Excel Template-Based

- Generate CEISA-compliant documents using Excel templates
- Export data from shipments to standardized Excel formats
- Manual import to CEISA platform by users

**Phase 2 (Future):** Direct CEISA API Integration

- Automated submission via CEISA API
- Real-time status updates
- Reduced manual intervention
- _Note: Pending credential complexity resolution_

---

## Technology Stack

### Backend Architecture

- **Framework:** .NET 8.0 (LTS)
- **Architecture Pattern:** Microservices
- **Database:** SQL Server 2022 (already configured in docker-compose)
- **ORM:** Entity Framework Core 8.0
- **Authentication:** JWT-based with role-based access control

### Core Services & APIs

#### 1. Identity Service (`Pesisir.Identity.API`)

- User authentication and authorization
- Tenant management and provisioning
- JWT token generation and validation
- Role-based access control (Tenant Admin, User)

#### 2. Shipment Service (`Pesisir.Shipment.API`)

- Shipment CRUD operations with tenant isolation
- Bill of Lading management
- Vessel tracking integration
- ETA monitoring and updates

#### 3. Document Service (`Pesisir.Document.API`)

- Document draft management
- Excel template processing
- CEISA format generation
- Future CEISA API integration placeholder

#### 4. Shared Domain (`Pesisir.Domain`)

- Common entities and value objects
- Shared interfaces and contracts
- Domain events

#### 5. Infrastructure (`Pesisir.Infrastructure`)

- Data access layer and DbContext
- External service integrations
- Multi-tenant query filters

### External Service Integrations

#### OCR Service: Azure Document Intelligence (Form Recognizer)

**Why Azure Document Intelligence:**

- Purpose-built for structured documents like Bills of Lading
- 95-99% accuracy for form field extraction
- Native table extraction and key-value pair detection
- Excellent .NET 8.0 SDK support via `Azure.AI.FormRecognizer` NuGet package
- Pre-trained models adaptable to shipping documents
- Custom model training without ML expertise
- Cost-effective: $0.001-0.01 per page with 500 free pages/month

**Implementation:**

- NuGet Package: `Azure.AI.FormRecognizer`
- Use pre-built invoice model initially
- Train custom BOL model with sample documents for higher accuracy
- Automatic extraction of shipper, consignee, vessel details, cargo information

#### Vessel Tracking: MarineTraffic API

**Why MarineTraffic:**

- Industry standard for customs and logistics
- Largest AIS database (800M+ positions/day)
- Coverage: 200,000+ vessels worldwide
- Trusted by customs authorities globally
- 99.5%+ uptime SLA on business plans
- Comprehensive vessel tracking, port calls, ETA calculations

**Implementation:**

- RESTful API integration via HttpClient
- Background job polling for ETA updates
- Recommended tier: "Intermediate" API plan for production
- Real-time vessel position and voyage history

#### Notifications: Twilio WhatsApp Business API

**Why Twilio WhatsApp:**

- Best .NET SDK support among WhatsApp BSPs
- Official `Twilio` NuGet package with async/await support
- Quick sandbox setup for development
- Excellent documentation and developer experience
- Transparent pay-as-you-go pricing (~$0.005/message)
- Reliable webhook support for delivery status

**Implementation:**

- NuGet Package: `Twilio`
- WhatsApp template messages for ETA alerts
- User opt-in preference management
- Notification queue for rate limiting
- Webhook handler for delivery confirmation

#### Excel Processing: EPPlus / ClosedXML

**For CEISA Document Generation:**

- NuGet Package: `EPPlus` (recommended) or `ClosedXML`
- Template-based Excel generation
- Dynamic data mapping from shipment records
- CEISA-compliant formatting

---

## Multi-Tenant Architecture

### Tenant Isolation Strategy

**Approach:** Shared Database with TenantId Row-Level Security

**Rationale:**

- Cost-effective for MVP
- Simpler deployment and maintenance
- Adequate isolation for customs business privacy requirements
- Scalable with proper data segregation

### Implementation Details

#### Data Model:

- All entities include `TenantId` column (GUID or string)
- EF Core Global Query Filters for automatic tenant scoping
- Tenant context resolved from JWT claims
- Separate `Tenants` table for tenant metadata

#### Security Measures:

- JWT tokens include tenant claim
- Middleware validates tenant access on every request
- Database constraints prevent cross-tenant data access
- Tenant-specific encryption keys for sensitive data

#### Tenant Management:

- Self-service tenant registration
- Unique tenant identifiers (subdomain or tenant key)
- Tenant settings: WhatsApp config, notification preferences, CEISA templates
- Tenant admin can manage users within their organization

---

## Database Schema Design

### Core Entities

#### Tenants

```
- TenantId (PK, GUID)
- CompanyName
- Subdomain (unique)
- CreatedAt
- IsActive
- SubscriptionTier
- Settings (JSON: notification preferences, API keys)
```

#### Users

```
- UserId (PK, GUID)
- TenantId (FK)
- Email
- PasswordHash
- FullName
- Role (Admin, User)
- PhoneNumber (for WhatsApp)
- WhatsAppOptIn (bool)
- CreatedAt
```

#### Shipments

```
- ShipmentId (PK, GUID)
- TenantId (FK)
- ShipmentNumber (unique per tenant)
- VesselName
- VesselIMO
- VoyageNumber
- OriginPort
- DestinationPort
- EstimatedTimeOfArrival (ETA)
- ActualTimeOfArrival (ATA)
- Status (InTransit, Arrived, Cleared)
- CreatedAt
- UpdatedAt
- CreatedBy (FK to Users)
```

#### BillsOfLading

```
- BillOfLadingId (PK, GUID)
- ShipmentId (FK)
- TenantId (FK)
- BLNumber
- ShipperName
- ShipperAddress
- ConsigneeName
- ConsigneeAddress
- NotifyParty
- CargoDescription
- GrossWeight
- PackageCount
- OCRConfidenceScore
- OriginalDocumentUrl (blob storage)
- ExtractedData (JSON)
- ProcessedAt
```

#### Documents

```
- DocumentId (PK, GUID)
- ShipmentId (FK)
- TenantId (FK)
- DocumentType (CustomsDeclaration, ImportPermit, etc.)
- DocumentNumber
- Status (Draft, Generated, Submitted)
- ExcelFileUrl
- CEISAReferenceNumber (nullable, for future API)
- GeneratedAt
- SubmittedAt
- CreatedBy (FK to Users)
```

#### Notifications

```
- NotificationId (PK, GUID)
- TenantId (FK)
- UserId (FK)
- ShipmentId (FK, nullable)
- Type (ETAArrival, DocumentReady)
- Channel (WhatsApp)
- Message
- Status (Pending, Sent, Failed)
- SentAt
- DeliveredAt
```

---

## Implementation Phases

### Phase 1: Foundation & Infrastructure (Week 1-2)

**Objectives:**

- Set up .NET 8.0 solution structure
- Configure Docker services (Redis, RabbitMQ/Azure Service Bus)
- Implement multi-tenant database schema
- Set up Entity Framework Core with migrations
- Configure authentication and JWT infrastructure

**Deliverables:**

- Working microservices project structure
- Database migrations for core entities
- JWT authentication middleware
- Tenant context resolution

### Phase 2: Identity & Tenant Management (Week 2-3)

**Objectives:**

- Build tenant registration and provisioning API
- Implement user management (CRUD, roles)
- Create login/logout endpoints
- Set up tenant admin dashboard APIs

**Deliverables:**

- Identity API with Swagger documentation
- Tenant self-service registration
- User authentication endpoints
- Role-based authorization

### Phase 3: Shipment Service & BOL OCR (Week 3-5)

**Objectives:**

- Implement shipment CRUD with tenant scoping
- Integrate Azure Document Intelligence for BOL processing
- Build file upload and OCR processing pipeline
- Create background job for OCR queue processing
- Integrate MarineTraffic API for vessel data
- Implement ETA monitoring background job

**Deliverables:**

- Shipment management APIs
- BOL upload and OCR extraction
- Automated ETA updates from MarineTraffic
- Vessel tracking data storage

### Phase 4: WhatsApp Notification System (Week 5-6)

**Objectives:**

- Integrate Twilio WhatsApp API
- Build notification service and queue
- Implement ETA threshold alerts
- Create user notification preferences
- Set up webhook for delivery status

**Deliverables:**

- WhatsApp notification sending
- ETA arrival alerts (e.g., 24 hours before arrival)
- User opt-in/opt-out management
- Notification history and status tracking

### Phase 5: Document Service & Excel Generation (Week 6-7)

**Objectives:**

- Build document draft management APIs
- Implement Excel template engine using EPPlus
- Create CEISA document templates
- Map shipment/BOL data to Excel formats
- Build document download endpoints

**Deliverables:**

- Document draft CRUD APIs
- Excel generation from templates
- CEISA-compliant document formats
- Document export and download

### Phase 6: Testing & Deployment (Week 8)

**Objectives:**

- Unit tests for critical business logic
- Integration tests for API endpoints
- End-to-end testing for key workflows
- Docker deployment configuration
- CI/CD pipeline setup (GitHub Actions)

**Deliverables:**

- Test coverage report
- Deployment documentation
- Production-ready Docker configuration

---

## Key Configuration Requirements

### Azure Services Setup

- **Azure Document Intelligence:** Create resource, obtain API key and endpoint
- **Azure Blob Storage:** For storing original BOL documents and generated Excel files
- **Azure Key Vault:** Secure storage for API keys and secrets

### Third-Party Service Accounts

- **MarineTraffic:** Register for API access, obtain API key (Intermediate tier recommended)
- **Twilio:** Create account, set up WhatsApp Business Profile, obtain Account SID and Auth Token

### Development Environment

- **Docker:** Already configured with .NET 8.0, SQL Server 2022
- **Redis:** Add to docker-compose for caching and session management
- **Message Queue:** RabbitMQ or Azure Service Bus for background job processing

---

## Security Considerations

### Data Privacy & Compliance

- **Tenant Isolation:** Strict row-level security prevents cross-tenant data access
- **Encryption at Rest:** SQL Server TDE for database encryption
- **Encryption in Transit:** HTTPS/TLS for all API communication
- **Sensitive Data:** Encrypt CEISA credentials, API keys in Azure Key Vault
- **Audit Logging:** Track all data access and modifications per tenant

### Authentication & Authorization

- **JWT Tokens:** Short-lived access tokens (15 minutes), refresh tokens (7 days)
- **Role-Based Access:** Tenant Admin (full access), User (limited access)
- **API Rate Limiting:** Per-tenant rate limits to prevent abuse
- **CORS Configuration:** Whitelist allowed origins per tenant

---

## Risks & Mitigation Strategies

### Risk 1: CEISA API Credential Complexity

**Mitigation:** Prioritize Excel template approach for MVP; research CEISA API requirements in parallel; establish communication with CEISA technical team early.

### Risk 2: OCR Accuracy for Complex BOL Documents

**Mitigation:** Train custom Azure Document Intelligence model with diverse BOL samples; implement confidence score thresholds; provide manual review/edit UI for low-confidence extractions.

### Risk 3: MarineTraffic API Rate Limits

**Mitigation:** Implement caching strategy for vessel data; use background jobs with smart polling intervals; consider upgrading API tier if needed; fallback to manual ETA entry.

### Risk 4: WhatsApp Business Approval Delays

**Mitigation:** Apply for production WhatsApp access immediately; use Twilio sandbox for development; consider email notifications as temporary fallback.

### Risk 5: Multi-Tenant Data Leakage

**Mitigation:** Comprehensive unit/integration tests for tenant isolation; code review for all queries; use EF Core query filters; security audit before production.

---

## Success Metrics (KPIs)

### Operational Metrics

- **OCR Accuracy Rate:** Target >95% for Bill of Lading field extraction
- **ETA Prediction Accuracy:** Compare MarineTraffic ETA vs actual arrival times
- **Notification Delivery Rate:** >99% successful WhatsApp message delivery
- **Excel Generation Success Rate:** Target 100% error-free document generation

### User Experience Metrics

- **Average OCR Processing Time:** <30 seconds per BOL document
- **ETA Update Frequency:** Real-time updates within 15 minutes of changes
- **Document Generation Time:** <5 seconds per Excel document
- **User Adoption Rate:** Active users per tenant per month

### Business Metrics

- **Tenant Onboarding Time:** <30 minutes from registration to first shipment
- **Time Saved per Shipment:** Compare manual vs automated workflows
- **Error Reduction:** Decrease in data entry errors compared to manual process

---

## Future Enhancements (Post-MVP)

### Short-Term (3-6 months)

- Direct CEISA API integration for automated document submission
- Mobile application (iOS/Android) for on-the-go tracking
- Advanced analytics dashboard for shipment trends
- PDF document generation alongside Excel
- Email notification channel as alternative to WhatsApp

### Medium-Term (6-12 months)

- AI-powered customs tariff classification suggestions
- Integration with additional shipping lines for direct data feeds
- Multi-language support for international users
- Customs duty calculation automation
- Shipment cost estimation tools

### Long-Term (12+ months)

- Blockchain integration for immutable shipment records
- Integration with port community systems
- Predictive analytics for customs clearance times
- API marketplace for third-party integrations
- White-label solution for customs brokerage firms

---

## Decision Log

### OCR Service Selection

**Decision:** Azure Document Intelligence  
**Alternatives Considered:** Azure Computer Vision, Tesseract OCR  
**Rationale:** Purpose-built for structured documents, highest accuracy, best .NET support, includes table extraction

### ETA Data Provider Selection

**Decision:** MarineTraffic API  
**Alternatives Considered:** VesselFinder, Spire Maritime, FleetMon  
**Rationale:** Industry standard, largest database, trusted by customs authorities, excellent API documentation

### WhatsApp Integration Provider

**Decision:** Twilio WhatsApp API  
**Alternatives Considered:** MessageBird, 360dialog, Direct Meta Cloud API  
**Rationale:** Best .NET SDK, easiest integration, excellent documentation, reliable support

### Multi-Tenancy Strategy

**Decision:** Shared Database with TenantId  
**Alternatives Considered:** Database-per-tenant, Schema-per-tenant  
**Rationale:** Cost-effective, simpler deployment, adequate isolation, scalable for MVP

### Document Generation Priority

**Decision:** Excel Template First, API Integration Later  
**Rationale:** Faster MVP delivery, no dependency on CEISA credential complexity, user-familiar format

---

## Questions Requiring Clarification

### Resolved:

✅ **OCR Service:** Azure Document Intelligence selected  
✅ **ETA Provider:** MarineTraffic selected  
✅ **Notification Channel:** WhatsApp only via Twilio  
✅ **Multi-Tenancy:** Confirmed requirement  
✅ **CEISA Integration:** Excel templates prioritized for MVP

### Pending:

1. **Azure Document Intelligence Model:** Should we use pre-built invoice model or train custom BOL model immediately? (Requires 5+ sample BOL documents for training)

2. **MarineTraffic API Tier:** Start with Developer plan ($50/month) for testing or go directly to Intermediate plan ($200/month) for production-grade access?

3. **Twilio WhatsApp Timeline:** Should we apply for production WhatsApp Business approval now (1-3 weeks wait) or develop using sandbox first?

4. **Excel Template Customization:** Should CEISA templates be standardized across all tenants or allow per-tenant customization?

5. **Initial User Limits:** Any per-tenant user limits for MVP (e.g., max 10 users per tenant)?

6. **Data Retention Policy:** How long should shipment and document data be retained? Archive strategy?

7. **Subscription Model:** Free tier for MVP testing or paid-only access from launch?

---

## Project Timeline Summary

**Total MVP Duration:** 8 weeks  
**Estimated Launch Date:** February 2026

| Phase                        | Duration | Status      |
| ---------------------------- | -------- | ----------- |
| Foundation & Infrastructure  | 2 weeks  | Not Started |
| Identity & Tenant Management | 1 week   | Not Started |
| Shipment Service & BOL OCR   | 2 weeks  | Not Started |
| WhatsApp Notification System | 1 week   | Not Started |
| Document Service & Excel     | 1 week   | Not Started |
| Testing & Deployment         | 1 week   | Not Started |

---

## Resources & Documentation Links

### Azure Document Intelligence

- Documentation: https://learn.microsoft.com/azure/ai-services/document-intelligence/
- .NET SDK: https://www.nuget.org/packages/Azure.AI.FormRecognizer
- Pricing: https://azure.microsoft.com/pricing/details/ai-document-intelligence/

### MarineTraffic API

- API Documentation: https://www.marinetraffic.com/en/ais-api-services
- Developer Portal: https://www.marinetraffic.com/en/p/api-services

### Twilio WhatsApp API

- Documentation: https://www.twilio.com/docs/whatsapp
- .NET SDK: https://www.nuget.org/packages/Twilio
- WhatsApp Business Setup: https://www.twilio.com/docs/whatsapp/tutorial

### EPPlus (Excel Library)

- Documentation: https://github.com/EPPlusSoftware/EPPlus
- NuGet Package: https://www.nuget.org/packages/EPPlus

---

## Appendix: Architecture Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────┐
│                      Pesisir Platform                        │
│                    (Multi-Tenant SaaS)                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌──────────────────────────────┐
│  Web Frontend   │────────▶│     API Gateway / LB         │
│  (Future)       │         │   (Tenant Resolution)        │
└─────────────────┘         └──────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            ┌───────────────┐  ┌──────────────┐  ┌──────────────┐
            │  Identity API │  │ Shipment API │  │ Document API │
            │   (Auth/JWT)  │  │ (Tracking)   │  │ (Excel Gen)  │
            └───────────────┘  └──────────────┘  └──────────────┘
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       ▼
                            ┌────────────────────┐
                            │   SQL Server DB    │
                            │  (Multi-Tenant)    │
                            └────────────────────┘

External Services:
┌─────────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│ Azure Document      │  │  MarineTraffic   │  │ Twilio WhatsApp │
│ Intelligence (OCR)  │  │  API (Vessel ETA)│  │  (Notifications)│
└─────────────────────┘  └──────────────────┘  └─────────────────┘

Background Jobs:
┌─────────────────────┐  ┌──────────────────┐
│  OCR Processing     │  │  ETA Monitor &   │
│  Queue (BOL)        │  │  Notification    │
└─────────────────────┘  └──────────────────┘
```

---

**Document Version:** 1.0  
**Last Updated:** December 7, 2025  
**Next Review:** After MVP Phase 1 completion
