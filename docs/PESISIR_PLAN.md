# Pesisir Customs Business Application - MVP Plan

**Project Name:** Pesisir  
**Type:** Multi-Tenant Customs Business Automation Platform  
**Planning Date:** December 7, 2025  
**Last Updated:** December 8, 2025  
**SDLC Phase:** Planning

---

## Executive Summary

Pesisir is a one-stop solution for customs business operations. The MVP focuses on two core services:

1. **Shipment Record Management** - Automated vessel tracking, ETA notifications, and Bill of Lading OCR processing
2. **Customs Document Draft Automation** - Excel-based CEISA document generation with future API integration capability

**Architecture Decision:** Modular Monolith with Blazor Server for faster MVP delivery, easier debugging, built-in real-time capabilities via SignalR, and simplified deployment. Can be split into microservices post-MVP if scaling demands it.

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
- Real-time dashboard updates via SignalR

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

### Application Architecture

- **Framework:** .NET 8.0 (LTS)
- **Architecture Pattern:** Modular Monolith
- **Frontend:** Blazor Server with SignalR
- **UI Component Library:** MudBlazor (Material Design)
- **Database:** SQL Server 2022 (already configured in docker-compose)
- **ORM:** Entity Framework Core 8.0
- **Authentication:** Cookie-based authentication with ASP.NET Core Identity
- **Background Jobs:** Hangfire with SQL Server storage

### Project Structure

```
Pesisir.Web/
├── Program.cs
├── App.razor
├── Pages/                          # Blazor pages
│   ├── Index.razor
│   ├── Login.razor
│   ├── Dashboard.razor
│   ├── Shipments/
│   │   ├── ShipmentList.razor
│   │   ├── ShipmentDetail.razor
│   │   └── CreateShipment.razor
│   ├── Documents/
│   │   ├── DocumentList.razor
│   │   └── GenerateDocument.razor
│   └── Admin/
│       ├── UserManagement.razor
│       └── TenantSettings.razor
├── Components/                     # Shared Blazor components
│   ├── Layout/
│   │   ├── MainLayout.razor
│   │   ├── NavMenu.razor
│   │   └── LoginDisplay.razor
│   └── Shared/
│       ├── ShipmentCard.razor
│       ├── BOLUploader.razor
│       └── NotificationBell.razor
├── Modules/                        # Business logic modules
│   ├── Identity/
│   │   ├── Services/
│   │   │   ├── IAuthService.cs
│   │   │   ├── AuthService.cs
│   │   │   ├── ITenantService.cs
│   │   │   └── TenantService.cs
│   │   └── Models/
│   ├── Shipment/
│   │   ├── Services/
│   │   │   ├── IShipmentService.cs
│   │   │   ├── ShipmentService.cs
│   │   │   ├── IBOLService.cs
│   │   │   └── BOLService.cs
│   │   └── Models/
│   ├── Document/
│   │   ├── Services/
│   │   │   ├── IDocumentService.cs
│   │   │   ├── DocumentService.cs
│   │   │   ├── IExcelGeneratorService.cs
│   │   │   └── ExcelGeneratorService.cs
│   │   └── Models/
│   └── Notification/
│       ├── Services/
│       │   ├── INotificationService.cs
│       │   ├── NotificationService.cs
│       │   └── WhatsAppService.cs
│       └── Models/
├── Domain/                         # Domain entities
│   ├── Entities/
│   │   ├── Tenant.cs
│   │   ├── User.cs
│   │   ├── Shipment.cs
│   │   ├── BillOfLading.cs
│   │   ├── Document.cs
│   │   └── Notification.cs
│   ├── ValueObjects/
│   └── Events/
├── Infrastructure/                 # Data access & external services
│   ├── Data/
│   │   ├── PesisirDbContext.cs
│   │   ├── Repositories/
│   │   └── Migrations/
│   ├── ExternalServices/
│   │   ├── AzureDocumentIntelligence/
│   │   ├── MarineTrafficApi/
│   │   └── TwilioWhatsApp/
│   └── BackgroundJobs/
│       ├── OcrProcessingJob.cs
│       ├── EtaMonitoringJob.cs
│       └── NotificationDispatchJob.cs
└── wwwroot/                        # Static files
    ├── css/
    ├── js/
    └── templates/                  # Excel templates
        └── ceisa/
```

### Application Modules

#### 1. Identity Module (`Modules/Identity/`)

**Responsibilities:**

- User authentication and authorization
- Tenant management and provisioning
- Role-based access control (Tenant Admin, User)
- User profile management

**Key Services:**

- `AuthService` - Login, logout, session management
- `TenantService` - Tenant CRUD, settings management
- `UserService` - User management within tenant

#### 2. Shipment Module (`Modules/Shipment/`)

**Responsibilities:**

- Shipment CRUD operations with tenant isolation
- Bill of Lading management
- Vessel tracking integration
- ETA monitoring and updates

**Key Services:**

- `ShipmentService` - Shipment business logic
- `BOLService` - BOL OCR processing coordination
- `VesselTrackingService` - MarineTraffic API integration

#### 3. Document Module (`Modules/Document/`)

**Responsibilities:**

- Document draft management
- Excel template processing
- CEISA format generation
- Template versioning

**Key Services:**

- `DocumentService` - Document CRUD operations
- `ExcelGeneratorService` - EPPlus-based generation
- `TemplateService` - Template management

