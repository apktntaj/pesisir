# Requirements Specification: Pesisir Platform

**Project:** Pesisir - Multi-Tenant Customs Business Automation Platform  
**Version:** 1.0  
**Date:** December 8, 2025  
**Status:** Draft - Awaiting Approval

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 8, 2025 | Planning Team | Initial requirements specification |

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for the Pesisir MVP, a multi-tenant customs business automation platform focused on shipment tracking and document automation.

### 1.2 Scope
The MVP covers two core services:
- Shipment Record Management (vessel tracking, ETA notifications, BOL OCR)
- Customs Document Draft Automation (Excel-based CEISA document generation)

### 1.3 Definitions and Acronyms
- **BOL:** Bill of Lading
- **ETA:** Estimated Time of Arrival
- **ATA:** Actual Time of Arrival
- **CEISA:** Indonesia Customs Electronic System
- **OCR:** Optical Character Recognition
- **SaaS:** Software as a Service
- **MVP:** Minimum Viable Product
- **JWT:** JSON Web Token

---

## 2. Functional Requirements

### 2.1 Identity and Tenant Management

#### REQ-FUNC-001: Tenant Registration
**Priority:** Must Have  
**Description:** System shall allow new organizations to self-register as tenants.

**Acceptance Criteria:**
- User can create account with company name, email, and password
- System validates email format and password strength (min 8 chars, 1 uppercase, 1 number)
- System generates unique tenant identifier
- Confirmation email sent upon successful registration
- First user automatically assigned as Tenant Admin role

**Related User Story:** US-001

---

#### REQ-FUNC-002: User Authentication
**Priority:** Must Have  
**Description:** System shall authenticate users using email and password with JWT tokens.

**Acceptance Criteria:**
- User can login with registered email and password
- System generates JWT access token (15 min expiry) and refresh token (7 days)
- JWT includes tenant ID, user ID, and role claims
- Failed login attempts limited to 5 per 15 minutes per email
- System supports logout functionality that invalidates refresh token

**Related User Story:** US-002

---

#### REQ-FUNC-003: User Management
**Priority:** Must Have  
**Description:** Tenant Admin shall manage users within their organization.

**Acceptance Criteria:**
- Tenant Admin can create, update, and deactivate users
- Tenant Admin can assign roles (Admin, User)
- Users cannot access other tenants' data
- Tenant Admin can view list of all users in their organization
- System prevents deletion of last admin user

**Related User Story:** US-003

---

### 2.2 Shipment Management

#### REQ-FUNC-004: Create Shipment
**Priority:** Must Have  
**Description:** Users shall create shipment records with vessel and voyage details.

**Acceptance Criteria:**
- User can enter shipment number, vessel name, voyage number
- User can specify origin and destination ports
- User can enter initial ETA
- System assigns unique shipment ID per tenant
- Shipment numbers must be unique within tenant
- System records creator and creation timestamp

**Related User Story:** US-004

---

#### REQ-FUNC-005: Vessel Tracking Integration
**Priority:** Must Have  
**Description:** System shall automatically fetch vessel ETA from MarineTraffic API.

**Acceptance Criteria:**
- System queries MarineTraffic API using vessel IMO or name
- System updates ETA when changes detected
- System stores voyage history
- Background job polls for updates every 4 hours
- System handles API rate limits gracefully
- Manual ETA override available if API unavailable

**Related User Story:** US-005

---

#### REQ-FUNC-006: View Shipment List
**Priority:** Must Have  
**Description:** Users shall view list of shipments filtered and sorted.

**Acceptance Criteria:**
- User sees only their tenant's shipments
- User can filter by status (In Transit, Arrived, Cleared)
- User can sort by ETA, creation date, shipment number
- User can search by shipment number, vessel name
- List paginated (20 items per page)

**Related User Story:** US-006

---

