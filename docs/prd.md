# PRD: PESISIR - Platform Otomasi Dokumen Pabean

## 1. Product overview

### 1.1 Document title and version

- PRD: PESISIR - Platform Otomasi Dokumen Pabean untuk PPJK
- Version: 3.0.0 (Solo Founder Edition - Clojure Stack)
- Date: December 29, 2025
- Status: Active Development - MVP Focus
- Team: Solo Founder + GitHub Copilot

### 1.2 Product summary

PESISIR adalah platform digital yang dirancang khusus untuk membantu staff PPJK (Perusahaan Pengurusan Jasa Kepabeanan) dalam mengotomasi proses pembuatan draft dokumen pabean. Platform ini menggunakan teknologi PDF parsing untuk mengekstrak data dari dokumen PDF dan secara otomatis menghasilkan draft dokumen pabean yang siap digunakan.

Dengan pendekatan B2C, PESISIR menargetkan karyawan PPJK secara individual, bukan perusahaan. Hal ini memungkinkan adopsi yang lebih cepat dan fleksibel.

MVP PESISIR fokus pada otomasi tiga jenis dokumen prioritas: BC 1.1 (Manifest), BC 2.3 (Dokumen Pemberitahuan Impor Barang untuk Ditimbun di TPS/TPP), dan BC 3.0 (Dokumen Pemberitahuan Impor Barang Untuk Diangkut Terus/Diangkut Lanjut). Dengan otomasi ini, waktu pembuatan dokumen dapat dikurangi dari 10 menit menjadi hanya 1 menit per dokumen.

**Solo Founder Development Strategy**: Dibangun oleh solo founder menggunakan **Clojure full-stack** (Clojure + ClojureScript + Datomic) untuk maximum productivity dan maintainability. Focus pada monolith architecture untuk simplicity, REPL-driven development untuk rapid iteration, dan sustainable 3-week sprint cycles.

**MVP Philosophy**: Ultra-minimal scope - PDF parsing only (no OCR), email notifications only (no WhatsApp), manual input alternatives (no vessel tracking), single-tenant first. Defer all non-essential features to post-MVP.

## 2. Goals

### 2.1 Business goals

**Realistic Solo Founder Goals:**

- **MVP Launch**: Launch functional MVP dalam 24 minggu (8 sprints @ 3 weeks) - sustainable pace untuk solo founder
- **Early Validation**: Dapatkan 10 beta users dalam 2 bulan pertama untuk validate product-market fit
- **Organic Growth**: Mencapai 50 active users dalam 6 bulan pertama melalui word-of-mouth dan organic channels (no paid marketing budget)
- **Revenue Validation**: Generate Rp 10 juta revenue dalam 6 bulan pertama untuk validate willingness-to-pay
- **Product Quality**: Mencapai 90%+ data extraction accuracy untuk searchable PDFs (defer OCR untuk phase 2)
- **Technical Foundation**: Build solid technical foundation dengan clean architecture untuk future scaling
- **Learning & Iteration**: Fast feedback loops - deploy setiap sprint, gather user feedback, iterate quickly
- **Sustainable Development**: Avoid burnout - work at sustainable pace, maintain code quality, comprehensive documentation

### 2.2 User goals

- **Efisiensi waktu**: Mengurangi waktu pembuatan draft dokumen pabean dari 10 menit menjadi 1 menit per dokumen (90% lebih cepat)
- **Menghilangkan pekerjaan manual repetitif**: Menghindari proses copy-paste manual dari PDF image yang memakan waktu dan rentan kesalahan
- **Akurasi data**: Meminimalkan human error dalam entry data dengan ekstraksi otomatis yang akurat
- **Fleksibilitas kerja**: Dapat memproses dokumen dari mana saja dan kapan saja (cloud-based)
- **Kemudahan adopsi**: Onboarding yang cepat tanpa perlu approval manajemen atau prosedur procurement perusahaan yang panjang
- **Cost transparency**: Model pay-per-document yang jelas dan transparan tanpa biaya langganan bulanan yang memberatkan

### 2.3 Non-goals (Out of Scope untuk MVP)

**Deferred to Post-MVP (Phase 2+):**

- **OCR untuk scanned documents**: MVP hanya support searchable/text-based PDFs. OCR untuk image-based PDFs adalah advanced feature untuk phase 2 (requires expensive Azure Document Intelligence atau complex self-hosted solution)
- **WhatsApp notifications**: MVP hanya email notifications. WhatsApp via Twilio terlalu mahal untuk early stage (defer until proven revenue)
- **Vessel tracking**: Manual input ETA saja di MVP. Real-time vessel tracking via MarineTraffic API expensive dan complex (defer to phase 2)
- **Multi-tenant architecture**: MVP start dengan single-tenant approach untuk simplicity. Multi-tenancy added setelah validate product-market fit
- **Integrasi langsung dengan CEISA**: MVP generate Excel/CSV untuk manual import. Direct API integration complex dan requires Bea Cukai partnership
- **Referral program**: Start tanpa referral incentives. Add setelah ada proven users yang satisfied
- **Fitur edukatif (Learn)**: Content creation time-consuming. Focus core value prop first
- **HS Code Classifier**: Machine learning feature requires significant data dan development time
- **Collaborative features**: Team collaboration tidak essential untuk B2C MVP
- **Mobile native app**: Responsive web app sufficient untuk MVP. Native iOS/Android adalah nice-to-have
- **Multiple payment methods**: Start dengan 1-2 payment methods (e.g., bank transfer + QRIS). Add more setelah validate demand

**KISS Principle**: Setiap feature harus justify development time untuk solo founder. Jika bisa defer tanpa blocking core value proposition, defer to phase 2.

## 3. User personas

### 3.1 Key user types

- **PPJK Staff (Primary)**: Karyawan operasional PPJK yang bertanggung jawab membuat dan mengajukan dokumen pabean setiap hari
- **Freelance Customs Broker**: Professional independen yang menangani pengurusan dokumen pabean untuk multiple clients
- **Junior Customs Staff**: Karyawan baru di PPJK yang masih belajar dan membutuhkan tools untuk mempercepat pekerjaan

### 3.2 Basic persona details

- **Rina - PPJK Staff Operasional**

  - Usia: 28 tahun
  - Pengalaman: 3 tahun di industri PPJK
  - Daily workload: 15-25 dokumen per hari
  - Pain points:
    - Menghabiskan 3-4 jam per hari hanya untuk copy-paste data dari PDF ke form
    - Sering mendapat dokumen scan dengan kualitas rendah
    - Deadline ketat dari klien, tekanan untuk cepat tapi akurat
    - Tools existing dari perusahaan terbatas atau tidak user-friendly
  - Tech savviness: Moderate - nyaman dengan Excel, email, WhatsApp, aplikasi web sederhana
  - Budget consideration: Willing to pay dari kantong sendiri jika bisa meningkatkan produktivitas dan mengurangi overtime
  - Goals: Menyelesaikan pekerjaan lebih cepat, pulang on-time, mengurangi stress dari pekerjaan repetitif