#### 4. Notification Module (`Modules/Notification/`)

**Responsibilities:**

- Multi-channel notification dispatch
- User notification preferences
- Delivery status tracking
- Notification queue management

**Key Services:**

- `NotificationService` - Notification orchestration
- `WhatsAppService` - Twilio integration
- `NotificationQueueService` - Queue management

### Core Infrastructure Components

#### Domain Layer (`Domain/`)

**Entities:**

- Core business entities (Tenant, User, Shipment, etc.)
- Entity base classes with audit fields
- Value objects for domain concepts

**Why separated:**

- Clear business logic boundaries
- Reusable across modules
- Easier testing and validation

#### Infrastructure Layer (`Infrastructure/`)

**Data Access:**

- Single `PesisirDbContext` with all entities
- Repository pattern for data access
- EF Core query filters for multi-tenancy
- Database migrations

**External Services:**

- Azure Document Intelligence client wrapper
- MarineTraffic API HTTP client
- Twilio WhatsApp client wrapper
- Azure Blob Storage for file management

**Background Jobs:**

- Hangfire job definitions
- Recurring job schedules
- Job retry logic and error handling

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

#### Excel Processing: EPPlus

**For CEISA Document Generation:**

- NuGet Package: `EPPlus` (v7.0+)
- Template-based Excel generation
- Dynamic data mapping from shipment records
- CEISA-compliant formatting
- Support for complex formulas and styling

#### UI Component Library: MudBlazor

**Why MudBlazor:**

- Material Design components out-of-the-box
- 60+ production-ready components
- Excellent Blazor Server support
- Built-in data grids, forms, file upload, dialogs
- Dark/light theme support
- Active community and comprehensive documentation
- Free and open-source (MIT license)

**NuGet Package:** `MudBlazor`

**Key Components for Pesisir:**

- `MudDataGrid` - Shipment and document listings
- `MudForm` + `MudTextField` - Data entry forms
- `MudFileUpload` - BOL document upload
- `MudDialog` - Confirmation dialogs
- `MudSnackbar` - Toast notifications
- `MudDrawer` - Navigation sidebar
- `MudAppBar` - Top navigation with user menu

#### Background Job Processing: Hangfire

**Why Hangfire:**

- Native .NET integration, no separate infrastructure
- Built-in dashboard UI at `/hangfire`
- Automatic retry logic with exponential backoff
- Persistent job storage in SQL Server
- Recurring job scheduling with cron expressions
- Distributed locks for clustered environments
- Excellent monitoring and debugging tools

**NuGet Packages:**

- `Hangfire.Core`
- `Hangfire.SqlServer`
- `Hangfire.AspNetCore`

**Configured Jobs:**

1. **OCR Processing Job**

   - Process uploaded BOL documents from queue
   - Retry on failure (max 3 attempts)
   - Notify user on completion

2. **ETA Monitoring Job**

   - Poll MarineTraffic API every 4 hours
   - Update shipment ETA in database
   - Trigger notifications if arrival within 24 hours

3. **Notification Dispatch Job**

   - Process pending notifications from queue
   - Send via Twilio WhatsApp
   - Update delivery status

4. **Data Cleanup Job**
   - Archive old shipments (based on retention policy)
   - Clean up expired sessions
   - Database maintenance tasks

---

## Blazor Server Architecture

### Authentication Strategy

**Cookie-based Authentication** (not JWT)

- ASP.NET Core Identity with Cookie authentication
- Tenant context resolved from authenticated user claims
- Session maintained via SignalR circuit
- Remember me functionality for persistent login

**Key Components:**

```csharp
// Custom AuthenticationStateProvider
public class CustomAuthStateProvider : AuthenticationStateProvider
{
    public override Task<AuthenticationState> GetAuthenticationStateAsync();
    public async Task UpdateAuthenticationState(ClaimsPrincipal user);
    public async Task LogoutAsync();
}

// TenantContext (Scoped per circuit)
public class TenantContext
{
    public Guid TenantId { get; set; }
    public string CompanyName { get; set; }
    public TenantSettings Settings { get; set; }
}
```

### State Management

**Scoped Services per Circuit:**

- `TenantContext` - Automatically injected in all components
- `AuthenticationStateProvider` - Manages user session
- Circuit-scoped services prevent cross-tenant contamination

**Component State:**

- Use `@code` blocks for local component state
- `StateHasChanged()` for manual UI updates
- Cascading parameters for parent-child communication

### Real-time Updates

**Built-in SignalR Connection:**

- Automatic reconnection on network issues
- Push ETA updates to dashboard without polling
- Real-time notification status updates
- Live OCR processing progress indicators

**Example Implementation:**

```razor
@inject IShipmentService ShipmentService
@implements IAsyncDisposable

<MudDataGrid Items="@shipments" />

@code {
    private List<Shipment> shipments = new();
    private IDisposable? subscription;

    protected override async Task OnInitializedAsync()
    {
        shipments = await ShipmentService.GetShipments();

        // Subscribe to real-time updates
        subscription = await ShipmentService.SubscribeToUpdates(OnShipmentUpdated);
    }

    private async Task OnShipmentUpdated(Shipment shipment)
    {
        var index = shipments.FindIndex(s => s.ShipmentId == shipment.ShipmentId);
        if (index >= 0)
            shipments[index] = shipment;

        await InvokeAsync(StateHasChanged); // Update UI
    }

    public async ValueTask DisposeAsync()
    {
        subscription?.Dispose();
    }
}
```