#### REQ-FUNC-007: Update Shipment Status
**Priority:** Must Have  
**Description:** Users shall update shipment status and actual arrival time.

**Acceptance Criteria:**
- User can change status to In Transit, Arrived, or Cleared
- User can record actual time of arrival (ATA)
- System records update timestamp and user
- Status changes logged for audit trail

**Related User Story:** US-007

---

### 2.3 Bill of Lading Processing

#### REQ-FUNC-008: Upload BOL Document
**Priority:** Must Have  
**Description:** Users shall upload Bill of Lading documents for OCR processing.

**Acceptance Criteria:**
- User can upload PDF or image files (PNG, JPG)
- Maximum file size: 10 MB
- Files stored in Azure Blob Storage with secure URLs
- System generates unique identifier for each document
- Upload progress indicator displayed

**Related User Story:** US-008

---

#### REQ-FUNC-009: OCR Processing
**Priority:** Must Have  
**Description:** System shall extract data from BOL documents using Azure Document Intelligence.

**Acceptance Criteria:**
- System processes uploaded BOL within 30 seconds
- System extracts: shipper name/address, consignee name/address, cargo description, weight, package count
- System calculates confidence score for each field
- Extracted data stored with BOL record
- Processing status updated (Pending, Processing, Completed, Failed)

**Related User Story:** US-009

---

#### REQ-FUNC-010: Review Extracted Data
**Priority:** Must Have  
**Description:** Users shall review and edit OCR-extracted data before saving.

**Acceptance Criteria:**
- User sees extracted data with confidence scores
- Fields with <90% confidence highlighted for review
- User can edit any extracted field
- User must confirm data before saving to shipment
- System tracks manual edits for accuracy improvement

**Related User Story:** US-010

---

#### REQ-FUNC-011: Link BOL to Shipment
**Priority:** Must Have  
**Description:** System shall associate BOL data with shipment record.

**Acceptance Criteria:**
- User can select shipment when uploading BOL
- System auto-populates shipment fields from BOL data
- Multiple BOLs can be linked to one shipment
- BOL data visible in shipment details

**Related User Story:** US-011

---

### 2.4 Notification System

#### REQ-FUNC-012: ETA Arrival Notifications
**Priority:** Must Have  
**Description:** System shall send WhatsApp notifications when vessel is approaching arrival.

**Acceptance Criteria:**
- Notification sent 24 hours before ETA
- Notification includes vessel name, ETA, destination port
- Notification sent to all users who opted in for that shipment
- Notification delivery status tracked
- Background job checks ETA thresholds hourly

**Related User Story:** US-012

---

#### REQ-FUNC-013: WhatsApp Opt-In Management
**Priority:** Must Have  
**Description:** Users shall manage WhatsApp notification preferences.

**Acceptance Criteria:**
- User can provide phone number in international format
- User can opt in/out of WhatsApp notifications
- User can specify preferred language (if supported)
- Phone number verified via OTP before activation
- Opt-out link included in all notifications

**Related User Story:** US-013

---

### 2.5 Document Generation

#### REQ-FUNC-014: Generate CEISA Documents
**Priority:** Must Have  
**Description:** System shall generate CEISA-compliant Excel documents from shipment data.

**Acceptance Criteria:**
- User can select shipment and document type
- System generates Excel file using predefined template
- Document includes all required CEISA fields
- Generated file available for download within 5 seconds
- File stored in blob storage with 30-day retention

**Related User Story:** US-014

---

#### REQ-FUNC-015: Download Document
**Priority:** Must Have  
**Description:** Users shall download generated CEISA documents.

**Acceptance Criteria:**
- User can download document from list view
- Download link expires after 7 days
- System tracks download events
- User can regenerate document if needed

**Related User Story:** US-015

---

#### REQ-FUNC-016: Document History
**Priority:** Should Have  
**Description:** System shall maintain history of generated documents.