- **Budi - Freelance Customs Broker**

  - Usia: 35 tahun
  - Pengalaman: 7 tahun, 3 tahun terakhir sebagai freelancer
  - Daily workload: 10-15 dokumen per hari dari multiple clients
  - Pain points:
    - Harus invest waktu banyak untuk administrasi, mengurangi waktu untuk cari klien baru
    - Tidak punya akses ke tools enterprise yang mahal
    - Perlu maintain quality tinggi untuk retain clients
  - Tech savviness: High - familiar dengan berbagai tools digital, cepat adopsi technology baru
  - Budget consideration: ROI-focused, willing to pay jika jelas time saving-nya
  - Goals: Scale business dengan handle lebih banyak clients tanpa hire staff

- **Siti - Junior Customs Staff**
  - Usia: 24 tahun
  - Pengalaman: 6 bulan di PPJK
  - Daily workload: 5-10 dokumen per hari dengan supervision
  - Pain points:
    - Learning curve steep untuk format dokumen pabean
    - Sering membuat kesalahan dalam data entry
    - Senior staff tidak selalu available untuk review
  - Tech savviness: High - digital native, comfortable dengan apps dan cloud tools
  - Budget consideration: Price-sensitive, prefer pay-per-use vs subscription
  - Goals: Belajar lebih cepat, reduce mistakes, gain trust dari senior staff

### 3.3 Role-based access

- **Individual User (Free Trial)**:
  - Akses: Rp 50.000 saldo kredit diberikan saat pendaftaran (bukan gratis, tapi kredit balance yang terbatas)
  - Features: Full access ke semua fitur ekstraksi dan generation
  - Limitations: Watermark pada output, no priority processing
- **Individual User (Paid)**:
  - Akses: Unlimited document processing (pay-per-document)
  - Features: Full access tanpa watermark, priority processing queue
  - Pricing: Tiered pricing berdasarkan volume (single doc, bundle 50, bundle 100)

## 4. Functional requirements

### 4.1 Document upload & parsing (Priority: CRITICAL)

- System harus dapat menerima upload dokumen dalam format PDF (text-based dan searchable), JPG, dan PNG
- Maximum file size: 10MB per dokumen
- System harus dapat mendeteksi jenis dokumen (Bill of Lading, Commercial Invoice, Packing List) secara otomatis
- PDF parsing processing harus selesai dalam maksimal 2 menit untuk dokumen standar (1-3 halaman)
- System harus menampilkan progress bar real-time saat parsing processing
- User dapat upload multiple documents sekaligus (batch upload) hingga 10 files
- System dapat handle dokumen PDF dengan teks yang dapat dicari (searchable PDF), JPG dan PNG dengan kualitas memadai

### 4.2 Data extraction & validation (Priority: CRITICAL)

- System harus dapat mengekstrak fields kunci dengan akurasi minimum 95%:
  - Bill of Lading number
  - Shipper information (name, address, country)
  - Consignee information (name, address, NPWP)
  - Vessel name dan voyage number
  - Port of loading dan port of discharge
  - Item descriptions, quantity, weight, value
  - Container numbers dan seal numbers
- System harus menampilkan confidence score untuk setiap field yang diekstrak
- Fields dengan confidence score < 80% harus ditandai untuk manual review
- User dapat mengedit hasil ekstraksi langsung di interface sebelum generate dokumen
- System harus validasi format data (contoh: NPWP 15 digit, format tanggal dd/mm/yyyy)
- System harus support multiple currencies (USD, EUR, CNY, JPY) dengan auto-conversion ke IDR

### 4.3 Document generation (Priority: CRITICAL)

- System harus dapat generate 3 jenis dokumen prioritas:
  - **BC 1.1 (Manifest)**: Daftar cargo dalam shipment dengan detail container
  - **BC 2.3**: Pemberitahuan Impor Barang untuk Ditimbun di TPS
  - **BC 3.0**: Pemberitahuan Impor Barang untuk Diangkut Terus/Lanjut
- Output format: Excel (.xlsx) yang compatible dengan template CEISA
- Generated document harus include semua mandatory fields sesuai regulasi Bea Cukai
- System harus menyediakan preview dokumen sebelum download
- User dapat memilih template version (jika ada update regulasi)
- Generated document hanya dapat di-download langsung di browser (KISS principle - tidak perlu kirim via email)

### 4.4 User onboarding & authentication (Priority: HIGH)

- Registration hanya memerlukan email dan password (no phone verification di MVP)
- Email verification mandatory sebelum dapat menggunakan layanan
- Social login option: Google OAuth untuk kemudahan akses dan passkey
- New user automatically mendapat Rp 50.000 saldo kredit balance saat pendaftaran
- Onboarding wizard menjelaskan cara upload dokumen dan review hasil ekstraksi
- User profile harus dapat menyimpan default settings (currency preference, company info untuk auto-fill consignee)

### 4.5 Payment & transaction (Priority: HIGH)

- Pay-per-document model dengan pricing tiers:
  - Single document: Rp 10.000
  - Bundle 50 documents: Rp 400.000 (Rp 8.000/doc - 20% discount)
  - Bundle 100 documents: Rp 700.000 (Rp 7.000/doc - 30% discount)
- Payment methods: Credit/debit card, e-wallet (GoPay, OVO, DANA), bank transfer
- Payment gateway integration: Midtrans atau Xendit
- User dapat melihat transaction history dan remaining document credits
- Auto top-up option: alert user when credit < 5 documents
- Invoice generation untuk setiap payment transaction

### 4.6 History & document management (Priority: MEDIUM)

- User dapat melihat history semua dokumen yang pernah diproses
- Search dan filter dokumen by date, document type, status
- Re-download dokumen yang sudah di-generate sebelumnya (up to 30 days retention)
- User dapat membuat "favorites" untuk dokumen yang sering digunakan sebagai template
- Bulk actions: delete multiple documents, bulk re-generate dengan template baru

### 4.7 Quality & feedback (Priority: MEDIUM)

- User dapat memberikan feedback pada hasil ekstraksi (thumbs up/down)
- Report error feature: user dapat flag specific fields yang salah untuk improvement
- System logging untuk tracking accuracy metrics per document type
- User dapat request support via in-app chat atau email

## 5. User experience

### 5.1 Entry points & first-time user flow

- **Landing page**: Clear value proposition "Buat Draft Dokumen Pabean 10x Lebih Cepat" dengan demo video 30 detik
- **Social proof**: Testimonial dari early adopters, jumlah dokumen yang sudah diproses
- **Call-to-action**: "Coba Gratis 17 Dokumen" button yang prominent
- **Registration**: Simple form (email + password) atau "Sign up with Google" dalam 1 klik
- **Email verification**: Automated email dengan verification link, user harus verify sebelum dapat upload dokumen
- **Onboarding wizard** (3 steps):
  1. Welcome screen dengan quick tour features
  2. Upload sample document (guided tutorial)
  3. Review hasil ekstraksi dan download dokumen pertama
- **First success moment**: User berhasil generate dokumen pertama dalam < 5 menit dari sign up

### 5.2 Core experience

#### Step 1: Document Upload

- **Simple drag-and-drop interface** atau click-to-browse untuk upload file
- Visual feedback: thumbnail preview dari uploaded files
- Clear indication of supported formats dan max file size
- Progress indicator untuk setiap file yang di-upload
- **Positive experience**: Interface yang clean, tidak overwhelmed dengan options, fokus ke satu task at a time