### Performance Considerations

**For Multi-Tenant Blazor Server:**

- **Circuit timeout:** 3 minutes idle (configurable)
- **Max buffer size:** 32KB for SignalR messages
- **Concurrent circuits:** Monitor per-tenant limits
- **Lazy loading:** Load shipment data on-demand
- **Virtualization:** Use `MudVirtualize` for large data grids
- **Prerendering:** Disable for authenticated pages (security)

**Memory Management:**

- Dispose subscriptions in `IAsyncDisposable`
- Clear large collections when navigating away
- Use weak references for event handlers

### Deployment Architecture

**Single Container/App Service:**

- Simplified deployment vs microservices
- One SQL Server connection pool
- Shared appsettings.json configuration
- Horizontal scaling with sticky sessions

**Scaling Strategy:**

- Azure App Service with 2+ instances
- Azure SignalR Service for distributed SignalR
- Redis for Hangfire distributed locks
- SQL Server connection pooling (min 10, max 100)

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

- All entities include `TenantId` column (GUID)
- EF Core Global Query Filters for automatic tenant scoping
- Tenant context resolved from authentication claims
- Separate `Tenants` table for tenant metadata

**Example Entity:**

```csharp
public class Shipment
{
    public Guid ShipmentId { get; set; }
    public Guid TenantId { get; set; } // Automatic filtering
    public string ShipmentNumber { get; set; }
    // ... other properties

    public Tenant Tenant { get; set; }
}
```

**EF Core Configuration:**

```csharp
modelBuilder.Entity<Shipment>()
    .HasQueryFilter(s => s.TenantId == _tenantContext.TenantId);
```

#### Security Measures:

- **Authentication:** Cookie-based, claims include TenantId
- **Authorization:** Custom authorization handlers validate tenant access
- **Database constraints:** Composite unique indexes with TenantId
- **Query filters:** Automatic in all LINQ queries
- **Validation:** Middleware validates TenantId on every request
- **Audit logging:** Track all data access per tenant

#### Tenant Management:

- **Self-service registration:** Public registration page
- **Unique identifiers:** Subdomain-based (tenant.pesisir.com)
- **Tenant settings:** JSON column for flexible configuration
- **Admin capabilities:** Manage users, settings, WhatsApp config
- **Subscription tiers:** Free trial, Standard, Enterprise

---

## Database Schema Design

### Core Entities

#### Tenants

```
- TenantId (PK, GUID)
- CompanyName (nvarchar(200), not null)
- Subdomain (nvarchar(50), unique, not null)
- CreatedAt (datetime2, not null)
- UpdatedAt (datetime2)
- IsActive (bit, default 1)
- SubscriptionTier (nvarchar(50))
- Settings (nvarchar(max), JSON)
  {
    "whatsappEnabled": true,
    "notificationPreferences": {...},
    "excelTemplateVersion": "1.0"
  }
```

**Indexes:**

- `IX_Tenants_Subdomain` (Subdomain, unique)
- `IX_Tenants_IsActive` (IsActive)

#### Users

```
- UserId (PK, GUID)
- TenantId (FK, GUID, indexed)
- Email (nvarchar(256), unique)
- PasswordHash (nvarchar(max))
- FullName (nvarchar(200))
- Role (nvarchar(50): "Admin" | "User")
- PhoneNumber (nvarchar(20))
- WhatsAppOptIn (bit, default 0)
- CreatedAt (datetime2)
- UpdatedAt (datetime2)
- LastLoginAt (datetime2, nullable)
- IsActive (bit, default 1)
```

**Indexes:**

- `IX_Users_TenantId_Email` (TenantId, Email)
- `IX_Users_TenantId_IsActive` (TenantId, IsActive)

#### Shipments

```
- ShipmentId (PK, GUID)
- TenantId (FK, GUID, indexed)
- ShipmentNumber (nvarchar(50), unique within tenant)
- VesselName (nvarchar(200))
- VesselIMO (nvarchar(20), indexed)
- VoyageNumber (nvarchar(50))
- PortOfLoading (nvarchar(100))
- PortOfDischarge (nvarchar(100))
- CarrierName (nvarchar(200))
- ContainerNumbers (nvarchar(max), JSON array)
- Incoterms (nvarchar(10))
- EstimatedTimeOfArrival (datetime2)
- ActualTimeOfArrival (datetime2, nullable)
- Status (nvarchar(50): "InTransit" | "Arrived" | "Cleared")
- CreatedAt (datetime2)
- UpdatedAt (datetime2)
- CreatedBy (FK to Users)
- UpdatedBy (FK to Users, nullable)
```

**Indexes:**

- `IX_Shipments_TenantId_Status` (TenantId, Status)
- `IX_Shipments_VesselIMO` (VesselIMO)
- `IX_Shipments_ETA` (EstimatedTimeOfArrival)

#### BillsOfLading