**Acceptance Criteria:**
- User sees list of all documents generated for a shipment
- List shows generation date, document type, status
- User can view document details
- User can download historical documents

**Related User Story:** US-016

---

### 2.6 Admin and Settings

#### REQ-FUNC-017: Tenant Settings
**Priority:** Should Have  
**Description:** Tenant Admin shall configure organization settings.

**Acceptance Criteria:**
- Admin can update company name and contact info
- Admin can configure notification preferences (default for new users)
- Admin can upload custom CEISA templates (future)
- Settings changes logged for audit

**Related User Story:** US-017

---

#### REQ-FUNC-018: User Activity Audit
**Priority:** Should Have  
**Description:** System shall log user activities for security and compliance.

**Acceptance Criteria:**
- System logs: login/logout, data access, modifications, downloads
- Logs include: user ID, tenant ID, timestamp, IP address, action
- Admin can view audit logs for their tenant
- Logs retained for 90 days minimum

**Related User Story:** US-018

---

## 3. Non-Functional Requirements

### 3.1 Performance Requirements

#### REQ-PERF-001: API Response Time
**Priority:** Must Have  
**Description:** API endpoints shall respond within acceptable time limits.

**Acceptance Criteria:**
- 95th percentile response time <500ms for all GET requests
- 95th percentile response time <1000ms for POST/PUT requests
- 99th percentile response time <2000ms for all requests
- Measured under load of 50 concurrent users per tenant

---

#### REQ-PERF-002: OCR Processing Time
**Priority:** Must Have  
**Description:** BOL document OCR processing shall complete within 30 seconds.

**Acceptance Criteria:**
- 95% of documents processed within 30 seconds
- Maximum processing time: 60 seconds
- System provides real-time progress updates

---

#### REQ-PERF-003: Document Generation Time
**Priority:** Must Have  
**Description:** CEISA Excel document generation shall complete within 5 seconds.

**Acceptance Criteria:**
- 99% of documents generated within 5 seconds
- User receives immediate download link
- No blocking of user interface during generation

---

### 3.2 Scalability Requirements

#### REQ-SCALE-001: Tenant Capacity
**Priority:** Must Have  
**Description:** System shall support multiple concurrent tenants.

**Acceptance Criteria:**
- MVP: Support 100 tenants simultaneously
- 6 months: Support 500 tenants
- 12 months: Support 1000 tenants
- No performance degradation with tenant growth

---

#### REQ-SCALE-002: User Capacity
**Priority:** Must Have  
**Description:** System shall support multiple users per tenant.

**Acceptance Criteria:**
- MVP: Minimum 50 users per tenant
- 12 months: Minimum 200 users per tenant
- Concurrent users: 50 per tenant without degradation

---

#### REQ-SCALE-003: Data Volume
**Priority:** Must Have  
**Description:** System shall handle large data volumes efficiently.

**Acceptance Criteria:**
- 10,000 shipments per tenant without performance impact
- 100,000 BOL documents processed per month
- 1 million notifications sent per month
- Database queries optimized with proper indexing

---

### 3.3 Availability Requirements

#### REQ-AVAIL-001: System Uptime
**Priority:** Must Have  
**Description:** System shall maintain high availability.

**Acceptance Criteria:**
- Target: 99.5% uptime (3.65 hours downtime per month)
- Goal: 99.9% uptime (43.2 minutes downtime per month)
- Scheduled maintenance windows: First Sunday of month, 2-6 AM
- Unplanned downtime: <30 minutes per incident

---

#### REQ-AVAIL-002: Database Availability
**Priority:** Must Have  
**Description:** Database shall be highly available with backups.

**Acceptance Criteria:**
- Automated daily backups
- Point-in-time restore capability
- Backup retention: 30 days
- Recovery time objective (RTO): 4 hours
- Recovery point objective (RPO): 24 hours

---

### 3.4 Security Requirements