#### Step 2: OCR Processing

- **Real-time progress bar** dengan estimated time remaining
- Visual representation: "Reading document... Extracting data... Validating fields..."
- Notification sound atau visual alert ketika processing selesai
- **No dead time**: User tetap dapat navigate ke other pages, processing berjalan di background
- **Positive experience**: Transparansi proses, user tahu apa yang terjadi, tidak ada black box

#### Step 3: Data Review & Edit

- **Split-screen view**: Original document di kiri, extracted data form di kanan
- **Confidence indicators**: Color-coded fields (green = high confidence, yellow = medium, red = low)
- **Hover tooltip**: Menampilkan confidence score ketika user hover over field
- **Inline editing**: Click to edit any field directly without modal atau popup
- **Auto-save**: Changes automatically saved, no manual save button needed
- **Positive experience**: User merasa in control, dapat quick scan untuk accuracy, easy correction

#### Step 4: Document Generation

- **Template selection**: Choose document type (Manifest / BC 2.3 / BC 3.0) dengan icon visual
- **Preview before download**: Full preview dari generated Excel file
- **One-click download**: "Download Dokumen" button yang prominent
- **Post-download actions**: Options to "Process Another Document" atau "View History"
- **Positive experience**: Instant gratification, clear completion of task, smooth transition ke next action

### 5.3 Advanced features & edge cases

- **Low quality document handling**:
  - System detect low quality scan, suggest user untuk re-upload dengan kualitas lebih baik
  - Option untuk "Force process" dengan warning bahwa akurasi mungkin lebih rendah
- **Multi-page document**:
  - System automatically combine data dari multiple pages
  - Page navigator untuk review extracted data per halaman
- **Missing required fields**:
  - Clear error message ketika mandatory field tidak dapat diekstrak
  - Guided prompts untuk manual input field yang missing
- **Payment failure**:
  - Clear error message dengan troubleshooting steps
  - Option untuk change payment method
  - Customer support contact yang visible
- **No internet connectivity**:
  - Graceful offline mode: draft disimpan locally, auto-upload when reconnected
  - Clear indication of offline status

### 5.4 UI/UX highlights

- **Mobile-responsive design**: Full functionality di mobile browser, optimized untuk tablet dan smartphone
- **Indonesian-first**: Default language Bahasa Indonesia dengan option switch ke English
- **Fast loading**: Progressive loading, lazy load images, optimized bundle size untuk internet lambat
- **Keyboard shortcuts**: Power users dapat navigate dengan keyboard (Tab untuk next field, Ctrl+Enter untuk submit)
- **Dark mode option**: Reduce eye strain untuk users yang kerja lama di depan layar
- **Minimal clicks**: Setiap task dapat diselesaikan dalam maksimal 5 clicks
- **Consistency**: Uniform button styles, consistent color scheme, predictable navigation
- **Accessibility**: Minimum WCAG 2.1 Level AA compliance (contrast ratio, alt text, semantic HTML)

## 6. Narrative

Rina adalah staff PPJK di Jakarta yang setiap hari harus memproses 20+ dokumen pabean. Sebelum menggunakan PESISIR, dia menghabiskan 3-4 jam pertama di pagi hari hanya untuk copy-paste data dari PDF scan Bill of Lading ke form dokumen pabean. Dokumen scan yang diterima dari shipping lines seringkali berkualitas rendah, memaksa dia untuk zoom in-out berkali-kali, menyebabkan mata lelah dan rentan kesalahan ketik.

Suatu hari, koleganya merekomendasikan PESISIR. Rina skeptis awalnya, tapi melihat ada free trial 5 dokumen, dia memutuskan untuk mencoba. Dalam 3 menit setelah sign up, dia berhasil upload dokumen pertama dan terkejut melihat system secara otomatis mengekstrak semua data dalam waktu kurang dari 1 menit. Dia quick review hasil ekstraksi, edit sedikit pada alamat consignee, dan klik download. Excel file yang di-generate sudah dalam format yang siap untuk di-import ke CEISA.

Rina menyadari bahwa dengan PESISIR, dia bisa menyelesaikan pekerjaan yang biasanya 3-4 jam dalam waktu hanya 30-45 menit. Sisa waktu dia gunakan untuk fokus ke task lain yang lebih strategic. Setelah free trial habis, Rina tidak ragu untuk beli bundle 50 dokumen dari uangnya sendiri - investasi Rp 400.000 yang menurut dia "totally worth it" dibanding overtime yang bisa dihindari.

Dalam 3 bulan, Rina sudah memproses lebih dari 500 dokumen via PESISIR. Performanya meningkat, boss mulai notice, dan dia mendapat promosi. Lebih penting lagi, quality of life-nya meningkat - tidak ada lagi overtime hingga malam, tidak ada lagi weekend kerja untuk kejar deadline. Rina sekarang menjadi advocate PESISIR, merekomendasikan ke teman-teman sesama staff PPJK di LinkedIn dan WhatsApp groups.

## 7. Success metrics

### 7.1 User-centric metrics

- **User acquisition**: 100 registered users dalam 3 bulan pertama dengan support dari program referral (users yang membawa user baru mendapat balance kredit bonus)
- **Activation rate**: Minimum 60% dari registered users complete onboarding dan process minimal 1 dokumen
- **Trial conversion**: Minimum 20% dari trial users dengan saldo kredit initial convert ke paid users (beli document credits)
- **Referral conversion**: Minimum 15% dari referred users yang actually sign up dan active
- **Retention rate**:
  - Day 7 retention: Minimum 40%
  - Day 30 retention: Minimum 25%
- **User satisfaction (NPS)**: Target NPS score minimum +30 dalam 3 bulan pertama
- **Time to first document**: Median waktu dari sign up hingga download dokumen pertama < 5 menit
- **Document processing time**: Median waktu dari upload hingga download < 3 menit per dokumen
- **Repeat usage**: Average 8-10 dokumen processed per user per week

### 7.2 Business metrics

- **Revenue**: Target Rp 50 juta dalam 3 bulan pertama (asumsi 20 paid users x Rp 2.5 juta/month average spend)
- **Average Revenue Per User (ARPU)**: Target Rp 125.000 per user per month
- **Customer Acquisition Cost (CAC)**: Target < Rp 500.000 per paid user
- **CAC Payback period**: < 4 months
- **Gross margin**: Minimum 60% (revenue minus cloud infrastructure dan processing costs)
- **Churn rate**: Monthly churn < 10% untuk paid users

### 7.3 Technical metrics

- **Data extraction accuracy**: Minimum 95% field-level accuracy pada 3 jenis dokumen prioritas (Manifest, BC 2.3, BC 3.0)
- **OCR processing time**:
  - p50 (median): < 60 seconds
  - p95: < 120 seconds
  - p99: < 180 seconds
- **System uptime**: Minimum 99.5% uptime (maksimal 3.6 jam downtime per bulan)
- **API response time**:
  - Document upload endpoint: p95 < 2 seconds
  - Data extraction API: p95 < 90 seconds
  - Document generation: p95 < 5 seconds
- **Error rate**:
  - Critical errors (system crash, data loss): < 0.1%
  - OCR failures (cannot extract any data): < 5%
  - Generation failures: < 1%
