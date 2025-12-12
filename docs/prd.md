# PRD: PESISIR - Platform Otomasi Dokumen Pabean

## 1. Product overview

### 1.1 Document title and version

- PRD: PESISIR - Platform Otomasi Dokumen Pabean untuk PPJK
<!-- - PRD: PESISIR - Platform Solusi Digital Satu Atap Ekspor-Impor -->
- Version: 1.0.0
- Date: December 13, 2025
- Status: Draft

### 1.2 Product summary

PESISIR adalah platform digital yang dirancang khusus untuk membantu staff PPJK (Perusahaan Pengurusan Jasa Kepabeanan) dalam mengotomasi proses pembuatan draft dokumen pabean. Platform ini menggunakan teknologi OCR (Optical Character Recognition) dan AI untuk mengekstrak data dari dokumen PDF berbentuk image (seperti Bill of Lading, Invoice, Packing List) dan secara otomatis menghasilkan draft dokumen pabean yang siap digunakan.

Dengan pendekatan B2C, PESISIR menargetkan karyawan PPJK secara individual, bukan perusahaan. Hal ini memungkinkan adopsi yang lebih cepat dan fleksibel. Platform ini dirancang dengan pemahaman mendalam tentang tantangan teknis dan operasional yang khas di Indonesia, seperti dokumen scan berkualitas rendah, format tidak standar, dan workflow yang bervariasi antar perusahaan.

MVP PESISIR fokus pada otomasi tiga jenis dokumen prioritas: Manifest, BC 2.3 (Dokumen Pemberitahuan Impor Barang untuk Ditimbun di TPS/TPP), dan BC 3.0 (Dokumen Pemberitahuan Impor Barang Untuk Diangkut Terus/Diangkut Lanjut). Dengan otomasi ini, waktu pembuatan dokumen dapat dikurangi dari 10 menit menjadi hanya 1 menit per dokumen - penghematan waktu hingga 90%.

## 2. Goals

### 2.1 Business goals

- **Akuisisi pengguna cepat**: Mencapai 100 pengguna aktif dalam 3 bulan pertama sejak peluncuran MVP
- **Validasi product-market fit**: Memvalidasi model pay-per-document dengan tingkat konversi minimum 20% dari free trial users
- **Membangun reputasi kualitas**: Mencapai tingkat akurasi ekstraksi data minimum 95% untuk mengurangi bug dan kesalahan
- **Revenue generation**: Mencapai break-even operasional (biaya infrastructure + marketing) dalam 6 bulan
- **Foundation untuk ekspansi**: Membangun basis pengguna yang solid untuk ekspansi ke fitur tambahan (Learn, HS Code Classifier) dan target B2B di masa depan
- **Brand positioning**: Memposisikan PESISIR sebagai solusi lokal yang memahami tantangan khas Indonesia dalam pengurusan dokumen pabean

### 2.2 User goals

- **Efisiensi waktu**: Mengurangi waktu pembuatan draft dokumen pabean dari 10 menit menjadi 1 menit per dokumen (90% lebih cepat)
- **Menghilangkan pekerjaan manual repetitif**: Menghindari proses copy-paste manual dari PDF image yang memakan waktu dan rentan kesalahan
- **Akurasi data**: Meminimalkan human error dalam entry data dengan ekstraksi otomatis yang akurat
- **Fleksibilitas kerja**: Dapat memproses dokumen dari mana saja dan kapan saja (cloud-based)
- **Kemudahan adopsi**: Onboarding yang cepat tanpa perlu approval manajemen atau prosedur procurement perusahaan yang panjang
- **Cost transparency**: Model pay-per-document yang jelas dan transparan tanpa biaya langganan bulanan yang memberatkan

### 2.3 Non-goals (Out of Scope)

- **Integrasi langsung dengan CEISA**: MVP tidak akan terintegrasi langsung dengan API CEISA (akan menghasilkan file Excel/CSV yang dapat di-import manual)
- **Fitur edukatif (Learn)**: Konten pembelajaran tentang customs dan regulasi tidak termasuk dalam MVP
- **HS Code Classifier**: Tool untuk klasifikasi otomatis HS Code tidak termasuk dalam MVP
- **Shipment tracking real-time**: Pelacakan kapal dan notifikasi ETA tidak termasuk dalam MVP dokumen otomasi
- **Collaborative features**: Fitur kolaborasi tim (comments, approvals, shared workspace) tidak termasuk dalam MVP
- **Target B2B/Enterprise**: MVP fokus ke individual users (B2C), bukan penjualan enterprise dengan SLA dan custom features
- **Multi-language support**: MVP hanya mendukung Bahasa Indonesia dan Bahasa Inggris untuk UI
- **Mobile native app**: MVP hanya mendukung web application (responsive design), tidak ada iOS/Android native app

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
  - Akses: 5 dokumen gratis untuk trial
  - Features: Full access ke semua fitur ekstraksi dan generation
  - Limitations: Watermark pada output, no priority processing