#### REQ-SEC-001: Data Encryption
**Priority:** Must Have  
**Description:** System shall encrypt data at rest and in transit.

**Acceptance Criteria:**
- All API communication over HTTPS/TLS 1.2+
- Database encryption at rest enabled (TDE)
- Blob storage encryption enabled
- Sensitive fields (passwords) hashed using bcrypt

---

#### REQ-SEC-002: Authentication Security
**Priority:** Must Have  
**Description:** System shall implement secure authentication.

**Acceptance Criteria:**
- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens signed with RS256 algorithm
- Refresh token rotation on use
- Failed login rate limiting (5 attempts per 15 min)
- Password reset via email verification

---

#### REQ-SEC-003: Authorization
**Priority:** Must Have  
**Description:** System shall enforce role-based access control.

**Acceptance Criteria:**
- All API endpoints require authentication
- Role-based permissions enforced (Admin, User)
- Tenant isolation enforced at database level
- Unauthorized access attempts logged and blocked

---

#### REQ-SEC-004: Data Privacy
**Priority:** Must Have  
**Description:** System shall protect user and tenant data privacy.

**Acceptance Criteria:**
- Users cannot access other tenants' data
- Personal data encrypted (phone numbers, emails)
- Compliance with data protection regulations
- User data deletion on account removal (GDPR right to be forgotten)

---

#### REQ-SEC-005: API Security
**Priority:** Must Have  
**Description:** System shall protect APIs from abuse.

**Acceptance Criteria:**
- Rate limiting: 100 requests per minute per user
- CORS configured with whitelist
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS protection in responses

---

#### REQ-SEC-006: External Service Security
**Priority:** Must Have  
**Description:** System shall securely manage external service credentials.

**Acceptance Criteria:**
- API keys stored in Azure Key Vault
- Credentials rotated quarterly
- No hardcoded secrets in source code
- Environment-specific configurations
- Secrets access logged and monitored

---

### 3.5 Reliability Requirements

#### REQ-REL-001: Error Handling
**Priority:** Must Have  
**Description:** System shall handle errors gracefully.

**Acceptance Criteria:**
- All exceptions caught and logged
- User-friendly error messages displayed
- No sensitive information in error messages
- Failed operations retryable where appropriate
- Circuit breakers for external service calls

---

#### REQ-REL-002: External Service Resilience
**Priority:** Must Have  
**Description:** System shall handle external service failures.

**Acceptance Criteria:**
- Retry logic with exponential backoff
- Timeout configurations (30 seconds max)
- Fallback mechanisms when services unavailable
- Circuit breaker pattern implemented
- Graceful degradation of non-critical features

---

### 3.6 Usability Requirements

#### REQ-USE-001: User Interface
**Priority:** Should Have  
**Description:** System shall provide intuitive user interface (future web frontend).

**Acceptance Criteria:**
- Consistent design language
- Responsive design (desktop, tablet, mobile)
- Accessibility standards (WCAG 2.1 Level AA)
- Loading indicators for async operations
- Helpful error messages with corrective actions

---

#### REQ-USE-002: API Documentation
**Priority:** Must Have  
**Description:** APIs shall be well-documented.

**Acceptance Criteria:**
- OpenAPI/Swagger specification available
- Interactive API documentation (Swagger UI)
- Example requests and responses
- Authentication requirements documented
- Error codes and meanings explained

---

### 3.7 Maintainability Requirements

#### REQ-MAINT-001: Code Quality
**Priority:** Must Have  
**Description:** Code shall be maintainable and testable.

**Acceptance Criteria:**
- Unit test coverage >80%
- Integration test coverage >70%
- Code follows established style guide
- Code review required for all changes
- Static code analysis runs on every commit

---

#### REQ-MAINT-002: Logging and Monitoring
**Priority:** Must Have  
**Description:** System shall provide comprehensive logging and monitoring.