```
- BillOfLadingId (PK, GUID)
- ShipmentId (FK, GUID)
- TenantId (FK, GUID, indexed)
- BLNumber (nvarchar(100), unique)
- ShipperName (nvarchar(200))
- ShipperAddress (nvarchar(500))
- ConsigneeName (nvarchar(200))
- ConsigneeAddress (nvarchar(500))
- NotifyParty (nvarchar(200))
- CargoDescription (nvarchar(max))
- GrossWeight (decimal(18,2))
- PackageCount (int)
- OCRConfidenceScore (decimal(5,2))
- OriginalDocumentUrl (nvarchar(500))
- ExtractedData (nvarchar(max), JSON)
- ProcessedAt (datetime2)
- CreatedAt (datetime2)
- CreatedBy (FK to Users)
```

**Indexes:**

- `IX_BillsOfLading_TenantId_ShipmentId` (TenantId, ShipmentId)
- `IX_BillsOfLading_BLNumber` (BLNumber, unique)

#### Documents

```
- DocumentId (PK, GUID)
- ShipmentId (FK, GUID)
- TenantId (FK, GUID, indexed)
- DocumentType (nvarchar(100): "CustomsDeclaration" | "ImportPermit" | etc)
- DocumentNumber (nvarchar(100))
- Status (nvarchar(50): "Draft" | "Generated" | "Submitted")
- TemplateVersion (nvarchar(20))
- ExcelFileUrl (nvarchar(500))
- CEISAReferenceNumber (nvarchar(100), nullable)
- GeneratedAt (datetime2)
- SubmittedAt (datetime2, nullable)
- CreatedAt (datetime2)
- CreatedBy (FK to Users)
```

**Indexes:**

- `IX_Documents_TenantId_Status` (TenantId, Status)
- `IX_Documents_ShipmentId` (ShipmentId)

#### Notifications

```
- NotificationId (PK, GUID)
- TenantId (FK, GUID, indexed)
- UserId (FK, GUID)
- ShipmentId (FK, GUID, nullable)
- Type (nvarchar(50): "ETAArrival" | "DocumentReady" | "SystemAlert")
- Channel (nvarchar(50): "WhatsApp" | "Email" | "InApp")
- Recipient (nvarchar(200))
- Message (nvarchar(1000))
- Status (nvarchar(50): "Pending" | "Sent" | "Delivered" | "Failed")
- ErrorMessage (nvarchar(max), nullable)
- SentAt (datetime2, nullable)
- DeliveredAt (datetime2, nullable)
- CreatedAt (datetime2)
- RetryCount (int, default 0)
```

**Indexes:**

- `IX_Notifications_TenantId_Status` (TenantId, Status)
- `IX_Notifications_UserId` (UserId)
- `IX_Notifications_CreatedAt` (CreatedAt DESC)

---

## Implementation Phases

### Phase 0: Learning & Setup (Week 1-2)

**Learning Objectives:**

- C# fundamentals (if needed)
- Blazor Server basics
- MudBlazor component library
- Entity Framework Core
- Hangfire basics

**Setup Tasks:**

- Install .NET 8 SDK
- Install SQL Server (Docker)
- Install Visual Studio 2022 or VS Code + C# extension
- Create GitHub repository
- Setup Azure account (free tier)

**Deliverables:**

- Working dev environment
- "Hello World" Blazor app
- Simple MudBlazor demo
- Basic EF Core CRUD app

### Phase 1: Foundation & Infrastructure (Week 3-4)

**Objectives:**

- Set up .NET 8.0 Blazor Server solution structure
- Implement multi-tenant database schema
- Set up Entity Framework Core with migrations
- Configure cookie-based authentication
- Set up Hangfire with SQL Server storage
- Configure MudBlazor theme and layout

**Tasks:**

1. Create solution structure (Day 1)

   - Create Blazor Server project
   - Setup folder structure (Modules, Domain, Infrastructure)
   - Configure appsettings.json

2. Database setup (Day 2-3)

   - Design EF Core entities
   - Create DbContext with query filters
   - Initial migration
   - Seed test data

3. Authentication setup (Day 4-5)

   - Configure ASP.NET Core Identity
   - Create CustomAuthStateProvider
   - Implement TenantContext service
   - Build login/logout pages

4. Hangfire configuration (Day 6)

   - Install Hangfire packages
   - Configure SQL Server storage
   - Setup dashboard authorization
   - Create job base classes

5. UI framework setup (Day 7)
   - Install MudBlazor
   - Create MainLayout with navigation
   - Setup theme (colors, typography)
   - Create shared components

**Deliverables:**

- ✅ Working modular monolith project structure
- ✅ Database with migrations
- ✅ Cookie authentication working
- ✅ Tenant context resolution
- ✅ Hangfire dashboard at `/hangfire`
- ✅ Basic Blazor layout with MudBlazor

### Phase 2: Identity & Tenant Management (Week 5)

**Objectives:**

- Build tenant registration page
- Implement user management pages
- Create login/logout flows
- Set up tenant admin pages

**Tasks:**

1. Tenant registration (Day 1-2)

   - Registration page with form validation
   - Subdomain uniqueness check
   - Email verification (optional for MVP)
   - Auto-create admin user

2. User management (Day 3-4)

   - User list page with MudDataGrid
   - Add/edit/delete user dialogs
   - Role assignment
   - Password reset functionality

3. Authentication pages (Day 5)
   - Login page with remember me
   - Logout functionality
   - Unauthorized/forbidden pages
   - User profile page

**Deliverables:**