- **Bug severity tracking**:
  - Zero critical bugs (data loss, security breach) in production
  - P1 bugs (feature completely broken): MTTR < 4 hours
  - P2 bugs (degraded functionality): MTTR < 24 hours

### 7.4 Agile Team Metrics

- **Sprint Velocity**: Track completed story points per sprint
  - Target: Establish baseline velocity dalam 3 sprints pertama
  - Goal: Predictable velocity (± 10% variance) setelah Sprint 3
- **Sprint Commitment Accuracy**: % dari committed stories yang completed
  - Target: >85% commitment accuracy
- **Sprint Goal Achievement**: % sprints yang achieve sprint goal
  - Target: >90% sprint goals achieved
- **Cycle Time**: Average time dari "In Progress" ke "Done"
  - Target: <5 days per user story
- **Lead Time**: Average time dari backlog entry ke production deployment
  - Target: <3 weeks (1.5 sprints average)
- **Defect Escape Rate**: Bugs found in production vs caught in sprint
  - Target: <10% escape rate
- **Technical Debt Ratio**: % sprint capacity allocated ke tech debt
  - Target: 10-20% per sprint
- **Team Satisfaction**: Sprint retrospective happiness metric
  - Target: Average rating >4/5
- **Code Review Time**: Average time untuk complete code review
  - Target: <24 hours
- **Deployment Frequency**: How often deployed to production
  - Target: At least 1x per sprint (bi-weekly)

## 8. Technical Stack & Architecture (Solo Founder - Clojure Full-Stack)

### 8.1 Technology Stack

**Backend (Clojure):**
- **Language**: Clojure 1.12+
- **Web Framework**: Ring (HTTP server) + Reitit (routing)
- **API**: REST API with JSON responses
- **Authentication**: Buddy (JWT-based authentication)
- **PDF Processing**: Apache PDFBox via Java interop
- **Excel Generation**: Apache POI via Java interop  
- **Email**: Postal (SMTP library) - simple email notifications
- **Job Processing**: core.async untuk async operations

**Frontend (ClojureScript):**
- **Language**: ClojureScript (compiled to JavaScript)
- **Framework**: Re-frame (reactive framework, wraps React)
- **UI Components**: Reagent (ClojureScript interface to React)
- **State Management**: Re-frame subscriptions & events
- **Routing**: Reitit-frontend
- **HTTP Client**: cljs-ajax or cljs-http
- **Styling**: Tailwind CSS

**Database:**
- **Primary**: Datomic Cloud (ideal: immutable, time-travel) OR PostgreSQL (affordable alternative)
- **Why Datomic**: Built-in audit log, immutable data, perfect untuk document trail
- **Fallback**: PostgreSQL + next.jdbc jika budget constraint

**Infrastructure:**
- **Hosting**: Fly.io ($20-50/month, simple deployment)
- **File Storage**: Local disk initially, migrate to S3 when needed
- **CI/CD**: GitHub Actions (free for public repos)
- **Monitoring**: Sentry (error tracking)
- **Logging**: LogTail or Papertrail (affordable)

**Payment:**
- **Gateway**: Start dengan manual bank transfer + QRIS
- **Later**: Integrate Xendit or Midtrans when volume justifies cost

**Key Architecture Principles:**
- **Monolith Architecture**: Simplicity over microservices untuk solo founder
- **REPL-Driven Development**: Live coding, immediate feedback
- **Java Interop**: Leverage mature Java libraries (PDFBox, POI)
- **Same Language**: Clojure + ClojureScript = less context switching

### 8.2 Data storage & privacy

- **Personal data**: Email, name, company info (jika diisi voluntary), payment info
- **Document data**: Uploaded source documents, extracted data, generated output files
- **Retention policy**:
  - Uploaded documents: 30 days retention, auto-delete setelahnya
  - Generated documents: 30 days retention
  - Transaction history: Retained indefinitely untuk accounting purposes
- **Privacy compliance**:
  - Comply dengan UU PDP (Undang-Undang Perlindungan Data Pribadi Indonesia)
  - Clear privacy policy dan terms of service
  - User consent untuk data processing
  - Right to data deletion: User dapat request delete account dan semua data
- **Security measures**:
  - Encryption at rest untuk stored documents
  - Encryption in transit (HTTPS/TLS)
  - No data sharing dengan third parties tanpa explicit user consent
  - Access control: User hanya dapat akses documents mereka sendiri

### 8.3 Scalability & performance targets (MVP Scope)

**Solo Founder Realistic Targets:**
- **Concurrent users**: Support 10-20 concurrent users initially (sufficient untuk 50-100 total users)
- **Document processing**: 20-30 documents per hour (enough untuk MVP validation)
- **Database**: Start simple - Datomic Pro local atau PostgreSQL
- **Background processing**: core.async untuk non-blocking PDF processing
- **Caching**: Minimize initially, add when performance issues arise
- **Static assets**: Serve from Fly.io initially, add CDN post-MVP jika needed
- **Response time targets**: 
  - Page load: < 3 seconds
  - PDF processing: < 60 seconds
  - Excel generation: < 5 seconds

**Post-MVP Scaling Strategy:**
- Horizontal scaling via Fly.io (add more instances)
- Database migration to managed service (Datomic Cloud or Postgres on Fly)
- CDN untuk static assets
- Async job queue untuk long-running tasks

### 8.4 Potential technical challenges

**Solo Founder Specific Challenges:**

- **PDF parsing accuracy variability**:
  - Searchable PDFs memiliki format yang bervariasi (encoding, fonts, layout)
  - Mitigation: Start dengan simple regex extraction, iterate based on real documents
  - Test dengan sample documents dari beta users
- **Document format variations**:
  - Bill of Lading dari berbagai shipping lines memiliki format berbeda
  - Mitigation: Build flexible parser dengan fallback strategies
  - Collect templates dari users untuk continuous improvement
- **CEISA template changes**:
  - Bea Cukai dapat mengubah format template sewaktu-waktu
  - Mitigation: Versioned templates dengan config file, easy to update tanpa code changes
- **Clojure learning curve**:
  - Jika belum expert di Clojure, ada learning overhead
  - Mitigation: Start simple, leverage REPL untuk exploration, extensive documentation
- **Datomic cost**:
  - Datomic Cloud bisa mahal untuk early stage ($50-100/month minimum)
  - Mitigation: Start dengan Datomic Pro (local), atau fallback ke PostgreSQL jika needed
- **Payment integration complexity**:
  - Manual bank transfer reconciliation time-consuming
  - Mitigation: Start dengan manual verification, automate later when volume increases
- **Solo founder capacity**:
  - Limited bandwidth untuk support, bug fixes, feature development simultaneously
  - Mitigation: Sustainable pace, 3-week sprints, 20% buffer time, clear prioritization
- **Time zone & availability**:
  - Users expect quick response, but solo founder has limited hours
  - Mitigation: Set clear expectations, automated email responses, async support via email/form

## 9. Agile Development Approach & Sprint Planning

### 9.1 Solo Founder Agile Methodology

PESISIR dibangun oleh **solo founder** dengan bantuan GitHub Copilot, menggunakan **adapted Scrum framework** untuk sustainable solo development.

