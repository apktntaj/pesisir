# Sippment Development Checklist

Progress tracker untuk development Sippment - Shipment Tracking & Document Management.

---

## Phase 1: Foundation (Minggu 1-3) ✅

### Minggu 1: Setup & Infrastructure
- [x] Setup Next.js project dengan TypeScript
- [x] Setup Tailwind CSS + shadcn/ui
- [x] Setup Supabase project
- [x] Setup environment variables
- [x] Create database schema & migrations
- [x] Setup Supabase client (browser & server)
- [x] Configure authentication middleware

### Minggu 2: Authentication
- [x] Landing page
- [x] Register page + API (SPM-001)
- [x] Login page + API (SPM-002)
- [x] Forgot password (SPM-016)
- [x] Reset password (SPM-016)
- [x] Auth state management (hooks)

### Minggu 3: Profile & Base Layout
- [x] Dashboard layout (sidebar, header)
- [x] Profile page (SPM-017)
- [x] Edit profile (SPM-017)
- [x] Settings layout
- [x] Empty states & loading states

---

## Phase 2: Core Shipment (Minggu 4-5) ✅

### Minggu 4: Shipment CRUD
- [x] Shipment list page (SPM-005)
- [x] Shipment filters & search (SPM-005)
- [x] Create shipment manual (SPM-004)
- [x] Shipment detail page (SPM-006)

### Minggu 5: Status & Edit
- [x] Edit shipment (SPM-014)
- [x] Delete shipment (SPM-015)
- [x] Status update (SPM-007)
- [x] Status timeline UI (SPM-006)
- [x] Status history tracking (SPM-007)

---

## Phase 3: BL Parsing (Minggu 6-7) ⏳

### Minggu 6: PDF Upload & Parsing
- [ ] PDF upload component (SPM-003)
- [ ] BL parsing service dengan pdf-parse (SPM-003)
- [ ] Parsing result review form (SPM-003)

### Minggu 7: Parsing Refinement
- [ ] Error handling & fallback to manual (SPM-003)
- [ ] Multi-format BL support (SPM-003)
- [ ] Parsing confidence indicators (SPM-003)
- [ ] Testing dengan real BL samples (SPM-003)

---

## Phase 4: Documents & Notifications (Minggu 8-9) ⏳

### Minggu 8: Document Management
- [ ] Document upload (SPM-008)
- [ ] Document list & preview (SPM-008)
- [ ] Document download (SPM-009)
- [ ] Document delete (SPM-009)
- [ ] WA subscriber list (SPM-010)
- [ ] Add WA subscriber (SPM-010)

### Minggu 9: WhatsApp Integration
- [ ] Edit/delete WA subscriber (SPM-011)
- [ ] Toggle WA notification (SPM-011)
- [ ] WhatsApp API integration - Fonnte/Wablas (SPM-012)
- [ ] Notification on status change (SPM-012)
- [ ] Notification templates (SPM-012)

---

## Phase 5: Polish & Launch (Minggu 10) ⏳

- [ ] Custom workflow Settings (SPM-013)
- [ ] Bug fixing
- [ ] Performance optimization
- [ ] Mobile responsiveness check
- [ ] Production deployment ke Vercel

---

## Quick Reference

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS
- **Backend**: Next.js Server Actions, Supabase
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Validation**: Zod
- **Testing**: Vitest

### Key Files
- `src/lib/validations/shipment.ts` - Zod schemas & business logic
- `src/app/(dashboard)/shipments/actions.ts` - Server actions CRUD
- `src/components/sidebar.tsx` - Navigation sidebar
- `supabase/migrations/` - Database schema

### Commands
```bash
npm run dev          # Start dev server
npm run type-check   # TypeScript check
npm run test         # Run unit tests
npm run build        # Production build
```

---

*Last updated: January 1, 2026*