- **Individual User (Paid)**:
  - Akses: Unlimited document processing (pay-per-document)
  - Features: Full access tanpa watermark, priority processing queue
  - Pricing: Tiered pricing berdasarkan volume (single doc, bundle 50, bundle 100)

## 4. Functional requirements

### 4.1 Document upload & parsing (Priority: CRITICAL)

- System harus dapat menerima upload dokumen dalam format PDF (image-based dan text-based), JPG, dan PNG
- Maximum file size: 10MB per dokumen
- System harus dapat mendeteksi jenis dokumen (Bill of Lading, Commercial Invoice, Packing List) secara otomatis
- OCR processing harus selesai dalam maksimal 2 menit untuk dokumen standar (1-3 halaman)
- System harus menampilkan progress bar real-time saat OCR processing
- User dapat upload multiple documents sekaligus (batch upload) hingga 10 files
- System harus dapat handle dokumen dengan kualitas scan rendah (minimum 150 DPI)

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
  - **Manifest**: Daftar cargo dalam shipment dengan detail container (revisi: Manifest itu adalah BC 1.1)
  - **BC 2.3**: Pemberitahuan Impor Barang untuk Ditimbun di TPS
  - **BC 3.0**: Pemberitahuan Impor Barang untuk Diangkut Terus/Lanjut
- Output format: Excel (.xlsx) yang compatible dengan template CEISA
- Generated document harus include semua mandatory fields sesuai regulasi Bea Cukai
- System harus menyediakan preview dokumen sebelum download
- User dapat memilih template version (jika ada update regulasi)
- Generated document harus dapat di-download langsung atau dikirim via email

### 4.4 User onboarding & authentication (Priority: HIGH)

- Registration hanya memerlukan email dan password (no phone verification di MVP)
- Email verification mandatory sebelum dapat menggunakan layanan
- Social login option: Google OAuth untuk kemudahan akses dan passkey
- New user automatically mendapat 5 free trial documents (revisi: ubah menjadi 17 kali.)
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

- **User acquisition**: 100 registered users dalam 3 bulan pertama
- **Activation rate**: Minimum 60% dari registered users complete onboarding dan process minimal 1 dokumen
- **Trial conversion**: Minimum 20% dari trial users convert ke paid users (beli document credits)
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

## 8. Technical considerations (Input untuk Mode Spesifikasi)

### 8.1 Integration points

- **Azure Document Intelligence (Form Recognizer)**: OCR engine untuk ekstraksi data dari PDF images
- **Payment gateway**: Midtrans atau Xendit untuk payment processing
- **Email service**: SendGrid atau AWS SES untuk transactional emails (verification, invoices, notifications)
- **Cloud storage**: Azure Blob Storage atau AWS S3 untuk storing uploaded documents dan generated files
- **Authentication**: ASP.NET Core Identity dengan Google OAuth integration
- **Analytics**: Google Analytics atau Mixpanel untuk user behavior tracking

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

### 8.3 Scalability & performance targets

- **Concurrent users**: System harus dapat handle minimum 50 concurrent users di MVP
- **Document processing throughput**: Minimum 100 documents per hour
- **Database**: SQL Server dengan indexing untuk fast query pada document history
- **Caching**: Implement caching untuk static data (templates, pricing info)
- **Background job processing**: Hangfire untuk async OCR processing agar tidak block user interface
- **Auto-scaling consideration**: Infrastructure harus dapat di-scale horizontally jika traffic meningkat post-MVP
- **CDN**: Serve static assets via CDN untuk faster loading di berbagai region Indonesia

### 8.4 Potential technical challenges

- **OCR accuracy variability**:
  - Dokumen dengan kualitas scan buruk dapat menghasilkan accuracy < 95%
  - Mitigation: Set confidence threshold dan flag low-confidence fields untuk manual review
  - Continuous improvement: Collect feedback untuk training custom models