**Solo Founder Adjustments:**
- **Sprint Duration**: 3 minggu (bukan 2) - lebih sustainable pace untuk solo developer
- **Simplified Ceremonies**: Lightweight planning, no daily standups, focused retrospectives
- **Buffer Time**: 20% time buffer setiap sprint untuk unexpected issues, learning, debugging
- **Focus**: Satu major feature per sprint, avoid multi-tasking
- **Quality over Speed**: Comprehensive tests, clean code, good documentation - penting untuk maintainability

**Prinsip Solo Founder Development:**
- **REPL-Driven Development**: Fast feedback loops, live coding, immediate results
- **Incremental Deployment**: Deploy setiap sprint untuk get real user feedback early
- **Technical Debt Management**: Allocate 15-20% setiap sprint untuk refactoring dan tech debt
- **Avoid Burnout**: Sustainable pace, realistic goals, celebrate small wins
- **Leverage Tools**: GitHub Copilot untuk coding assistance, automated testing, CI/CD

### 9.2 Solo Founder "Team" Structure

**Roles** (semua dilakukan oleh solo founder):
- **Product Owner**: Define features, prioritize backlog
- **Developer**: Write code, implement features
- **DevOps**: Setup infrastructure, deployment, monitoring
- **Designer**: UI/UX design (keep it simple, use existing components)
- **QA**: Testing, bug fixes
- **Support**: Handle user inquiries (initially manual, automate later)

**Support System:**
- **GitHub Copilot**: Coding assistance, boilerplate generation
- **AI Tools**: ChatGPT for problem-solving, documentation
- **Community**: Clojure community (Slack, Reddit) for help
- **Beta Users**: Early feedback, bug reports, feature validation

### 9.3 Lightweight Ceremonies

**Sprint Planning** (setiap 3 minggu, 2-3 jam):
- Review apa yang completed sprint sebelumnya
- Prioritize top 3-5 user stories untuk next sprint
- Break down tasks, estimate effort
- Define sprint goal yang clear dan achievable

**Weekly Review** (30 menit setiap Friday):
- Check progress vs sprint goal
- Adjust priorities jika needed
- Document blockers dan decisions

**Sprint Retrospective** (akhir sprint, 1 jam):
- What worked well? What didn't?
- Technical learnings dan challenges
- Process improvements untuk next sprint
- Update velocity estimate

**Daily Log** (5-10 menit, end of day):
- Document what was accomplished today
- Note blockers atau questions
- Plan tomorrow's focus
- Track di simple markdown file atau Notion

### 9.4 Sprint Breakdown (8 Sprints = 24 Minggu)

**Solo Founder Sprint Timeline:**
```
Sprint 0        Sprint 1         Sprint 2         Sprint 3
[Setup]      [Foundation]   [PDF Upload]   [Data Extract]
Week -2-0      Week 1-3        Week 4-6         Week 7-9

Sprint 4        Sprint 5         Sprint 6         Sprint 7
[Review UI]   [Generation]   [Credit System]    [Polish]
Week 10-12     Week 13-15       Week 16-18      Week 19-21

Sprint 8
[Testing/Launch]
  Week 22-24
                MVP LAUNCH ⭐ (May 2026)
```

**Realistic Story Points untuk Solo Founder:**
- Sprint velocity target: 15-20 points per 3-week sprint
- Buffer 20% untuk unexpected issues
- Focus: Quality over quantity

**Key Milestones:**
- **End of Sprint 2**: PDF upload working, basic parsing
- **End of Sprint 4**: Core value prop working (upload → extract → review → edit)
- **End of Sprint 6**: Full flow working (including document generation & credit system)
- **End of Sprint 7**: Polish, bug fixes, UX improvements
- **End of Sprint 8**: Production-ready MVP + initial beta users

---

#### Sprint 0: Pre-Development Setup (Week -1 to 0)

**Focus**: Foundation dan environment setup

**Sprint Goal**: Development environment siap, tim aligned dengan vision

**Key Activities**:
- Repository setup, CI/CD pipeline basic
- Development environment configuration (Docker, SQL Server)
- Architecture design finalization
- Database schema design
- Initial backlog creation dan prioritization
- Team kick-off dan Scrum training

**Definition of Done (DoD)**:
- Semua developers dapat run project locally
- CI pipeline can build dan run unit tests
- Architecture dan database schema documented dan approved
- Product backlog dengan 20+ user stories ready

---

#### Sprint 1: Authentication & Core Infrastructure (Week 1-2)

**Sprint Goal**: User dapat register, login, dan manage profile

**User Stories** (in priority order):
- PESISIR-001: User registration dan email verification (8 points)
- PESISIR-002: Initial balance allocation (5 points)
- PESISIR-017: Basic authentication dengan JWT (8 points)
- Technical: Database migrations dan Entity Framework setup (5 points)

**Acceptance Criteria Summary**:
- User dapat register dengan email atau Google OAuth
- Email verification working
- User auto-receive Rp 50.000 balance
- JWT authentication working untuk API calls

**Team Capacity**: ~20-25 story points

**Risks**: Google OAuth integration delay

**Demo**: Live demo registration flow dan show user dengan initial balance

---

#### Sprint 2: Document Upload & PDF Parsing (Week 3-4)

**Sprint Goal**: User dapat upload dokumen dan system parse PDF

**User Stories**:
- PESISIR-003: Document upload functionality (5 points)
- PESISIR-004: PDF parsing integration (13 points)
- PESISIR-005: Data extraction basic flow (8 points)
- Technical: Azure Blob Storage integration (3 points)

**Acceptance Criteria Summary**:
- User dapat drag-and-drop upload PDF/image files
- System parse text-based PDF dan extract basic data
- File tersimpan di Azure Blob Storage
- Upload progress indicator working

**Team Capacity**: ~25-30 story points

**Risks**: PDF parsing accuracy < 90% untuk certain formats

**Demo**: Upload real Bill of Lading dan show extracted data

---

#### Sprint 3: Data Review & Editing (Week 5-6)

**Sprint Goal**: User dapat review dan edit extracted data dengan confidence

**User Stories**:
- PESISIR-005: Data review interface dengan confidence scores (8 points)
- PESISIR-005: Inline editing capability (5 points)
- Technical: Confidence scoring logic (5 points)
- Technical: Auto-save functionality (3 points)

**Acceptance Criteria Summary**:
- Split-screen view: PDF kiri, form kanan
- Confidence scores displayed dengan color coding
- User dapat edit any field dengan inline editing
- Changes auto-saved

**Team Capacity**: ~20-25 story points

**Risks**: UX complexity untuk mobile responsiveness

**Demo**: Review flow dengan real sample documents, show editing dan auto-save

---

#### Sprint 4: Document Generation & History (Week 7-8)

**Sprint Goal**: User dapat generate CEISA documents dan access history

**User Stories**:
- PESISIR-006: Excel document generation untuk BC types (13 points)
- PESISIR-008: Document history view (5 points)
- Technical: Balance deduction logic (3 points)
- Technical: 30-day retention policy implementation (3 points)

**Acceptance Criteria Summary**:
- User select document type dan generate Excel
- Download working dengan proper naming convention
- Document history shows all processed docs
- Balance deducted correctly per document