- ✅ Tenant self-service registration
- ✅ User management pages (CRUD with MudDataGrid)
- ✅ Login/logout pages
- ✅ Role-based page authorization
- ✅ Tenant settings page

### Phase 3: Shipment Module & BOL OCR (Week 6-8)

**Objectives:**

- Implement shipment CRUD with tenant scoping
- Integrate Azure Document Intelligence for BOL processing
- Build file upload component with progress
- Create Hangfire job for OCR queue processing
- Integrate MarineTraffic API for vessel data
- Implement ETA monitoring background job

**Tasks:**

**Week 6: Shipment Management**

1. Shipment pages (Day 1-3)

   - Shipment list with filtering/sorting
   - Shipment detail page
   - Create/edit shipment forms
   - Validation and error handling

2. Shipment service (Day 4-5)
   - ShipmentService with CRUD operations
   - Tenant-scoped queries
   - Status transitions
   - Business logic validation

**Week 7: BOL OCR Integration**

3. Azure Document Intelligence setup (Day 1-2)

   - Create Azure resource
   - Configure SDK client
   - Test with sample BOL documents
   - Implement confidence thresholds

4. File upload component (Day 3-4)

   - MudFileUpload with drag-drop
   - Progress indicator
   - File validation (size, type)
   - Upload to Azure Blob Storage

5. OCR processing (Day 5)
   - Queue BOL for processing
   - Hangfire OCR job
   - Extract data to BillOfLading entity
   - Notify user on completion

**Week 8: Vessel Tracking**

6. MarineTraffic integration (Day 1-2)

   - HTTP client setup
   - API wrapper service
   - Vessel search by IMO
   - ETA retrieval

7. ETA monitoring job (Day 3-4)

   - Recurring Hangfire job (every 4 hours)
   - Update shipment ETA
   - Cache vessel data
   - Trigger notifications

8. Dashboard & real-time updates (Day 5)
   - Dashboard page with stats
   - Real-time ETA updates via SignalR
   - Shipment status cards
   - Recent activity feed

**Deliverables:**

- ✅ Shipment management pages (list, detail, form)
- ✅ BOL upload with OCR extraction
- ✅ Automated ETA updates from MarineTraffic
- ✅ Real-time dashboard with SignalR
- ✅ Background jobs running reliably

### Phase 4: Notification Module (Week 9)

**Objectives:**

- Integrate Twilio WhatsApp API
- Build notification service
- Implement ETA threshold alerts
- Create user notification preferences page
- Set up webhook for delivery status

**Tasks:**

1. Twilio WhatsApp setup (Day 1)

   - Create Twilio account
   - Apply for WhatsApp Business approval (or use sandbox)
   - Configure webhook endpoint
   - Test message sending

2. Notification service (Day 2-3)

   - NotificationService with queue
   - WhatsAppService wrapper
   - Message templates
   - Retry logic

3. Notification dispatch job (Day 3)

   - Hangfire job for pending notifications
   - Rate limiting (per tenant)
   - Delivery status tracking
   - Error handling

4. User preferences (Day 4)

   - Notification settings page
   - WhatsApp opt-in/opt-out
   - Notification type selection
   - Phone number verification

5. ETA alerts (Day 5)
   - Check shipments arriving in 24 hours
   - Create notifications
   - Send via WhatsApp
   - Mark as sent

**Deliverables:**

- ✅ WhatsApp notification sending
- ✅ Notification preferences page
- ✅ ETA arrival alerts (24 hours before)
- ✅ Notification history page with status
- ✅ Webhook handling for delivery confirmation

### Phase 5: Document Module & Excel Generation (Week 10)

**Objectives:**

- Build document draft management pages
- Implement Excel template engine using EPPlus
- Create CEISA document templates
- Map shipment/BOL data to Excel formats
- Build document download functionality

**Tasks:**

1. Document pages (Day 1-2)

   - Document list with filtering
   - Generate document dialog
   - Document preview/download
   - Template selection

2. Excel generation service (Day 3-4)

   - ExcelGeneratorService with EPPlus
   - Load template from blob storage
   - Map data to cells
   - Apply formatting

3. CEISA templates (Day 4-5)

   - Create Excel templates
   - Define data mapping configuration
   - Test with real data
   - Version control templates

4. Document workflow (Day 5)
   - Generate document from shipment
   - Save to blob storage
   - Update document status
   - Download functionality

**Deliverables:**

- ✅ Document draft pages (list, generate, download)
- ✅ Excel generation from templates
- ✅ CEISA-compliant document formats
- ✅ Document versioning support

### Phase 6: Testing & Deployment (Week 11)

**Objectives:**

- Unit tests for critical business logic
- Integration tests for key workflows
- End-to-end testing with Playwright
- Docker deployment configuration
- CI/CD pipeline setup (GitHub Actions)
- Production deployment to Azure

**Tasks:**

1. Testing (Day 1-3)

   - Unit tests for services (xUnit)
   - Integration tests for repositories
   - Blazor component tests (bUnit)
   - E2E tests for critical flows (Playwright)
   - Test coverage report (70%+ target)

2. Docker setup (Day 3-4)

   - Create Dockerfile for Blazor app
   - Docker Compose with SQL Server + Redis
   - Test local deployment
   - Optimize image size

3. CI/CD pipeline (Day 4-5)

   - GitHub Actions workflow
   - Build and test on push
   - Publish Docker image to ACR
   - Deploy to Azure App Service