**Acceptance Criteria:**
- Structured logging with correlation IDs
- Log levels: Debug, Info, Warning, Error, Critical
- Application Insights or equivalent configured
- Performance metrics collected
- Alerting rules configured for critical errors

---

#### REQ-MAINT-003: Database Migrations
**Priority:** Must Have  
**Description:** Database schema changes shall be versioned and automated.

**Acceptance Criteria:**
- Entity Framework migrations used
- Migration scripts version controlled
- Rollback capability for migrations
- Migrations tested before production deployment

---

### 3.8 Compliance Requirements

#### REQ-COMP-001: Data Retention
**Priority:** Should Have  
**Description:** System shall comply with data retention policies.

**Acceptance Criteria:**
- Shipment data retained for 7 years (customs requirement)
- BOL documents retained for 7 years
- Audit logs retained for 90 days minimum
- User can request data export (GDPR)
- Data deletion process for closed tenants

---

#### REQ-COMP-002: Audit Trail
**Priority:** Must Have  
**Description:** System shall maintain audit trail for compliance.

**Acceptance Criteria:**
- All data modifications logged with user ID
- Timestamps in UTC
- Immutable audit logs
- Admin cannot delete audit logs
- Audit logs exportable for compliance review

---

## 4. User Stories

### US-001: Tenant Registration
**As a** business owner  
**I want to** register my company as a new tenant  
**So that** my team can start using the platform

**Acceptance Criteria:**
- Can complete registration in <5 minutes
- Receive confirmation email immediately
- Can login after email verification

---

### US-002: User Login
**As a** registered user  
**I want to** login securely to the platform  
**So that** I can access my shipment data

**Acceptance Criteria:**
- Login with email and password
- Receive error message if credentials wrong
- Stay logged in for 7 days with refresh token

---

### US-003: Manage Team Members
**As a** Tenant Admin  
**I want to** add and manage team members  
**So that** my organization can collaborate on shipments

**Acceptance Criteria:**
- Add users with role assignment
- Deactivate users who leave organization
- View list of all team members

---

### US-004: Create Shipment Record
**As a** customs officer  
**I want to** create a shipment record  
**So that** I can track vessel arrival and process customs clearance

**Acceptance Criteria:**
- Enter shipment details in <2 minutes
- Auto-save draft entries
- Receive confirmation after creation

---

### US-005: Track Vessel ETA
**As a** customs officer  
**I want** automatic ETA updates from vessel tracking  
**So that** I don't have to manually check vessel positions

**Acceptance Criteria:**
- ETA automatically updated every 4 hours
- See ETA change history
- Receive notification when ETA changes significantly (>6 hours)

---

### US-006: View Shipment Dashboard
**As a** customs officer  
**I want to** see all my shipments in one place  
**So that** I can monitor multiple shipments efficiently

**Acceptance Criteria:**
- See shipments sorted by ETA
- Filter by status
- Search by vessel or shipment number

---

### US-007: Update Shipment Status
**As a** customs officer  
**I want to** update shipment status when vessel arrives  
**So that** my team knows clearance can begin

**Acceptance Criteria:**
- Change status with one click
- Record actual arrival time
- See who updated status and when

---

### US-008: Upload Bill of Lading
**As a** customs officer  
**I want to** upload a Bill of Lading photo  
**So that** the system can extract data automatically

**Acceptance Criteria:**
- Upload from mobile phone camera
- See upload progress
- Get notification when processing completes

---

### US-009: Review Extracted BOL Data
**As a** customs officer  
**I want to** review OCR-extracted data  
**So that** I can correct any errors before saving

**Acceptance Criteria:**
- See confidence scores for each field
- Easily edit incorrect data
- Save in <1 minute

---

### US-010: Receive ETA Notifications
**As a** customs officer  
**I want to** receive WhatsApp alerts when vessel is arriving  
**So that** I can prepare customs clearance in advance

**Acceptance Criteria:**
- Receive notification 24 hours before arrival
- Message includes all key shipment details
- Can opt-out via message link