**Team Capacity**: ~23-28 story points

**Risks**: CEISA template format changes, Excel generation errors

**Demo**: End-to-end flow dari upload hingga download Excel document

---

#### Sprint 5: Payment Integration & Referral (Week 9-10)

**Sprint Goal**: User dapat top-up balance dan refer friends

**User Stories**:
- PESISIR-007: Payment gateway integration (13 points)
- Technical: Referral tracking system (8 points)
- PESISIR-002: Referral bonus allocation (5 points)
- Technical: Transaction history dan invoicing (3 points)

**Acceptance Criteria Summary**:
- User dapat purchase credits via Midtrans/Xendit
- Multiple payment methods working (card, e-wallet, bank transfer)
- Referral link generation working
- Referral bonus auto-allocated

**Team Capacity**: ~25-30 story points

**Risks**: Payment gateway approval delays, webhook configuration issues

**Demo**: Complete payment flow, referral link sharing, bonus allocation

---

#### Sprint 6: Polish, Testing & Launch Prep (Week 11-12)

**Sprint Goal**: System production-ready dengan high quality dan good UX

**User Stories**:
- PESISIR-001: Onboarding wizard (5 points)
- PESISIR-009: Feedback dan error reporting (3 points)
- PESISIR-010: Mobile responsive optimization (8 points)
- Technical: Performance optimization (5 points)
- Technical: Security hardening (5 points)

**Additional Activities**:
- Comprehensive testing (regression, load, security)
- Beta testing dengan 10-20 users
- Bug fixing dan polish
- Production deployment preparation
- Marketing materials preparation

**Team Capacity**: ~20-25 story points + testing activities

**Risks**: Critical bugs discovered late, beta user feedback requiring changes

**Demo**: Complete product walkthrough, showcase all features working together

---

### 9.5 Post-MVP Agile Roadmap (Sprint 7+)

Setelah MVP launch, development continue dengan 2-week sprints focusing pada:

**Sprint 7-8: Feedback & Iteration**
- Address user feedback dari launch
- Quick wins dan UX improvements
- Performance optimization berdasarkan real usage
- Bug fixes untuk production issues

**Sprint 9-10: Advanced Features Round 1**
- HS Code Classifier basic functionality
- Learn module prototype
- Advanced OCR untuk image-based PDFs

**Sprint 11-12: Scale & Optimization**
- Infrastructure scaling berdasarkan user growth
- API rate limiting improvements
- Multi-language support expansion

**Backlog Items untuk Future Sprints**:
- Collaborative features (comments, approvals)
- CEISA API integration (direct submission)
- Mobile native app (React Native)
- Shipment tracking real-time
- Advanced analytics dashboard
- B2B/Enterprise features

### 9.6 Velocity & Capacity Planning

**Initial Team Velocity Estimate**: 20-25 story points per sprint (akan adjust berdasarkan actual velocity)

**Sprint Capacity Considerations**:
- Account untuk holidays dan PTO
- Reserve 20% capacity untuk bug fixes dan tech debt
- Include learning time untuk new technologies (Sprint 1-2)

**Velocity Tracking**:
- Measure completed story points per sprint
- Calculate running average after Sprint 3
- Adjust future sprint commitments based on velocity trends

### 9.7 Definition of Done (Team Agreement)

Setiap user story considered "Done" ketika:
- [ ] Code completed dan follows coding standards
- [ ] Unit tests written dengan >80% coverage
- [ ] Integration tests passed
- [ ] Code reviewed dan approved oleh minimal 1 peer
- [ ] Feature tested manually (exploratory testing)
- [ ] No critical atau high-severity bugs
- [ ] Documentation updated (API docs, user guide)
- [ ] Deployed to staging environment
- [ ] Product Owner acceptance obtained

**Additional DoD untuk Sprint**:
- [ ] All committed user stories meet DoD
- [ ] Sprint goal achieved
- [ ] Build is green (all tests passing)
- [ ] No known critical bugs in sprint increment
- [ ] Demo prepared dan successfully conducted
- [ ] Retrospective action items documented

### 9.8 Risk Management dalam Agile Context

**Sprint-Level Risks**:
- **Velocity drops**: Mitigate dengan realistic commitments, buffer capacity
- **Scope creep**: Mitigate dengan strong Product Owner, strict backlog prioritization
- **Technical debt accumulation**: Mitigate dengan 20% capacity allocation untuk tech debt

**Project-Level Risks**:
- **External dependency delays** (e.g., Midtrans approval): Mitigate dengan parallel tracks, fallback options
- **Accuracy below target**: Mitigate dengan iterative improvement, collect feedback data
- **Team velocity uncertainty**: Mitigate dengan conservative Sprint 1-2 commitments, adjust later

**Mitigation Strategy**:
- Regular risk review dalam Sprint Planning
- Escalate blockers immediately dalam Daily Standups
- Adapt sprint goals jika risk materialized

### 9.9 Continuous Integration & Continuous Delivery (CI/CD)

**CI/CD Pipeline** (Essential untuk Agile velocity):
- **Continuous Integration**:
  - Code commit triggers automated build
  - Unit tests run automatically (must pass)
  - Code quality checks (linting, static analysis)
  - Build artifacts created
  - Fast feedback: <5 minutes untuk build + unit tests
  
- **Continuous Delivery**:
  - Automated deployment ke Staging setelah CI pass
  - Integration tests run di Staging
  - Manual approval gate untuk Production
  - One-click deployment ke Production
  - Rollback capability dalam <5 minutes

**Deployment Strategy**:
- **Sprint 1-3**: Deploy to Staging setiap end of sprint
- **Sprint 4+**: Deploy to Staging setiap merged PR (continuous)
- **Production**: Deploy at end of each sprint (bi-weekly releases)
- **Hotfixes**: Deploy immediately via fast-track pipeline

**Quality Gates** (Must pass sebelum merge):
- All unit tests passing (>80% coverage)
- No critical security vulnerabilities (Snyk scan)
- Code review approved (minimum 1 reviewer)
- No merge conflicts
- Branch up to date dengan main

### 9.10 Agile Tools & Collaboration

**Project Management Tools**:
- **Primary**: Jira atau Azure DevOps untuk backlog management
  - Sprint boards (Kanban style)
  - Burndown charts untuk track velocity
  - Story point tracking
  - Release planning roadmap
  
**Communication & Collaboration**:
- **Daily Communication**: Slack/Microsoft Teams
- **Code Repository**: GitHub dengan PR reviews
- **Documentation**: Confluence atau Notion
- **Design**: Figma untuk UI/UX collaboration
- **Video Calls**: Zoom/Teams untuk remote ceremonies

**Metrics Dashboard**:
- Real-time sprint progress (burndown)
- Team velocity trends
- Defect trends
- Code quality metrics (coverage, technical debt)
- Production health metrics (uptime, performance)

## 10. Product Backlog & User Stories

### 10.0 Product Backlog Overview