4. Production deployment (Day 5)
   - Azure App Service configuration
   - Connection strings in Key Vault
   - Database migration
   - SSL/TLS setup
   - Monitor application

**Deliverables:**

- ✅ Test coverage report (70%+ services)
- ✅ Docker Compose for local dev
- ✅ GitHub Actions CI/CD pipeline
- ✅ Production deployment on Azure
- ✅ Deployment documentation

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

- **Docker Desktop:** SQL Server 2022 container, Redis container (optional)
- **Visual Studio 2022 or VS Code:** With C# extension
- **.NET 8 SDK:** Latest stable version
- **SQL Server Management Studio:** For database management (optional)
- **Postman:** For API testing (Hangfire dashboard, webhooks)

### NuGet Packages

**Core Packages:**

```xml
<!-- Blazor & UI -->
<PackageReference Include="MudBlazor" Version="7.0.0" />

<!-- Database -->
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.0" />

<!-- Authentication -->
<PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="8.0.0" />
<PackageReference Include="Microsoft.AspNetCore.Components.Authorization" Version="8.0.0" />

<!-- Background Jobs -->
<PackageReference Include="Hangfire.Core" Version="1.8.0" />
<PackageReference Include="Hangfire.SqlServer" Version="1.8.0" />
<PackageReference Include="Hangfire.AspNetCore" Version="1.8.0" />

<!-- Azure Services -->
<PackageReference Include="Azure.AI.FormRecognizer" Version="4.1.0" />
<PackageReference Include="Azure.Storage.Blobs" Version="12.19.0" />
<PackageReference Include="Azure.Identity" Version="1.10.0" />

<!-- External APIs -->
<PackageReference Include="Twilio" Version="6.15.0" />

<!-- Excel -->
<PackageReference Include="EPPlus" Version="7.0.0" />

<!-- Utilities -->
<PackageReference Include="Serilog.AspNetCore" Version="8.0.0" />
<PackageReference Include="FluentValidation" Version="11.9.0" />
```

---

## Security Considerations

### Data Privacy & Compliance

- **Tenant Isolation:** Strict row-level security prevents cross-tenant data access via EF Core query filters
- **Encryption at Rest:** SQL Server TDE (Transparent Data Encryption) for database
- **Encryption in Transit:** HTTPS/TLS for all communication (enforced via HSTS)
- **Sensitive Data:** Phone numbers and API keys encrypted in database
- **Secrets Management:** Azure Key Vault for connection strings and API keys
- **Audit Logging:** Track all data access and modifications per tenant (CreatedBy, UpdatedBy fields)

### Authentication & Authorization

- **Cookie Authentication:** Secure, HTTP-only cookies with SameSite=Strict
- **Session timeout:** 1 hour for access, 30 days for "remember me"
- **Role-Based Access:** Tenant Admin (full access), User (limited access)
- **Policy-Based Authorization:** Custom policies for fine-grained control
- **Circuit security:** Validate TenantId on every Blazor circuit
- **CSRF Protection:** Built-in with Blazor Server

### Application Security

- **Rate Limiting:** Per-tenant limits for API calls and background jobs
- **Input Validation:** FluentValidation on all user inputs
- **SQL Injection:** Protected via EF Core parameterized queries
- **XSS Protection:** Blazor automatic encoding
- **File Upload:** Validate file types, scan for malware (optional), size limits
- **CORS:** Not needed for Blazor Server (same origin)

### Operational Security

- **Logging:** Serilog with structured logging, no sensitive data in logs
- **Monitoring:** Application Insights for exceptions and performance
- **Backup:** Automated SQL database backups (daily, 7-day retention)
- **Disaster Recovery:** RTO: 4 hours, RPO: 1 hour
- **Penetration Testing:** Before production launch

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

**Impact:** Critical - Data breach  
**Mitigation:**

- Comprehensive integration tests for tenant isolation (every query)
- Code review checklist for `.IgnoreQueryFilters()` usage
- Automated tests for cross-tenant access attempts
- Security audit before production (external if budget allows)
- Penetration testing with tenant context

### Risk 6: Blazor Server Circuit Overload

**Impact:** Medium - Performance degradation  
**Mitigation:**

- Monitor concurrent circuit count per tenant
- Set circuit limits in configuration (max 100 per tenant)
- Implement circuit timeout (3 minutes idle)
- Azure SignalR Service for horizontal scaling
- Lazy load data, use virtualization for grids

### Risk 7: Learning Curve for .NET/Blazor

**Impact:** Medium - Delays MVP  
**Mitigation:**

- Allocate 2 weeks for focused learning (Phase 0)
- Use Microsoft Learn (free, excellent quality)
- Start with simple CRUD before complex features
- ChatGPT/GitHub Copilot for troubleshooting
- Budget extra time in early phases

---

## Success Metrics (KPIs)

### Operational Metrics

- **OCR Accuracy Rate:** Target >95% for Bill of Lading field extraction
- **ETA Prediction Accuracy:** Compare MarineTraffic ETA vs actual arrival times
- **Notification Delivery Rate:** >99% successful WhatsApp message delivery
- **Excel Generation Success Rate:** Target 100% error-free document generation

### User Experience Metrics

