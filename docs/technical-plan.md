# Technical Planning Document: Sippment

## 1. Tech Stack Overview

### 1.1 Core Technologies

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Frontend** | Next.js | 14.x (App Router) | SSR, file-based routing, React Server Components |
| **Backend** | Next.js API Routes | 14.x | Serverless functions, integrated with frontend |
| **Runtime** | Node.js | 20.x LTS | Long-term support, modern JavaScript features |
| **Database** | Supabase (PostgreSQL) | Latest | Managed PostgreSQL with realtime capabilities |
| **Authentication** | Supabase Auth | Latest | Built-in email/password, session management |
| **File Storage** | Supabase Storage | Latest | S3-compatible, integrated with auth policies |
| **Styling** | Tailwind CSS | 3.x | Utility-first, responsive design |
| **UI Components** | shadcn/ui | Latest | Accessible, customizable components |
| **Form Handling** | React Hook Form + Zod | Latest | Type-safe forms with validation |
| **State Management** | TanStack Query | 5.x | Server state management, caching |
| **PDF Parsing** | pdf-parse / pdf.js | Latest | BL document extraction |
| **WhatsApp API** | Fonnte / Wablas | - | Third-party WhatsApp gateway Indonesia |

### 1.2 Development Tools

| Tool | Purpose |
|------|---------|
| TypeScript | Type safety across frontend and backend |
| ESLint + Prettier | Code quality and formatting |
| Husky + lint-staged | Pre-commit hooks |
| Vitest | Unit testing |
| Playwright | E2E testing |
| GitHub Actions | CI/CD pipeline |

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                        │
│                     Next.js App (React + RSC)                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Server                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   API Routes    │  │  Server Actions │  │   Middleware    │ │
│  │   /api/*        │  │   (mutations)   │  │   (auth check)  │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  PostgreSQL │  │    Auth     │  │   Storage   │              │
│  │  (Database) │  │  (Sessions) │  │   (Files)   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │   WhatsApp Gateway      │  │   Email Service (Resend)    │   │
│  │   (Fonnte/Wablas)       │  │   (Password Reset)          │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Project Structure

```
pesisir/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth routes (login, register, etc.)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/          # Protected routes
│   │   │   ├── dashboard/
│   │   │   ├── shipments/
│   │   │   │   ├── [id]/
│   │   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       ├── profile/
│   │   │       └── workflow/
│   │   ├── api/                  # API Routes
│   │   │   ├── shipments/
│   │   │   ├── documents/
│   │   │   ├── notifications/
│   │   │   ├── parse-bl/
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Landing page
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── forms/                # Form components
│   │   ├── shipments/            # Shipment-related components
│   │   ├── documents/            # Document components
│   │   └── layout/               # Layout components
│   │
│   ├── lib/                      # Utility libraries
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client
│   │   │   └── middleware.ts     # Auth middleware
│   │   ├── validations/          # Zod schemas
│   │   ├── utils.ts              # Helper functions
│   │   └── constants.ts          # App constants
│   │
│   ├── services/                 # Business logic
│   │   ├── shipment.service.ts
│   │   ├── document.service.ts
│   │   ├── notification.service.ts
│   │   ├── bl-parser.service.ts
│   │   └── whatsapp.service.ts
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-shipments.ts
│   │   ├── use-documents.ts
│   │   └── use-auth.ts
│   │
│   ├── types/                    # TypeScript types
│   │   ├── shipment.ts
│   │   ├── document.ts
│   │   ├── user.ts
│   │   └── database.ts           # Supabase generated types
│   │
│   └── styles/
│       └── globals.css
│
├── supabase/
│   ├── migrations/               # Database migrations
│   ├── seed.sql                  # Seed data
│   └── config.toml
│
├── public/
│   └── assets/
│
├── tests/
│   ├── unit/
│   └── e2e/
│
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌──────────────┐       ┌───────────────┐       ┌──────────────────┐
│    users     │       │   shipments   │       │    documents     │
├──────────────┤       ├───────────────┤       ├──────────────────┤
│ id (PK)      │──┐    │ id (PK)       │──┐    │ id (PK)          │
│ email        │  │    │ user_id (FK)  │  │    │ shipment_id (FK) │
│ name         │  └───▶│ bl_number     │  └───▶│ category         │
│ phone        │       │ ref           │       │ file_name        │
│ created_at   │       │ shipper       │       │ file_path        │
│ updated_at   │       │ consignee     │       │ file_size        │
└──────────────┘       │ status        │       │ mime_type        │
                       │ ...           │       │ created_at       │
                       │ created_at    │       └──────────────────┘
                       │ updated_at    │
                       └───────────────┘
                              │
                              │
         ┌────────────────────┴────────────────────┐
         │                                         │
         ▼                                         ▼
┌──────────────────┐                    ┌───────────────────┐
│ status_histories │                    │  wa_subscribers   │
├──────────────────┤                    ├───────────────────┤
│ id (PK)          │                    │ id (PK)           │
│ shipment_id (FK) │                    │ shipment_id (FK)  │
│ status           │                    │ phone_number      │
│ changed_at       │                    │ label             │
│ changed_by       │                    │ is_active         │
└──────────────────┘                    │ created_at        │
                                        └───────────────────┘

┌───────────────────┐
│ custom_workflows  │
├───────────────────┤
│ id (PK)           │
│ user_id (FK)      │
│ statuses (JSONB)  │
│ created_at        │
│ updated_at        │
└───────────────────┘
```

### 3.2 Table Definitions

#### users (Supabase Auth + profiles)

```sql
-- Supabase Auth handles core user data
-- This table extends user profile

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);
```

#### shipments

```sql
CREATE TYPE shipment_variant AS ENUM ('FCL', 'LCL');
CREATE TYPE shipment_status AS ENUM (
    'created', 
    'sailing', 
    'pre_arrival', 
    'arrived', 
    'clearing', 
    'released', 
    'delivered'
);

CREATE TABLE public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bl_number VARCHAR(100) NOT NULL,
    ref VARCHAR(100),
    shipper VARCHAR(255) NOT NULL,
    shipper_address TEXT,
    consignee VARCHAR(255) NOT NULL,
    consignee_address TEXT,
    third_party VARCHAR(255),
    third_party_address TEXT,
    voyage VARCHAR(100),
    vessel VARCHAR(255),
    pol VARCHAR(100),
    pod VARCHAR(100) NOT NULL,
    description TEXT,
    variant shipment_variant NOT NULL,
    volume VARCHAR(50),
    notes TEXT,
    status shipment_status DEFAULT 'created',
    bl_file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_shipments_user_id ON public.shipments(user_id);
CREATE INDEX idx_shipments_bl_number ON public.shipments(bl_number);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_shipments_created_at ON public.shipments(created_at DESC);

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can CRUD own shipments"
    ON public.shipments FOR ALL
    USING (auth.uid() = user_id);
```

#### status_histories

```sql
CREATE TABLE public.status_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    status shipment_status NOT NULL,
    notes TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id)
);

-- Index
CREATE INDEX idx_status_histories_shipment ON public.status_histories(shipment_id);

-- Enable RLS
ALTER TABLE public.status_histories ENABLE ROW LEVEL SECURITY;

-- Policy (via shipment ownership)
CREATE POLICY "Users can view status history of own shipments"
    ON public.status_histories FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments 
            WHERE shipments.id = status_histories.shipment_id 
            AND shipments.user_id = auth.uid()
        )
    );
```

#### documents

```sql
CREATE TYPE document_category AS ENUM (
    'bill_of_lading',
    'invoice',
    'packing_list',
    'coo',
    'msds',
    'other'
);

CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    category document_category NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_documents_shipment ON public.documents(shipment_id);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Users can manage documents of own shipments"
    ON public.documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments 
            WHERE shipments.id = documents.shipment_id 
            AND shipments.user_id = auth.uid()
        )
    );
```

#### wa_subscribers

```sql
CREATE TABLE public.wa_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    label VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_wa_subscribers_shipment ON public.wa_subscribers(shipment_id);

-- Enable RLS
ALTER TABLE public.wa_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Users can manage WA subscribers of own shipments"
    ON public.wa_subscribers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments 
            WHERE shipments.id = wa_subscribers.shipment_id 
            AND shipments.user_id = auth.uid()
        )
    );
```

#### custom_workflows

```sql
CREATE TABLE public.custom_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    statuses JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.custom_workflows ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Users can manage own workflow"
    ON public.custom_workflows FOR ALL
    USING (auth.uid() = user_id);
```

### 3.3 Storage Buckets

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('bl-documents', 'bl-documents', false),
    ('shipment-documents', 'shipment-documents', false);

-- RLS Policies for bl-documents
CREATE POLICY "Users can upload BL documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'bl-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own BL documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'bl-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- RLS Policies for shipment-documents
CREATE POLICY "Users can upload shipment documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'shipment-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own shipment documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'shipment-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own shipment documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'shipment-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
```

---

## 4. API Design

### 4.1 API Routes Overview

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| **Authentication** |
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password | No |
| **Shipments** |
| GET | `/api/shipments` | List user shipments | Yes |
| POST | `/api/shipments` | Create shipment | Yes |
| GET | `/api/shipments/[id]` | Get shipment detail | Yes |
| PATCH | `/api/shipments/[id]` | Update shipment | Yes |
| DELETE | `/api/shipments/[id]` | Delete shipment | Yes |
| PATCH | `/api/shipments/[id]/status` | Update status | Yes |
| **BL Parsing** |
| POST | `/api/parse-bl` | Parse BL document | Yes |
| **Documents** |
| GET | `/api/shipments/[id]/documents` | List documents | Yes |
| POST | `/api/shipments/[id]/documents` | Upload document | Yes |
| DELETE | `/api/documents/[id]` | Delete document | Yes |
| GET | `/api/documents/[id]/download` | Download document | Yes |
| **WA Subscribers** |
| GET | `/api/shipments/[id]/subscribers` | List subscribers | Yes |
| POST | `/api/shipments/[id]/subscribers` | Add subscriber | Yes |
| PATCH | `/api/subscribers/[id]` | Update subscriber | Yes |
| DELETE | `/api/subscribers/[id]` | Delete subscriber | Yes |
| **User Profile** |
| GET | `/api/profile` | Get profile | Yes |
| PATCH | `/api/profile` | Update profile | Yes |
| **Workflow** |
| GET | `/api/workflow` | Get custom workflow | Yes |
| PUT | `/api/workflow` | Update workflow | Yes |
| DELETE | `/api/workflow` | Reset to default | Yes |

### 4.2 Request/Response Examples

#### Create Shipment

```typescript
// POST /api/shipments
// Request
{
    "bl_number": "COSU6123456789",
    "ref": "Impor Mesin CNC",
    "shipper": "ABC Manufacturing Co Ltd",
    "shipper_address": "123 Industrial Zone, Shanghai, China",
    "consignee": "PT XYZ Indonesia",
    "consignee_address": "Jl. Raya Industri No. 45, Jakarta",
    "third_party": "PT Freight Forwarder",
    "voyage": "0123E",
    "vessel": "COSCO SHIPPING SAGITTARIUS",
    "pol": "Shanghai, China",
    "pod": "Tanjung Priok, Indonesia",
    "description": "CNC Machine Parts",
    "variant": "FCL",
    "volume": "1x40HC",
    "subscribers": [
        { "phone_number": "628123456789", "label": "Owner" }
    ]
}

// Response 201
{
    "id": "uuid",
    "bl_number": "COSU6123456789",
    "status": "created",
    // ... all fields
    "created_at": "2026-01-01T00:00:00Z"
}
```

#### Update Status

```typescript
// PATCH /api/shipments/[id]/status
// Request
{
    "status": "sailing",
    "notes": "Kapal sudah berangkat dari Shanghai"
}

// Response 200
{
    "id": "uuid",
    "status": "sailing",
    "status_history": [
        {
            "status": "sailing",
            "changed_at": "2026-01-02T10:00:00Z",
            "notes": "Kapal sudah berangkat dari Shanghai"
        },
        {
            "status": "created",
            "changed_at": "2026-01-01T00:00:00Z",
            "notes": null
        }
    ],
    "notifications_sent": 2
}
```

#### Parse BL

```typescript
// POST /api/parse-bl
// Request: multipart/form-data
// - file: PDF file

// Response 200
{
    "success": true,
    "data": {
        "bl_number": "COSU6123456789",
        "shipper": "ABC Manufacturing Co Ltd",
        "shipper_address": "123 Industrial Zone, Shanghai, China",
        "consignee": "PT XYZ Indonesia",
        "consignee_address": "Jl. Raya Industri No. 45, Jakarta",
        "voyage": "0123E",
        "vessel": "COSCO SHIPPING SAGITTARIUS",
        "pol": "Shanghai, China",
        "pod": "Tanjung Priok, Indonesia",
        "description": "CNC Machine Parts",
        "variant": "FCL",
        "volume": "1x40HC"
    },
    "confidence": {
        "bl_number": 0.95,
        "shipper": 0.88,
        // ... confidence scores per field
    },
    "file_path": "bl-documents/user-id/filename.pdf"
}

// Response 422 (parsing failed)
{
    "success": false,
    "error": "Unable to parse BL document",
    "message": "Format BL tidak dikenali. Silakan input manual.",
    "file_path": "bl-documents/user-id/filename.pdf"
}
```

---

## 5. Key Services Implementation

### 5.1 BL Parser Service

```typescript
// src/services/bl-parser.service.ts

import pdfParse from 'pdf-parse';

export interface ParsedBLData {
  bl_number?: string;
  shipper?: string;
  shipper_address?: string;
  consignee?: string;
  consignee_address?: string;
  third_party?: string;
  third_party_address?: string;
  voyage?: string;
  vessel?: string;
  pol?: string;
  pod?: string;
  description?: string;
  variant?: 'FCL' | 'LCL';
  volume?: string;
}

export interface ParseResult {
  success: boolean;
  data: ParsedBLData;
  confidence: Record<string, number>;
  rawText?: string;
}

export class BLParserService {
  private patterns = {
    bl_number: /B\/L\s*(?:NO|Number|#)?[:\s]*([A-Z0-9]+)/i,
    shipper: /SHIPPER[:\s]*\n?([\s\S]*?)(?=CONSIGNEE|NOTIFY)/i,
    consignee: /CONSIGNEE[:\s]*\n?([\s\S]*?)(?=NOTIFY|PORT|VESSEL)/i,
    voyage: /VOYAGE[:\s]*([A-Z0-9]+)/i,
    vessel: /VESSEL[:\s]*([A-Z\s]+?)(?=VOYAGE|PORT|\n)/i,
    pol: /PORT\s*OF\s*LOAD(?:ING)?[:\s]*([^\n]+)/i,
    pod: /PORT\s*OF\s*DISCHARGE[:\s]*([^\n]+)/i,
  };

  async parse(buffer: Buffer): Promise<ParseResult> {
    try {
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text;

      const data = this.extractData(text);
      const confidence = this.calculateConfidence(data);

      return {
        success: Object.keys(data).length >= 3,
        data,
        confidence,
        rawText: text,
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        confidence: {},
      };
    }
  }

  private extractData(text: string): ParsedBLData {
    const data: ParsedBLData = {};

    // Extract each field using patterns
    for (const [field, pattern] of Object.entries(this.patterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data[field as keyof ParsedBLData] = match[1].trim();
      }
    }

    // Detect FCL/LCL
    if (/FCL|FULL\s*CONTAINER/i.test(text)) {
      data.variant = 'FCL';
    } else if (/LCL|LESS\s*THAN\s*CONTAINER/i.test(text)) {
      data.variant = 'LCL';
    }

    return data;
  }

  private calculateConfidence(data: ParsedBLData): Record<string, number> {
    const confidence: Record<string, number> = {};
    
    for (const [field, value] of Object.entries(data)) {
      if (value) {
        // Simple confidence based on field length and format
        confidence[field] = this.getFieldConfidence(field, value as string);
      }
    }

    return confidence;
  }

  private getFieldConfidence(field: string, value: string): number {
    if (field === 'bl_number' && /^[A-Z]{4}\d{10,}$/i.test(value)) {
      return 0.95;
    }
    if (value.length > 3) {
      return 0.7 + Math.min(value.length / 100, 0.2);
    }
    return 0.5;
  }
}
```

### 5.2 WhatsApp Notification Service

```typescript
// src/services/whatsapp.service.ts

import { WASubscriber, Shipment } from '@/types';

interface NotificationPayload {
  phone: string;
  message: string;
}

interface NotificationResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

export class WhatsAppService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL!;
    this.apiKey = process.env.WHATSAPP_API_KEY!;
  }

  async sendStatusNotification(
    shipment: Shipment,
    newStatus: string,
    subscribers: WASubscriber[]
  ): Promise<NotificationResult> {
    const activeSubscribers = subscribers.filter(s => s.is_active);
    
    const message = this.buildStatusMessage(shipment, newStatus);
    
    const results = await Promise.allSettled(
      activeSubscribers.map(subscriber =>
        this.sendMessage({
          phone: subscriber.phone_number,
          message,
        })
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason?.message || 'Unknown error');

    return { success: failed === 0, sent, failed, errors };
  }

  private buildStatusMessage(shipment: Shipment, status: string): string {
    const ref = shipment.ref || shipment.bl_number;
    const timestamp = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
    });

    let message = `[Sippment Update]
📦 Ref: ${ref}
📍 Status: ${this.formatStatus(status)}
🕐 Waktu: ${timestamp}`;

    // Add contextual message
    const contextual = this.getContextualMessage(status);
    if (contextual) {
      message += `\n\n${contextual}`;
    }

    return message;
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      created: 'Created',
      sailing: 'Sailing',
      pre_arrival: 'Pre-Arrival',
      arrived: 'Arrived',
      clearing: 'Clearing',
      released: 'Released',
      delivered: 'Delivered',
    };
    return statusMap[status] || status;
  }

  private getContextualMessage(status: string): string | null {
    const messages: Record<string, string> = {
      pre_arrival: '⚠️ Shipment menjelang tiba. Pastikan dokumen BC 1.1 sudah siap.',
      released: '✅ SPPB sudah terbit. Barang siap diambil dari pelabuhan.',
    };
    return messages[status] || null;
  }

  private async sendMessage(payload: NotificationPayload): Promise<void> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
      },
      body: JSON.stringify({
        target: payload.phone,
        message: payload.message,
      }),
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status}`);
    }
  }
}
```

### 5.3 Shipment Service

```typescript
// src/services/shipment.service.ts

import { createServerClient } from '@/lib/supabase/server';
import { WhatsAppService } from './whatsapp.service';
import { 
  Shipment, 
  CreateShipmentInput, 
  UpdateShipmentInput,
  ShipmentStatus 
} from '@/types';

const STATUS_ORDER: ShipmentStatus[] = [
  'created',
  'sailing',
  'pre_arrival',
  'arrived',
  'clearing',
  'released',
  'delivered',
];

export class ShipmentService {
  private whatsapp: WhatsAppService;

  constructor() {
    this.whatsapp = new WhatsAppService();
  }

  async list(userId: string, filters?: {
    status?: ShipmentStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const supabase = createServerClient();
    const { page = 1, limit = 20, status, search } = filters || {};
    
    let query = supabase
      .from('shipments')
      .select('*, wa_subscribers(count)', { count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `bl_number.ilike.%${search}%,consignee.ilike.%${search}%,vessel.ilike.%${search}%`
      );
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async getById(id: string, userId: string) {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        *,
        status_histories(id, status, notes, changed_at),
        documents(id, category, file_name, file_path, file_size, created_at),
        wa_subscribers(id, phone_number, label, is_active)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return data;
  }

  async create(userId: string, input: CreateShipmentInput) {
    const supabase = createServerClient();
    
    const { subscribers, ...shipmentData } = input;

    // Create shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        ...shipmentData,
        user_id: userId,
        status: 'created',
      })
      .select()
      .single();

    if (shipmentError) throw shipmentError;

    // Create initial status history
    await supabase.from('status_histories').insert({
      shipment_id: shipment.id,
      status: 'created',
      changed_by: userId,
    });

    // Add subscribers if provided
    if (subscribers?.length) {
      await supabase.from('wa_subscribers').insert(
        subscribers.map(s => ({
          shipment_id: shipment.id,
          phone_number: s.phone_number,
          label: s.label,
        }))
      );
    }

    return shipment;
  }

  async updateStatus(
    id: string, 
    userId: string, 
    newStatus: ShipmentStatus,
    notes?: string
  ) {
    const supabase = createServerClient();

    // Get current shipment with subscribers
    const shipment = await this.getById(id, userId);
    if (!shipment) throw new Error('Shipment not found');

    // Validate status progression
    const currentIndex = STATUS_ORDER.indexOf(shipment.status);
    const newIndex = STATUS_ORDER.indexOf(newStatus);
    
    if (newIndex <= currentIndex) {
      throw new Error('Status can only progress forward');
    }

    // Update shipment status
    const { error: updateError } = await supabase
      .from('shipments')
      .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Add status history
    await supabase.from('status_histories').insert({
      shipment_id: id,
      status: newStatus,
      notes,
      changed_by: userId,
    });

    // Send WhatsApp notifications
    const notificationResult = await this.whatsapp.sendStatusNotification(
      { ...shipment, status: newStatus },
      newStatus,
      shipment.wa_subscribers
    );

    return {
      ...shipment,
      status: newStatus,
      notifications_sent: notificationResult.sent,
    };
  }

  async delete(id: string, userId: string) {
    const supabase = createServerClient();
    
    // Get shipment to delete associated files
    const shipment = await this.getById(id, userId);
    if (!shipment) throw new Error('Shipment not found');

    // Delete files from storage
    if (shipment.documents?.length) {
      const filePaths = shipment.documents.map(d => d.file_path);
      await supabase.storage
        .from('shipment-documents')
        .remove(filePaths);
    }

    if (shipment.bl_file_path) {
      await supabase.storage
        .from('bl-documents')
        .remove([shipment.bl_file_path]);
    }

    // Delete shipment (cascades to related records)
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
```

---

## 6. Authentication Flow

### 6.1 Auth Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Next.js Client                               ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  ││
│  │  │  Auth Forms │  │  useAuth()  │  │ Supabase Client     │  ││
│  │  │  (Login,    │──│  Hook       │──│ (browser)           │  ││
│  │  │  Register)  │  │             │  │                     │  ││
│  │  └─────────────┘  └─────────────┘  └──────────┬──────────┘  ││
│  └───────────────────────────────────────────────┼──────────────┘│
└──────────────────────────────────────────────────┼───────────────┘
                                                   │
                              Cookie (httpOnly, secure)
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Server                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  Middleware                                  ││
│  │  - Check auth cookie                                        ││
│  │  - Redirect unauthenticated to /login                       ││
│  │  - Redirect authenticated from /login to /dashboard         ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  Server Components / API                     ││
│  │  ┌─────────────────────────────┐                            ││
│  │  │ Supabase Server Client      │                            ││
│  │  │ - Reads auth from cookie    │                            ││
│  │  │ - Creates authenticated     │                            ││
│  │  │   requests to Supabase      │                            ││
│  │  └─────────────────────────────┘                            ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Supabase Auth                                               ││
│  │  - Email/password authentication                            ││
│  │  - Session management                                       ││
│  │  - Password reset via email                                 ││
│  │  - JWT token generation                                     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Middleware Implementation

```typescript
// src/middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute && !isApiRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
```

---

## 7. Development Phases & Timeline

### Phase 1: Foundation (Minggu 1-3)

#### Minggu 1: Setup & Infrastructure
| Task | Issue | Estimate |
|------|-------|----------|
| Setup Next.js project dengan TypeScript | - | 2h |
| Setup Tailwind CSS + shadcn/ui | - | 2h |
| Setup Supabase project | - | 1h |
| Setup environment variables | - | 1h |
| Create database schema & migrations | - | 4h |
| Setup Supabase client (browser & server) | - | 2h |
| Configure authentication middleware | - | 2h |

#### Minggu 2: Authentication
| Task | Issue | Estimate |
|------|-------|----------|
| Landing page | - | 4h |
| Register page + API | SPM-001 | 6h |
| Login page + API | SPM-002 | 4h |
| Forgot password | SPM-016 | 4h |
| Reset password | SPM-016 | 3h |
| Auth state management (hooks) | - | 3h |

#### Minggu 3: Profile & Base Layout
| Task | Issue | Estimate |
|------|-------|----------|
| Dashboard layout (sidebar, header) | - | 6h |
| Profile page | SPM-017 | 4h |
| Edit profile | SPM-017 | 3h |
| Settings layout | - | 2h |
| Empty states & loading states | - | 3h |

### Phase 2: Core Shipment (Minggu 4-5)

#### Minggu 4: Shipment CRUD
| Task | Issue | Estimate |
|------|-------|----------|
| Shipment list page | SPM-005 | 6h |
| Shipment filters & search | SPM-005 | 4h |
| Create shipment (manual) | SPM-004 | 6h |
| Shipment detail page | SPM-006 | 6h |

#### Minggu 5: Status & Edit
| Task | Issue | Estimate |
|------|-------|----------|
| Edit shipment | SPM-014 | 4h |
| Delete shipment | SPM-015 | 2h |
| Status update | SPM-007 | 4h |
| Status timeline UI | SPM-006 | 4h |
| Status history tracking | SPM-007 | 3h |

### Phase 3: BL Parsing (Minggu 6-7)

#### Minggu 6: PDF Upload & Parsing
| Task | Issue | Estimate |
|------|-------|----------|
| PDF upload component | SPM-003 | 4h |
| BL parsing service | SPM-003 | 8h |
| Parsing result review form | SPM-003 | 6h |

#### Minggu 7: Parsing Refinement
| Task | Issue | Estimate |
|------|-------|----------|
| Error handling & fallback to manual | SPM-003 | 4h |
| Multi-format BL support | SPM-003 | 8h |
| Parsing confidence indicators | SPM-003 | 3h |
| Testing dengan real BL samples | SPM-003 | 4h |

### Phase 4: Documents & Notifications (Minggu 8-9)

#### Minggu 8: Document Management
| Task | Issue | Estimate |
|------|-------|----------|
| Document upload | SPM-008 | 6h |
| Document list & preview | SPM-008 | 4h |
| Document download | SPM-009 | 2h |
| Document delete | SPM-009 | 2h |
| WA subscriber list | SPM-010 | 3h |
| Add WA subscriber | SPM-010 | 3h |

#### Minggu 9: WhatsApp Integration
| Task | Issue | Estimate |
|------|-------|----------|
| Edit/delete WA subscriber | SPM-011 | 3h |
| Toggle WA notification | SPM-011 | 2h |
| WhatsApp API integration | SPM-012 | 6h |
| Notification on status change | SPM-012 | 4h |
| Notification templates | SPM-012 | 2h |

### Phase 5: Polish & Launch (Minggu 10)

| Task | Issue | Estimate |
|------|-------|----------|
| Custom workflow (Settings) | SPM-013 | 8h |
| Bug fixing | - | 8h |
| Performance optimization | - | 4h |
| Mobile responsiveness check | - | 4h |
| Production deployment | - | 4h |

---

## 8. Environment Variables

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Sippment

# WhatsApp API (Fonnte/Wablas)
WHATSAPP_API_URL=https://api.fonnte.com/send
WHATSAPP_API_KEY=your-api-key

# Email (for password reset via Supabase)
# Configured in Supabase Dashboard

# Storage
STORAGE_MAX_FILE_SIZE=10485760  # 10MB
```

---

## 9. Security Considerations

### 9.1 Authentication & Authorization
- Use Supabase Auth with secure httpOnly cookies
- Implement Row Level Security (RLS) for all tables
- Validate user ownership before any data mutation
- Session timeout after 7 days of inactivity

### 9.2 Data Protection
- All data encrypted at rest (Supabase default)
- HTTPS for all communications
- Sanitize all user inputs
- Validate file types and sizes on upload
- Rate limiting on API routes

### 9.3 File Storage Security
- Files stored with user-specific paths
- RLS policies on storage buckets
- Generate signed URLs for downloads (time-limited)
- Virus scanning on uploads (future consideration)

---

## 10. Testing Strategy

### 10.1 Unit Tests
- Services (BL Parser, WhatsApp, Shipment)
- Utility functions
- Validation schemas

### 10.2 Integration Tests
- API routes
- Database operations
- File upload/download

### 10.3 E2E Tests (Critical Paths)
- User registration & login
- Create shipment (manual)
- Create shipment (BL parsing)
- Update status with notification
- Document upload & download

---

## 11. Monitoring & Observability

### 11.1 Application Monitoring
- Vercel Analytics for performance
- Error tracking with Sentry
- Custom logging for critical operations

### 11.2 Key Metrics to Track
- BL parsing success rate
- WhatsApp delivery rate
- API response times
- Page load times
- User engagement (shipments created, status updates)

---

## 12. Deployment

### 12.1 Infrastructure
- **Frontend/Backend**: Vercel (optimized for Next.js)
- **Database**: Supabase (managed PostgreSQL)
- **Storage**: Supabase Storage
- **Domain**: Custom domain via Vercel

### 12.2 CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml

name: Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Appendix A: TypeScript Types

```typescript
// src/types/shipment.ts

export type ShipmentStatus = 
  | 'created'
  | 'sailing'
  | 'pre_arrival'
  | 'arrived'
  | 'clearing'
  | 'released'
  | 'delivered';

export type ShipmentVariant = 'FCL' | 'LCL';

export type DocumentCategory = 
  | 'bill_of_lading'
  | 'invoice'
  | 'packing_list'
  | 'coo'
  | 'msds'
  | 'other';

export interface Shipment {
  id: string;
  user_id: string;
  bl_number: string;
  ref?: string;
  shipper: string;
  shipper_address?: string;
  consignee: string;
  consignee_address?: string;
  third_party?: string;
  third_party_address?: string;
  voyage?: string;
  vessel?: string;
  pol?: string;
  pod: string;
  description?: string;
  variant: ShipmentVariant;
  volume?: string;
  notes?: string;
  status: ShipmentStatus;
  bl_file_path?: string;
  created_at: string;
  updated_at: string;
  // Relations
  status_histories?: StatusHistory[];
  documents?: Document[];
  wa_subscribers?: WASubscriber[];
}

export interface StatusHistory {
  id: string;
  shipment_id: string;
  status: ShipmentStatus;
  notes?: string;
  changed_at: string;
  changed_by?: string;
}

export interface Document {
  id: string;
  shipment_id: string;
  category: DocumentCategory;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

export interface WASubscriber {
  id: string;
  shipment_id: string;
  phone_number: string;
  label?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateShipmentInput {
  bl_number: string;
  ref?: string;
  shipper: string;
  shipper_address?: string;
  consignee: string;
  consignee_address?: string;
  third_party?: string;
  third_party_address?: string;
  voyage?: string;
  vessel?: string;
  pol?: string;
  pod: string;
  description?: string;
  variant: ShipmentVariant;
  volume?: string;
  notes?: string;
  bl_file_path?: string;
  subscribers?: Array<{
    phone_number: string;
    label?: string;
  }>;
}

export interface UpdateShipmentInput extends Partial<Omit<CreateShipmentInput, 'bl_number' | 'subscribers'>> {}
```

---

## Appendix B: Validation Schemas

```typescript
// src/lib/validations/shipment.ts

import { z } from 'zod';

export const shipmentVariants = ['FCL', 'LCL'] as const;
export const shipmentStatuses = [
  'created', 
  'sailing', 
  'pre_arrival', 
  'arrived', 
  'clearing', 
  'released', 
  'delivered'
] as const;

export const waSubscriberSchema = z.object({
  phone_number: z
    .string()
    .regex(/^628\d{8,11}$/, 'Format nomor WA harus 628xxx (contoh: 628123456789)'),
  label: z.string().max(100).optional(),
});

export const createShipmentSchema = z.object({
  bl_number: z
    .string()
    .min(1, 'BL Number wajib diisi')
    .max(100),
  ref: z.string().max(100).optional(),
  shipper: z.string().min(1, 'Shipper wajib diisi').max(255),
  shipper_address: z.string().optional(),
  consignee: z.string().min(1, 'Consignee wajib diisi').max(255),
  consignee_address: z.string().optional(),
  third_party: z.string().max(255).optional(),
  third_party_address: z.string().optional(),
  voyage: z.string().max(100).optional(),
  vessel: z.string().max(255).optional(),
  pol: z.string().max(100).optional(),
  pod: z.string().min(1, 'Port of Discharge wajib diisi').max(100),
  description: z.string().optional(),
  variant: z.enum(shipmentVariants, {
    required_error: 'Variant wajib dipilih (FCL/LCL)',
  }),
  volume: z.string().max(50).optional(),
  notes: z.string().optional(),
  bl_file_path: z.string().optional(),
  subscribers: z.array(waSubscriberSchema).min(1, 'Minimal 1 nomor WA notifikasi').optional(),
});

export const updateShipmentSchema = createShipmentSchema
  .omit({ bl_number: true, subscribers: true })
  .partial();

export const updateStatusSchema = z.object({
  status: z.enum(shipmentStatuses),
  notes: z.string().optional(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
```