Product backlog dikelola menggunakan **prioritization framework MoSCoW** (Must have, Should have, Could have, Won't have) dengan additional **story point estimation** menggunakan Fibonacci sequence (1, 2, 3, 5, 8, 13, 21).

**Backlog Prioritization Criteria**:
1. **Business Value**: Impact ke user dan revenue potential
2. **User Impact**: Number of users affected
3. **Risk Reduction**: Technical atau business risk mitigation
4. **Dependencies**: Technical dependencies yang block other stories
5. **Effort**: Story points estimate (lower effort = higher priority jika value sama)

**Current Backlog Status** (MVP Scope):
- **Must Have**: 10 user stories (85 story points estimated)
- **Should Have**: 3 user stories (21 story points estimated)
- **Could Have**: 5 user stories (34 story points estimated)
- **Won't Have (Post-MVP)**: 15+ stories dalam icebox

**Backlog Grooming Process**:
- Weekly backlog refinement sessions (1 hour mid-sprint)
- Stories broken down ketika >13 points (too large untuk single sprint)
- Acceptance criteria defined before sprint planning
- Technical spikes allocated jika high uncertainty (max 5 points)

---

## 10. User Stories

### 10.1 User registration dan onboarding

**ID**: PESISIR-001
**Priority**: Must Have
**Story Points**: 8
**Sprint**: Sprint 1

**Description**:
Sebagai staff PPJK yang baru mendengar tentang PESISIR, saya ingin dapat mendaftar dengan cepat dan mudah tanpa proses verifikasi yang rumit, sehingga saya dapat langsung mencoba layanan tanpa hambatan.

**Acceptance criteria**:

- User dapat mengakses halaman registration dari landing page
- Registration form hanya meminta email dan password (minimum 8 karakter, harus ada angka dan huruf)
- User dapat memilih "Sign up with Google" sebagai alternatif
- Setelah submit registration, user menerima email verification dalam 2 menit
- Email verification link valid selama 24 jam
- Setelah verify email, user otomatis login dan diarahkan ke onboarding wizard
- User yang sign up dengan Google tidak perlu email verification (auto-verified)
- Error handling: Clear error message jika email sudah terdaftar atau password tidak memenuhi requirement

### 10.2 Initial balance allocation

**ID**: PESISIR-002
**Priority**: Must Have
**Story Points**: 5
**Sprint**: Sprint 1

**Description**:
Sebagai new user, saya ingin mendapat initial balance kredit saat mendaftar untuk mencoba layanan sebelum membeli lebih banyak, sehingga saya dapat memvalidasi bahwa PESISIR sesuai kebutuhan saya.

**Acceptance criteria**:

- Setiap new user otomatis mendapat Rp 50.000 initial balance kredit setelah verify email
- Initial balance ditampilkan di dashboard dengan clear indication "Saldo Kredit: Rp 50.000"
- Initial balance digunakan first (sebelum paid credits) ketika process dokumen
- User dapat melihat history penggunaan balance dan transaksi
- Ketika balance habis, system menampilkan prompt untuk purchase paid credits
- Initial balance tidak dapat di-refill atau di-transfer ke user lain
- Initial balance tidak ada expiration date
- Nilai balance berkurang sesuai pricing per dokumen yang diproses

### 10.3 Document upload

**ID**: PESISIR-003
**Priority**: Must Have
**Story Points**: 5
**Sprint**: Sprint 2

**Description**:
Sebagai PPJK staff, saya ingin dapat upload dokumen Bill of Lading atau Invoice dalam format PDF atau image dengan mudah, sehingga saya dapat memulai proses ekstraksi data.

**Acceptance criteria**:

- User dapat drag and drop file ke upload area atau click untuk browse file
- Supported formats: PDF, JPG, JPEG, PNG
- Maximum file size: 10MB per file
- User dapat upload hingga 10 files sekaligus (batch upload)
- System menampilkan thumbnail preview untuk setiap uploaded file
- Progress bar ditampilkan saat upload file
- File validation: System reject file jika format tidak supported atau size melebihi limit dengan clear error message
- Uploaded files otomatis disimpan dan user dapat lihat list di "Uploaded Documents" section
- User dapat delete uploaded file sebelum process

### 10.4 OCR processing dan data extraction

**ID**: PESISIR-004
**Priority**: Must Have
**Story Points**: 13
**Sprint**: Sprint 2

**Description**:
Sebagai user, saya ingin system dapat otomatis membaca dan mengekstrak data dari dokumen yang saya upload dengan cepat dan akurat, sehingga saya tidak perlu manual copy-paste.

**Acceptance criteria**:

- User dapat klik "Process Document" button setelah upload
- System deduct 1 credit dari user balance saat start processing
- Progress indicator ditampilkan dengan estimated time remaining
- OCR processing complete dalam maksimal 2 menit untuk dokumen standard (1-3 halaman)
- System extract minimum fields berikut dengan 95% accuracy:
  - Shipper name dan address
  - Consignee name dan address
  - Vessel name
  - Bill of Lading number
  - Port of loading dan port of discharge
  - Cargo description, quantity, weight
  - Container numbers
- Setelah processing complete, user diarahkan ke review page dengan extracted data
- Jika processing gagal, credit di-refund dan user dapat retry

### 10.5 Data review dan editing

**ID**: PESISIR-005
**Priority**: Must Have
**Story Points**: 8
**Sprint**: Sprint 3

**Description**:
Sebagai user, saya ingin dapat review hasil ekstraksi data dan mengedit jika ada kesalahan atau data yang missing, sehingga dokumen yang di-generate akurat dan sesuai kebutuhan.

**Acceptance criteria**:

- Review page menampilkan split view: Original document di kiri, extracted data form di kanan
- Setiap field menampilkan confidence score dengan color coding:
  - Green (>90%): High confidence
  - Yellow (70-90%): Medium confidence, perlu quick review
  - Red (<70%): Low confidence, strongly recommend manual review
- User dapat click any field untuk edit langsung (inline editing)
- Changes auto-save setiap 2 detik atau ketika user move ke field lain
- User dapat zoom in/out pada original document untuk verify data
- Required fields yang kosong ditandai dengan red asterisk
- System validasi format untuk specific fields:
  - NPWP: Harus 15 digit
  - Email: Valid email format
  - Date: dd/mm/yyyy format
  - Amount: Numeric values only
- "Save Draft" button untuk save progress dan continue later
- "Generate Document" button enabled hanya jika all required fields terisi

### 10.6 Document generation

**ID**: PESISIR-006
**Priority**: Must Have
**Story Points**: 13
**Sprint**: Sprint 4

**Description**:
Sebagai user, saya ingin dapat generate dokumen pabean dalam format Excel yang sesuai template CEISA berdasarkan data yang sudah di-review, sehingga saya dapat langsung import ke CEISA tanpa perlu re-format.

**Acceptance criteria**:

- User dapat memilih document type yang ingin di-generate:
  - BC 1.1 (Manifest)
  - BC 2.3 (Pemberitahuan Impor untuk Ditimbun di TPS)
  - BC 3.0 (Pemberitahuan Impor untuk Diangkut Terus/Lanjut)
- System generate Excel file dalam maksimal 10 detik
- Generated file menggunakan template terbaru sesuai regulasi Bea Cukai
- Preview dokumen ditampilkan sebelum download (read-only Excel view atau screenshot)
- User dapat download file langsung di browser dengan one-click "Download" button
- Downloaded file naming convention: `{DocumentType}_{BOLNumber}_{Date}.xlsx`
- User dapat regenerate document dengan different template jika needed
- Generated document tersimpan di History untuk re-download hingga 30 hari
- Generated document hanya tersedia untuk download di browser (tidak ada opsi kirim via email)

### 10.7 Purchase document credits

**ID**: PESISIR-007
**Priority**: Must Have
**Story Points**: 13
**Sprint**: Sprint 5

**Description**:
Sebagai user yang sudah habis balance kredit initial, saya ingin dapat membeli document credits dengan berbagai pilihan payment method, sehingga saya dapat continue menggunakan layanan.

**Acceptance criteria**:

- User dapat access "Top Up Saldo" page dari dashboard atau ketika balance habis
- System menampilkan 3 pricing tiers:
  - Top up Rp 100.000 (untuk ~14 dokumen)
  - Top up Rp 200.000 (untuk ~29 dokumen, lebih hemat)
  - Top up Rp 500.000 (untuk ~71 dokumen, paling hemat)
  - Alternative: Single document Rp 10.000, Bundle 50 documents Rp 400.000 (20% discount), Bundle 100 documents Rp 700.000 (30% discount)
- User dapat memilih payment method:
  - Credit/debit card (Visa, Mastercard)
  - E-wallet (GoPay, OVO, DANA)
  - Bank transfer (manual verification)
- Payment flow via Midtrans/Xendit payment gateway
- Setelah payment success, balance kredit otomatis ditambahkan ke user account dalam 1 menit
- User menerima invoice via email setelah successful payment
- Transaction history ditampilkan di "Billing" page
- Failed payment: Clear error message dengan option untuk retry atau change payment method

### 10.8 View document history

**ID**: PESISIR-008
**Priority**: Must Have
**Story Points**: 5
**Sprint**: Sprint 4

**Description**:
Sebagai user, saya ingin dapat melihat history semua dokumen yang pernah saya process, sehingga saya dapat re-download atau reference dokumen lama jika needed.

**Acceptance criteria**:

- History page menampilkan list semua processed documents dengan info:
  - Document name
  - Document type (Manifest/BC 2.3/BC 3.0)
  - Processing date dan time
  - Status (Completed/Failed/In Progress)
- Sorting options: Date (newest/oldest), Document type
- Search function: Search by document name, BOL number, atau vessel name
- Filter function: Filter by document type, date range, status
- User dapat click document untuk view details dan re-download
- Download button available untuk documents yang masih dalam retention period (30 days)
- Expired documents (>30 days) ditampilkan dengan "Expired - No longer available" status
- Pagination: 20 documents per page

### 10.9 Report inaccurate extraction

**ID**: PESISIR-009
**Priority**: Should Have
**Story Points**: 3
**Sprint**: Sprint 6

**Description**:
Sebagai user, saya ingin dapat report jika hasil ekstraksi tidak akurat atau ada fields yang salah, sehingga system dapat improve dan akurasi meningkat dari waktu ke waktu.

**Acceptance criteria**:

- "Report Error" button available di review page
- User dapat select specific fields yang salah
- User dapat provide komentar atau explanation tentang kesalahan
- Option untuk attach screenshot atau highlight area yang problematis
- System record feedback dan link dengan document type untuk analysis
- User menerima confirmation "Thank you for your feedback" setelah submit
- System mengirim notification ke admin/product team untuk review
- Feedback history dapat dilihat di user profile

### 10.10 Mobile responsive access

**ID**: PESISIR-010
**Priority**: Must Have
**Story Points**: 8
**Sprint**: Sprint 6

**Description**:
Sebagai user yang sering mobile, saya ingin dapat mengakses PESISIR dari smartphone atau tablet dengan experience yang smooth, sehingga saya dapat process dokumen dari mana saja.

**Acceptance criteria**:

- Website fully responsive untuk screen size 320px - 768px (mobile) dan 768px - 1024px (tablet)
- Upload functionality working di mobile browser (iOS Safari dan Android Chrome)
- Touch-friendly UI: Button size minimum 44x44px untuk easy tap
- Form fields easy to edit di mobile dengan proper input types (numeric keyboard untuk amount fields, email keyboard untuk email fields)
- Split view di review page adjusted untuk mobile: Swipe between original document dan form view
- Zoom dan pan functionality working untuk view original document di mobile
- Download functionality working di mobile browser
- Page load time < 3 seconds di 3G connection
- No horizontal scrolling required
- Navigation menu collapsed ke hamburger menu di mobile

---

## Appendix

### A. Glossary

- **PPJK**: Perusahaan Pengurusan Jasa Kepabeanan - Perusahaan yang menyediakan jasa pengurusan dokumen kepabeanan
- **CEISA**: Customs Electronic Import-Export System Indonesia - System elektronik Bea Cukai Indonesia
- **Bill of Lading (BOL/B/L)**: Dokumen dari shipping line yang berisi detail cargo dan shipment
- **OCR**: Optical Character Recognition - Teknologi untuk membaca text dari image atau PDF
- **Manifest**: Daftar lengkap cargo dalam satu shipment
- **BC 2.3**: Dokumen Pemberitahuan Impor Barang untuk Ditimbun di TPS/TPP
- **BC 3.0**: Dokumen Pemberitahuan Impor Barang untuk Diangkut Terus/Diangkut Lanjut
- **TPS**: Tempat Penimbunan Sementara
- **Lartas**: Larangan dan Pembatasan - Barang-barang yang dilarang atau dibatasi untuk impor/ekspor
- **HS Code**: Harmonized System Code - Kode klasifikasi internasional untuk barang
- **BC 1.1**: Dokumen pemberitahuan impor/ekspor barang yang berisi daftar cargo (Manifest). Nama umum dokumen ini adalah "Manifest"
- **PDF Parser**: Tools untuk mengekstrak data dari PDF text-based/searchable tanpa menggunakan teknologi OCR

### B. References

- [PESISIR_PLAN.md](docs/PESISIR_PLAN.md) - Technical planning document
- Peraturan Menteri Keuangan tentang Kepabeanan
- CEISA Documentation (internal reference)
- Azure Document Intelligence Documentation: https://learn.microsoft.com/azure/ai-services/document-intelligence/

### C. Document history

- **Version 1.0.0** (December 13, 2025): Initial PRD draft untuk MVP PESISIR
- **Version 2.0.0** (December 29, 2025): **Agile Methodology Revision** - Updated dari waterfall approach ke Agile Scrum dengan 2-week sprints, added sprint planning, backlog prioritization, agile ceremonies, dan team velocity metrics

---

**Next Steps**:

1. ✅ Review dan approval PRD dari stakeholders
2. **Sprint 0 Preparation** (Week -1):
   - Setup product backlog dalam project management tool (Jira/Azure DevOps)
   - Create sprint board dengan columns: Backlog → To Do → In Progress → Review → Done
   - Schedule recurring sprint ceremonies (planning, daily standup, review, retro)
   - Team kick-off meeting dan Scrum role assignment
3. **Sprint Planning Session** (Before Sprint 1):
   - Backlog refinement untuk Sprint 1 user stories
   - Story point estimation session (Planning Poker)
   - Sprint 1 commitment dan sprint goal definition
4. **Begin Sprint 1 Development** (Week 1)