---

### US-011: Generate CEISA Documents
**As a** customs officer  
**I want to** generate CEISA-compliant Excel files  
**So that** I can submit customs declarations quickly

**Acceptance Criteria:**
- Generate document with one click
- Download within 5 seconds
- File formatted correctly for CEISA import

---

### US-012: Manage Notification Preferences
**As a** user  
**I want to** control my notification settings  
**So that** I only receive relevant alerts

**Acceptance Criteria:**
- Enable/disable WhatsApp notifications
- Update phone number
- Test notification delivery

---

## 5. Requirements Traceability Matrix

| Requirement ID | User Story | Design Component | Test Case | Priority |
|---------------|-----------|------------------|-----------|----------|
| REQ-FUNC-001 | US-001 | Identity.API | TC-001 | Must Have |
| REQ-FUNC-002 | US-002 | Identity.API | TC-002 | Must Have |
| REQ-FUNC-003 | US-003 | Identity.API | TC-003 | Must Have |
| REQ-FUNC-004 | US-004 | Shipment.API | TC-004 | Must Have |
| REQ-FUNC-005 | US-005 | Shipment.API + Background Job | TC-005 | Must Have |
| REQ-FUNC-006 | US-006 | Shipment.API | TC-006 | Must Have |
| REQ-FUNC-007 | US-007 | Shipment.API | TC-007 | Must Have |
| REQ-FUNC-008 | US-008 | Shipment.API + Blob Storage | TC-008 | Must Have |
| REQ-FUNC-009 | US-009 | Shipment.API + Azure Doc Intel | TC-009 | Must Have |
| REQ-FUNC-010 | US-009 | Shipment.API | TC-010 | Must Have |
| REQ-FUNC-011 | US-009 | Shipment.API | TC-011 | Must Have |
| REQ-FUNC-012 | US-010 | Notification Service + Twilio | TC-012 | Must Have |
| REQ-FUNC-013 | US-012 | Identity.API | TC-013 | Must Have |
| REQ-FUNC-014 | US-011 | Document.API + EPPlus | TC-014 | Must Have |
| REQ-FUNC-015 | US-011 | Document.API | TC-015 | Must Have |
| REQ-FUNC-016 | - | Document.API | TC-016 | Should Have |
| REQ-FUNC-017 | - | Identity.API | TC-017 | Should Have |
| REQ-FUNC-018 | - | All Services | TC-018 | Should Have |

---

## 6. Constraints and Assumptions

### 6.1 Constraints
- MVP must launch within 8 weeks
- Budget allocated for external services: $500/month initially
- Development team: 2-4 developers
- Must use .NET 8.0 and SQL Server 2022
- No native mobile apps in MVP (API only)

### 6.2 Assumptions
- MarineTraffic API provides accurate ETA data
- Azure Document Intelligence achieves >95% OCR accuracy
- Twilio WhatsApp approval obtained within 3 weeks
- SQL Server multi-tenancy is sufficient for MVP scale
- Users have access to WhatsApp for notifications
- CEISA Excel format remains stable
- Users comfortable with Excel for document submission

---

## 7. Dependencies

### 7.1 External Dependencies
- Azure Document Intelligence service availability
- MarineTraffic API service availability
- Twilio WhatsApp Business API approval
- Azure infrastructure (App Service, SQL, Blob Storage)
- .NET 8.0 SDK and runtime

### 7.2 Internal Dependencies
- Identity service must be complete before other services
- Database schema must be finalized before development
- OCR integration required before document generation
- Vessel tracking required before notifications

---

## 8. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Technical Lead | | | |
| Security Officer | | | |
| Project Manager | | | |

---

**Document Status:** ✅ Ready for Review  
**Next Step:** Stakeholder approval and design phase initiation

**Prepared By:** Planning Team  
**Review Date:** December 8, 2025