- **Average OCR Processing Time:** <30 seconds per BOL document (from upload to results)
- **ETA Update Frequency:** Check every 4 hours, updates reflected within 5 minutes on dashboard
- **Document Generation Time:** <5 seconds per Excel document
- **Page Load Time:** <2 seconds for dashboard, <1 second for subsequent navigation (Blazor SPA)
- **User Adoption Rate:** Active users per tenant per month (target 80% of registered users)

### Business Metrics

- **Tenant Onboarding Time:** <30 minutes from registration to first shipment created
- **Time Saved per Shipment:** Compare manual vs automated workflows (target 50% reduction)
- **Error Reduction:** Decrease in data entry errors compared to manual process (target 90% reduction)
- **Customer Satisfaction:** NPS score >50 from tenant admins
- **Retention Rate:** >80% of tenants active after 3 months

### Technical Metrics

- **Uptime:** >99.5% availability (Azure SLA)
- **API Response Time:** P95 <500ms for CRUD operations
- **Database Query Performance:** P95 <100ms for filtered queries
- **Memory Usage:** <500MB per instance average
- **Circuit Count:** Monitor avg/max concurrent circuits per instance

---

## Future Enhancements (Post-MVP)

### Short-Term (3-6 months)

- **Direct CEISA API integration** for automated document submission
- **Mobile-responsive Blazor UI** (optimize for tablet/mobile browsers)
- **Advanced analytics dashboard** with charts (shipment trends, clearance times)
- **PDF document generation** alongside Excel (branded invoices, BOL copies)
- **Email notification channel** as alternative to WhatsApp
- **Blazor WebAssembly option** for offline capability
- **Multi-language support** (English, Bahasa Indonesia)

### Medium-Term (6-12 months)

- **AI-powered HS Code suggestions** (customs tariff classification)
- **Integration with shipping lines** for direct data feeds (Maersk, MSC APIs)
- **Customs duty calculator** with real-time tariff rates
- **Shipment cost estimation** tools (freight, customs, handling)
- **Document templates marketplace** (tenant-specific customization)
- **API for third-party integrations** (expose RESTful API)
- **Advanced reporting** (Excel/PDF export, scheduled reports)

### Long-Term (12+ months)

- **Blockchain for shipment provenance** (immutable records)
- **Integration with port community systems** (direct customs filing)
- **Predictive analytics** for clearance times using ML
- **IoT container tracking** (GPS, temperature monitoring)
- **White-label solution** for customs brokerage firms
- **Microservices migration** if scaling demands (split Shipment, Document modules)
- **Mobile native apps** (iOS/Android) with offline sync

---

## Decision Log

### Architecture Pattern Selection

**Decision:** Modular Monolith with Blazor Server  
**Date:** December 8, 2025  
**Alternatives Considered:** Microservices with separate frontend, Blazor WebAssembly, ASP.NET MVC  
**Rationale:**

- Simpler deployment and debugging for MVP
- Faster development (40% less code than MVC + microservices)
- Built-in real-time capabilities via SignalR
- Easier tenant context management (scoped services)
- Can split into microservices post-MVP if needed
- Blazor Server over WASM: Better SEO, smaller initial payload, direct DB access
- Blazor over MVC: Component-based, less JavaScript, modern development experience

### Frontend Framework Selection

**Decision:** Blazor Server (not ASP.NET MVC)  
**Date:** December 8, 2025  
**Alternatives Considered:** ASP.NET MVC, Blazor WebAssembly, React/Vue with API  
**Rationale:**

- Real-time dashboard updates built-in (SignalR)
- C# full-stack (no JavaScript context switching)
- Component-based architecture (reusable UI)
- AuthorizeView for declarative security
- Better for interactive features (file upload, live progress)
- MudBlazor provides enterprise-grade UI components

### UI Component Library Selection

**Decision:** MudBlazor  
**Date:** December 8, 2025  
**Alternatives Considered:** Radzen, Telerik, Syncfusion, Bootstrap with custom components  
**Rationale:**

- Free and open-source (MIT license)
- Material Design out-of-the-box
- 60+ production-ready components
- Excellent documentation and active community
- Built specifically for Blazor (not adapted from JS)
- MudDataGrid perfect for shipment listings

### Background Job Framework Selection

**Decision:** Hangfire  
**Date:** December 8, 2025  
**Alternatives Considered:** Quartz.NET, Azure Functions, separate Worker Service  
**Rationale:**

- No separate infrastructure needed (runs in-process)
- Built-in dashboard for monitoring (/hangfire)
- SQL Server storage (same DB, transactional)
- Automatic retry with exponential backoff
- Recurring jobs with cron expressions
- Distributed locks for scaling

### OCR Service Selection

**Decision:** Azure Document Intelligence  
**Alternatives Considered:** Azure Computer Vision, Tesseract OCR, Google Document AI  
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

### Authentication Strategy

**Decision:** Cookie-based (not JWT) for Blazor UI  
**Date:** December 8, 2025  
**Rationale:**

- Blazor Server uses stateful SignalR connections
- Cookies more secure for browser-based SPA
- JWT better for stateless APIs (future phase)
- Built-in ASP.NET Core Identity support

---

## Questions Requiring Clarification

### Resolved:

✅ **Architecture Pattern:** Modular Monolith confirmed  
✅ **Frontend Framework:** Blazor Server selected  
✅ **OCR Service:** Azure Document Intelligence selected  
✅ **ETA Provider:** MarineTraffic selected  
✅ **Notification Channel:** WhatsApp only via Twilio  
✅ **Multi-Tenancy:** Confirmed requirement  
✅ **CEISA Integration:** Excel templates prioritized for MVP  
✅ **Authentication:** Cookie-based for Blazor UI

### Pending:

1. **Azure Document Intelligence Model:** Use pre-built invoice model initially, train custom BOL model when have 5+ sample documents  
   **Recommendation:** Start with pre-built in Phase 3, collect BOL samples during development, train custom model in Phase 3 week 2

2. **MarineTraffic API Tier:** Start with Developer plan ($50/month) for Phase 3-4 testing, upgrade to Intermediate ($200/month) in Phase 5  
   **Recommendation:** Budget $50/month starting Week 6, upgrade before Phase 6

3. **Twilio WhatsApp Timeline:** Apply for production approval on Day 1, use sandbox throughout development  
   **Recommendation:** Apply immediately, expect 3-week approval, plan Phase 4 around sandbox usage

4. **Excel Template Customization:** Standardized templates for MVP, per-tenant customization in post-MVP  
   **Recommendation:** Create 3 standard CEISA templates, store in source control

5. **Initial User Limits:** 10 users per tenant for MVP (soft limit, configurable in Tenant.Settings)  
   **Recommendation:** Enforce in UI, add to subscription tier logic later

6. **Data Retention Policy:**

   - Active data: 2 years (queryable)
   - Archived data: 5 years (cold storage)
   - Cleanup job runs monthly
     **Recommendation:** Implement archive job in Phase 6

7. **Subscription Model:** Free tier (1 tenant admin + 5 users, 20 shipments/month) for MVP testing, paid tiers post-MVP  
   **Recommendation:** No payment integration for MVP, add Stripe in post-MVP

---

## Project Timeline Summary

**Total MVP Duration:** 11 weeks (including 2 weeks learning)  
**Estimated Launch Date:** Late February 2026

| Phase                              | Duration | Status      |
| ---------------------------------- | -------- | ----------- |
| Learning & Setup                   | 2 weeks  | Not Started |
| Foundation & Infrastructure        | 2 weeks  | Not Started |
| Identity & Tenant Management       | 1 week   | Not Started |
| Shipment Module & BOL OCR          | 3 weeks  | Not Started |
| Notification Module                | 1 week   | Not Started |
| Document Module & Excel Generation | 1 week   | Not Started |
| Testing & Deployment               | 1 week   | Not Started |

---

## Resources & Documentation Links

### Learning Resources

#### .NET & C#

- **Microsoft Learn - C# Fundamentals:** https://learn.microsoft.com/training/paths/csharp-first-steps/
- **Microsoft Learn - .NET 8 Web Apps:** https://learn.microsoft.com/training/paths/aspnet-core-web-app/

#### Blazor

- **Microsoft Learn - Blazor Tutorial:** https://learn.microsoft.com/training/paths/build-web-apps-with-blazor/
- **Blazor University:** https://blazor-university.com/
- **YouTube: IAmTimCorey - Blazor Series:** https://www.youtube.com/c/IAmTimCorey

#### MudBlazor

- **Official Documentation:** https://mudblazor.com/
- **Component Gallery:** https://mudblazor.com/components/
- **GitHub Examples:** https://github.com/MudBlazor/MudBlazor

#### Hangfire

- **Official Documentation:** https://docs.hangfire.io/
- **Background Jobs in ASP.NET:** https://www.hangfire.io/

### Service Documentation

#### Azure Document Intelligence

- Documentation: https://learn.microsoft.com/azure/ai-services/document-intelligence/
- .NET SDK: https://www.nuget.org/packages/Azure.AI.FormRecognizer
- Pricing: https://azure.microsoft.com/pricing/details/ai-document-intelligence/
- Quickstart: https://learn.microsoft.com/azure/ai-services/document-intelligence/quickstarts/get-started-sdks-rest-api

#### MarineTraffic API

- API Documentation: https://www.marinetraffic.com/en/ais-api-services
- Developer Portal: https://www.marinetraffic.com/en/p/api-services
- Pricing: https://www.marinetraffic.com/en/p/api-pricing

#### Twilio WhatsApp API

- Documentation: https://www.twilio.com/docs/whatsapp
- .NET SDK: https://www.nuget.org/packages/Twilio
- WhatsApp Business Setup: https://www.twilio.com/docs/whatsapp/tutorial
- Sandbox: https://www.twilio.com/docs/whatsapp/sandbox

#### EPPlus (Excel Library)

- Documentation: https://github.com/EPPlusSoftware/EPPlus
- NuGet Package: https://www.nuget.org/packages/EPPlus
- Wiki: https://github.com/EPPlusSoftware/EPPlus/wiki

### Development Tools

- **Visual Studio 2022 Community:** https://visualstudio.microsoft.com/
- **VS Code with C# Dev Kit:** https://code.visualstudio.com/
- **.NET 8 SDK:** https://dotnet.microsoft.com/download
- **Docker Desktop:** https://www.docker.com/products/docker-desktop
- **SQL Server Management Studio:** https://learn.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms
- **Azure Data Studio:** https://learn.microsoft.com/sql/azure-data-studio/download

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