- **Document format variations**:
  - Bill of Lading dan invoice dari berbagai shipping lines memiliki format yang berbeda-beda
  - Mitigation: Train separate models untuk common formats, fallback ke generic model
- **CEISA template changes**:
  - Bea Cukai dapat mengubah format template dokumen pabean sewaktu-waktu
  - Mitigation: Versioned templates, quick update mechanism, notification ke users jika ada template baru
- **Processing time bottleneck**:
  - Azure Document Intelligence API memiliki rate limits dan latency
  - Mitigation: Implement queue system, batch processing, status polling
- **Payment integration complexity**:
  - Payment callbacks, reconciliation, failed payment handling
  - Mitigation: Use established payment gateway (Midtrans/Xendit) dengan robust SDK dan documentation
- **Localization of error messages**:
  - Technical error messages perlu di-translate ke Bahasa Indonesia yang user-friendly
  - Mitigation: Error message dictionary, consistent error handling patterns

## 9. Milestones & sequencing

### 9.1 Project estimate

- **Size**: Medium project
- **Timeline**: 3 bulan dari development kick-off hingga MVP launch
- **Effort estimate**:
  - Month 1: Core infrastructure dan OCR integration (40% progress)
  - Month 2: Document generation, payment integration, dan UI polish (80% progress)
  - Month 3: Testing, bug fixing, dan soft launch (100%)

### 9.2 Team size & composition

- **Team size**: 4-5 orang
- **Roles**:
  - 1 Product Manager (part-time, 50% allocation)
  - 2 Full-stack developers (.NET + Blazor)
  - 1 UI/UX Designer (part-time for Month 1-2)
  - 1 QA Engineer (full-time for Month 2-3)
  - 1 DevOps/Infrastructure engineer (part-time, 25% allocation)

### 9.3 Suggested phases

#### Phase 1: Foundation & Core Infrastructure (Week 1-4)

**Timeline**: 4 minggu

**Key deliverables**:

- Project setup: Repository, CI/CD pipeline, development environment
- Authentication system: User registration, login, email verification, Google OAuth
- Database schema dan Entity Framework migrations
- Azure Document Intelligence integration dan testing dengan sample documents
- Basic UI layout: Landing page, registration flow, dashboard skeleton
- Document upload functionality dengan file validation

**Success criteria**:

- User dapat register dan login
- User dapat upload PDF dan system dapat call OCR API
- Infrastructure deployed ke staging environment

#### Phase 2: Document Processing & Generation (Week 5-8)

**Timeline**: 4 minggu

**Key deliverables**:

- OCR processing pipeline dengan Hangfire background jobs
- Data extraction dan confidence scoring logic
- Review & edit interface untuk extracted data
- Excel generation engine untuk 3 jenis dokumen (Manifest, BC 2.3, BC 3.0)
- Document preview dan download functionality
- History page untuk melihat processed documents
- Error handling dan retry mechanism

**Success criteria**:

- End-to-end flow: Upload → Extract → Edit → Generate → Download working
- Accuracy testing: Minimum 95% pada 50 sample documents
- Processing time: p95 < 2 menit untuk standard document

#### Phase 3: Payment & Polish (Week 9-12)

**Timeline**: 4 minggu

**Key deliverables**:

- Payment gateway integration (Midtrans atau Xendit)
- Credit system: Free trial credits, purchase document bundles, credit tracking
- Transaction history dan invoice generation
- Onboarding wizard dan tutorial
- UI/UX polish: Responsive design, loading states, error messages
- Performance optimization dan caching
- Comprehensive testing: Unit tests, integration tests, end-to-end tests
- Documentation: User guide, API documentation, deployment guide
- Marketing website updates dan pricing page
- Beta testing dengan 10-20 early adopters
- Bug fixing dan final polish untuk launch

**Success criteria**:

- Payment flow working end-to-end dengan 3 payment methods
- Zero critical bugs
- Beta tester feedback positive (NPS > +20)
- System ready untuk public launch

#### Phase 4: Launch & Iteration (Week 13+)

**Timeline**: Ongoing post-launch

**Key activities**:

- Public launch announcement via social media, LinkedIn, industry forums
- User acquisition campaign: Paid ads (Google, LinkedIn), content marketing
- User support: Setup customer support channels (email, WhatsApp, in-app chat)
- Monitoring dan analytics: Track success metrics daily
- Rapid iteration: Weekly releases untuk fix bugs dan minor improvements
- User feedback collection: In-app surveys, user interviews
- Plan for next features: Prepare roadmap untuk post-MVP features (HS Code Classifier, Learn module)

**Success milestones**:

- Week 2 post-launch: 20 registered users
- Week 4 post-launch: 50 registered users, 5 paid users
- Week 8 post-launch: 100 registered users, 20 paid users
- Week 12 post-launch: Decision point untuk pivot, persevere, atau accelerate berdasarkan metrics

## 10. User stories

### 10.1 User registration dan onboarding

**ID**: PESISIR-001

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

### 10.2 Free trial allocation

**ID**: PESISIR-002

**Description**:
Sebagai new user, saya ingin mendapat free trial credits untuk mencoba layanan sebelum membeli, sehingga saya dapat memvalidasi bahwa PESISIR sesuai kebutuhan saya tanpa risiko finansial.

**Acceptance criteria**:

- Setiap new user otomatis mendapat 5 free trial credits setelah verify email
- Trial credits ditampilkan di dashboard dengan clear indication "5 Dokumen Gratis Tersisa"
- Trial credits digunakan first (sebelum paid credits) ketika process dokumen
- User dapat melihat history penggunaan trial credits
- Ketika trial credits habis, system menampilkan prompt untuk purchase paid credits
- Trial credits tidak dapat di-refill atau di-transfer
- Trial credits tidak ada expiration date

### 10.3 Document upload

**ID**: PESISIR-003

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

**Description**:
Sebagai user, saya ingin dapat generate dokumen pabean dalam format Excel yang sesuai template CEISA berdasarkan data yang sudah di-review, sehingga saya dapat langsung import ke CEISA tanpa perlu re-format.

**Acceptance criteria**:

- User dapat memilih document type yang ingin di-generate:
  - Manifest
  - BC 2.3 (Pemberitahuan Impor untuk Ditimbun di TPS)
  - BC 3.0 (Pemberitahuan Impor untuk Diangkut Terus/Lanjut)
- System generate Excel file dalam maksimal 10 detik
- Generated file menggunakan template terbaru sesuai regulasi Bea Cukai
- Preview dokumen ditampilkan sebelum download (read-only Excel view atau screenshot)
- User dapat download file dengan one-click "Download" button
- Downloaded file naming convention: `{DocumentType}_{BOLNumber}_{Date}.xlsx`
- User dapat regenerate document dengan different template jika needed
- Generated document tersimpan di History untuk re-download hingga 30 hari

### 10.7 Purchase document credits

**ID**: PESISIR-007

**Description**:
Sebagai user yang sudah habis free trial credits, saya ingin dapat membeli document credits dengan berbagai pilihan payment method, sehingga saya dapat continue menggunakan layanan.

**Acceptance criteria**:

- User dapat access "Buy Credits" page dari dashboard atau ketika credits habis
- System menampilkan 3 pricing tiers:
  - Single document: Rp 10.000
  - Bundle 50 documents: Rp 400.000 (20% discount)
  - Bundle 100 documents: Rp 700.000 (30% discount)
- User dapat memilih payment method:
  - Credit/debit card (Visa, Mastercard)
  - E-wallet (GoPay, OVO, DANA)
  - Bank transfer (manual verification)
- Payment flow via Midtrans/Xendit payment gateway
- Setelah payment success, credits otomatis ditambahkan ke user balance dalam 1 menit
- User menerima invoice via email setelah successful payment
- Transaction history ditampilkan di "Billing" page
- Failed payment: Clear error message dengan option untuk retry atau change payment method

### 10.8 View document history

**ID**: PESISIR-008

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

### B. References

- [PESISIR_PLAN.md](docs/PESISIR_PLAN.md) - Technical planning document
- Peraturan Menteri Keuangan tentang Kepabeanan
- CEISA Documentation (internal reference)
- Azure Document Intelligence Documentation: https://learn.microsoft.com/azure/ai-services/document-intelligence/

### C. Document history

- **Version 1.0.0** (December 13, 2025): Initial PRD draft untuk MVP PESISIR

---

**Next Steps**:

1. Review dan approval PRD dari stakeholders -- Saat ini cuma saya :(
2. Create GitHub issues untuk setiap user story
3. Kickoff technical specification document (Mode: Specification)
4. Begin Phase 1 development
