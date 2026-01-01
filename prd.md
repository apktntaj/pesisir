# PRD: Sippment

## 1. Product Overview

### 1.1 Document Title and Version

- **PRD**: Sippment - Shipment Tracking & Document Management
- **Version**: 1.0
- **Platform**: Pesisir
- **Date**: January 1, 2026

### 1.2 Product Summary

**Sippment** adalah aplikasi manajemen shipment yang menjadi bagian dari platform Pesisir. Aplikasi ini memungkinkan pengguna di industri ekspor-impor untuk melacak status pengiriman barang secara real-time dengan Bill of Lading (BL) sebagai dokumen sumber kebenaran (source of truth).

Fitur utama Sippment adalah kemampuan parsing dokumen BL dalam format PDF untuk mengekstrak data shipment secara otomatis, mengurangi input manual yang memakan waktu dan rentan kesalahan. Pengguna dapat mengelola seluruh dokumen pendukung shipment dalam satu tempat terpusat.

Sippment dirancang dengan pendekatan B2C terlebih dahulu untuk validasi produk dan adopsi pasar, dengan rencana ekspansi ke segmen B2B setelah product-market fit tercapai.

---

## 2. Goals

### 2.1 Business Goals

- Memvalidasi kebutuhan pasar akan solusi tracking shipment berbasis parsing BL
- Membangun user base awal dari kalangan profesional ekspor-impor (forwarder, PPJK, importir)
- Mengumpulkan feedback untuk iterasi produk sebelum ekspansi B2B
- Menjadi fondasi untuk ekosistem Pesisir yang lebih luas

### 2.2 User Goals

- Mengurangi waktu input data shipment dengan parsing BL otomatis
- Melacak status shipment secara real-time tanpa harus bertanya ke banyak pihak
- Menyimpan dan mengakses dokumen pendukung shipment dalam satu tempat
- Memberikan update otomatis ke pihak terkait (consignee, partner) via WhatsApp
- Menyesuaikan workflow status sesuai kebutuhan operasional masing-masing

### 2.3 Non-goals (Out of Scope)

- Integrasi langsung dengan sistem bea cukai (CEISA) di fase MVP
- Fitur multi-user/team collaboration di fase MVP
- Monetisasi atau subscription di fase MVP
- Tracking GPS real-time untuk kapal
- Integrasi dengan sistem ERP atau accounting
- Mobile native app (fokus web-first)

---

## 3. User Personas

### 3.1 Key User Types

- Freight Forwarder
- PPJK (Pengusaha Pengurusan Jasa Kepabeanan)
- Importir/Eksportir
- Broker Logistik Independen
- Staff Operasional Perusahaan Trading

### 3.2 Basic Persona Details

- **Andi (Freight Forwarder)**: Mengelola 20-50 shipment aktif per bulan. Sering kesulitan update status ke klien secara manual. Butuh sistem yang bisa otomatis notifikasi klien saat status berubah.

- **Budi (PPJK)**: Fokus pada pengurusan dokumen kepabeanan. Perlu reminder saat shipment menjelang tiba agar bisa siapkan BC 1.1 tepat waktu. Sering kehilangan waktu mencari dokumen pendukung yang tersebar di berbagai folder.

- **Citra (Importir UMKM)**: Melakukan impor 2-5 kali per bulan. Tidak punya tim dedicated, mengurus sendiri. Butuh sistem simple untuk track barangnya tanpa harus terus-terusan WhatsApp forwarder.

- **Deni (Broker Independen)**: Freelancer yang handle shipment untuk beberapa klien. Butuh sistem terpusat agar tidak tercampur data antar klien.

### 3.3 Role-based Access

- **Owner (Single User)**: Full access ke semua fitur — create, read, update, delete shipment dan dokumen. Mengelola daftar notifikasi WhatsApp.

---

## 4. Functional Requirements

### 4.1 BL Parsing (Priority: High)

- Sistem dapat menerima upload file PDF Bill of Lading
- Sistem mengekstrak data dari BL secara otomatis menggunakan PDF parsing
- Data yang diekstrak meliputi:
  - Nomor BL 
  - Shipper (nama dan alamat)
  - Consignee (nama dan alamat)
  - Notify Party/Third Party (nama dan alamat)
  - Voyage number
  - Vessel name
  - Port of Loading (POL)
  - Port of Discharge (POD)
  - Description of Goods
  - Container type (FCL/LCL)
  - volume
- User dapat review dan edit hasil parsing sebelum menyimpan
- Sistem menyimpan file BL asli sebagai referensi

### 4.2 Shipment Management (Priority: High)

- User dapat membuat shipment baru (manual atau via parsing BL)
- User dapat mereview dan melakukan edit sebelum menyimpan
- User dapat melihat daftar semua shipment dengan filter dan search
- User dapat melihat detail shipment lengkap
- User dapat mengedit data shipment
- User dapat menghapus shipment
- User dapat menambahkan notes pada shipment

**Data Shipment:**

| Field | Deskripsi | Required |
|-------|-----------|----------|
| BL Number | Nomor Bill of Lading | Ya |
| Ref | Penamaan yang mudah diingat untuk referensi | Tidak |
| Shipper | Nama pengirim | Ya |
| Shipper Address | Alamat pengirim | Tidak |
| Consignee | Nama penerima | Ya |
| Consignee Address | Alamat penerima | Tidak |
| Third Party | Pihak ketiga (notify party) | Tidak |
| Third Party Address | Alamat pihak ketiga | Tidak |
| Voyage | Nomor voyage | Tidak |
| Vessel | Nama kapal | Tidak |
| POL | Port of Loading | Tidak |
| POD | Port of Discharge | Ya |
| Description | Deskripsi barang | Tidak |
| Variant | FCL atau LCL | Ya |
| Dokumen | Kumpulan dokumen pelengkap sebagai syarat kepatuhan shipmnet | Tidak |
| Notes | Catatan tambahan | Tidak |
| Subscriber | Nomor telepon yang akan dikirimi notifikasi saat perubahan status shipment | Ya (setidaknya satu nomor) |

### 4.3 Status Tracking (Priority: High)

- Sistem menyediakan 7 status default:

| Status | Deskripsi | Trigger Action |
|--------|-----------|----------------|
| **Created** | Shipment baru dibuat | - |
| **Sailing** | Kapal dalam perjalanan | - |
| **Pre-arrival** | Menjelang tiba di pelabuhan | Reminder siapkan BC 1.1 |
| **Arrived** | Kapal tiba/sandar | - |
| **Clearing** | Proses customs berjalan | - |
| **Released** | SPPB terbit, barang bisa keluar | - |
| **Delivered** | Barang diterima consignee | - |

- User dapat mengubah status shipment secara manual
- status hanya dapat berubah maju mengikuti timeline
- Sistem mencatat history perubahan status dengan timestamp
- Setiap perubahan status memicu notifikasi WhatsApp

### 4.4 Custom Workflow (Priority: Medium)

- User dapat membuat status custom sesuai kebutuhan workflow
- User dapat mengatur urutan status dalam workflow
- User dapat mengaktifkan/menonaktifkan status tertentu
- User dapat kembali ke workflow default kapan saja
- Custom workflow berlaku per akun (bukan per shipment)

### 4.5 Document Management (Priority: High)

- User dapat upload dokumen pendukung per shipment
- Tipe dokumen yang didukung:
  - Invoice
  - Packing List
  - Certificate of Origin (COO)
  - MSDS (Material Safety Data Sheet)
  - Dokumen kepatuhan lainnya
- User dapat memberikan label/kategori pada dokumen
- User dapat preview dan download dokumen
- User dapat menghapus dokumen
- Format file yang didukung: PDF, JPG, PNG

### 4.6 WhatsApp Notification (Priority: High)

- User dapat menambahkan daftar nomor WhatsApp per shipment
- Setiap nomor WA dapat diberi label (contoh: "Consignee", "Pemilik Barang", "Trucking")
- Sistem mengirim notifikasi otomatis saat status berubah
- Format notifikasi:
  ```
  [Sippment Update]
  Ref: {ref/No BL (fallback)}
  Status: {new_status}
  Waktu: {timestamp}
  
  {contextual_message}
  ```
- Contextual message untuk status **Approaching**:
  > "Shipment menjelang tiba. Pastikan dokumen BC 1.1 sudah siap."
- User dapat mengaktifkan/menonaktifkan notifikasi per nomor WA

### 4.7 User Authentication (Priority: High)

- User dapat mendaftar dengan email dan password
- User dapat login ke akun
- User dapat logout
- User dapat reset password via email
- User dapat mengedit profil (nama, nomor WA utama)

---

## 5. User Experience

### 5.1 Entry Points & First-time User Flow

- Landing page menjelaskan value proposition Sippment
- User mendaftar dengan email
- Onboarding singkat (3 langkah):
  1. Lengkapi profil dan nomor WA
  2. Upload BL pertama atau buat shipment manual
  3. Tambahkan nomor WA untuk notifikasi
- Redirect ke dashboard dengan shipment pertama

### 5.2 Core Experience

- **Dashboard**: Overview semua shipment aktif dengan status terkini
  - Quick stats: jumlah per status
  - List shipment dengan filter (status, tanggal, search)
  - Quick action: ubah status langsung dari list

- **Create Shipment**: Dua mode pembuatan
  - Upload BL → review hasil parsing → simpan
  - Input manual → isi form → simpan

- **Shipment Detail**: Single page dengan semua informasi
  - Data shipment lengkap
  - Status timeline dengan history
  - Daftar dokumen pendukung
  - Daftar nomor WA notifikasi
  - Quick action: ubah status, upload dokumen

- **Settings**: Konfigurasi akun dan workflow
  - Profil user
  - Custom workflow status
  - Template notifikasi (future)

### 5.3 Advanced Features & Edge Cases

- Parsing BL gagal → user diarahkan ke input manual dengan pesan error yang jelas
- Nomor WA tidak valid → validasi format sebelum simpan
- Upload dokumen gagal → retry dengan feedback yang jelas
- Shipment tanpa perubahan status > 7 hari → visual indicator "stale"

### 5.4 UI/UX Highlights

- Mobile-responsive design (prioritas karena user sering di lapangan)
- Status ditampilkan dengan warna berbeda untuk quick recognition
- Drag-and-drop untuk upload dokumen
- One-click status change dari dashboard
- Search global untuk BL number, consignee, atau vessel

---

## 6. Narrative

Bayangkan Andi, seorang freight forwarder yang mengelola 30 shipment aktif. Setiap hari dia menerima puluhan WhatsApp dari klien yang bertanya "Barang saya sudah sampai mana?". Dia harus cek satu per satu ke shipping line, lalu copy-paste info ke klien. Memakan waktu 2-3 jam sehari hanya untuk update status.

Dengan Sippment, Andi cukup upload BL dari shipping line — sistem otomatis ekstrak semua data. Saat dia update status ke "Arrived", semua nomor WA yang terdaftar di shipment tersebut langsung dapat notifikasi. Klien happy karena dapat update real-time, Andi bisa fokus ke pekerjaan yang lebih bernilai.

Saat status berubah ke "Pre-arrive", sistem otomatis remind tim Andi untuk siapkan BC 1.1. Tidak ada lagi shipment yang tertunda karena dokumen belum siap. Semua invoice dan packing list tersimpan rapi per shipment — tidak perlu lagi scroll chat WhatsApp mencari dokumen.

---

## 7. Success Metrics

### 7.1 User-centric Metrics

- **Adoption Rate**: Jumlah user yang complete onboarding / total signup ≥ 60%
- **Activation Rate**: User yang buat minimal 1 shipment dalam 7 hari pertama ≥ 50%
- **Retention Rate**: User yang aktif di minggu ke-4 setelah signup ≥ 30%
- **Feature Usage**: % shipment yang dibuat via BL parsing vs manual ≥ 40%
- **NPS Score**: Target ≥ 40 setelah 3 bulan launch

### 7.2 Business Metrics

- **Total Users**: Target 500 registered users dalam 3 bulan pertama
- **Active Shipments**: Target 2,000 shipment aktif dalam 3 bulan
- **Notification Sent**: Target 10,000 WhatsApp notification dalam 3 bulan
- **Organic Growth**: % user dari referral ≥ 20%

### 7.3 Technical Metrics

- **Uptime**: ≥ 99.5%
- **BL Parsing Accuracy**: ≥ 85% fields correctly extracted
- **WhatsApp Delivery Rate**: ≥ 95%
- **Page Load Time**: ≤ 3 detik pada koneksi 3G
- **API Response Time**: ≤ 500ms untuk 95th percentile

---

## 8. Technical Considerations

### 8.1 Integration Points

- **WhatsApp Business API**: Untuk pengiriman notifikasi otomatis
- **PDF Parsing Library**: Untuk ekstraksi data dari BL (contoh: pdf-parse, Apache PDFBox)
- **Cloud Storage**: Untuk penyimpanan dokumen (AWS S3, Google Cloud Storage, atau Supabase Storage)
- **Authentication Provider**: Email/password auth (bisa pakai Supabase Auth, Firebase Auth, atau custom)

### 8.2 Data Storage & Privacy

- Data shipment termasuk informasi bisnis sensitif — perlu enkripsi at rest dan in transit
- Dokumen disimpan dengan access control per user
- Nomor WhatsApp adalah PII — perlu compliance dengan regulasi privasi
- Implementasi soft delete untuk audit trail
- Backup reguler untuk disaster recovery

### 8.3 Scalability & Performance Targets

- Sistem harus handle 100 concurrent users di fase awal
- Target: 10,000 shipments dan 50,000 dokumen dalam tahun pertama
- PDF parsing harus async agar tidak blocking UI
- WhatsApp notification menggunakan queue system untuk reliability

### 8.4 Potential Technical Challenges

- **Variasi format BL**: Setiap shipping line punya format BL berbeda — parsing perlu adaptif atau gunakan AI/ML
- **WhatsApp API limitations**: Rate limiting, format message, biaya per message
- **PDF quality**: BL yang di-scan dengan kualitas rendah akan sulit di-parse
- **Offline capability**: User di pelabuhan mungkin koneksi tidak stabil — pertimbangkan PWA

---

## 9. Milestones & Sequencing

### 9.1 Project Estimate

- **Size**: Medium
- **Timeline**: 8-10 minggu untuk MVP

### 9.2 Team Size & Composition

- **Ideal Team**: 2-3 orang
  - 1 Full-stack Developer
  - 1 Frontend Developer (optional)
  - 1 Product/Design (part-time)

### 9.3 Suggested Phases

#### **Phase 1: Foundation (Minggu 1-3)**
- Setup project infrastructure
- User authentication (signup, login, profile)
- Database schema design
- Basic UI/UX framework

**Deliverables:**
- Working auth system
- Database ready
- Design system/component library

#### **Phase 2: Core Shipment (Minggu 4-5)**
- CRUD shipment (manual input)
- Status management dengan 7 default status
- Shipment list dengan filter dan search
- Shipment detail page

**Deliverables:**
- User bisa create, view, edit, delete shipment
- User bisa update status

#### **Phase 3: BL Parsing (Minggu 6-7)**
- PDF upload functionality
- BL parsing engine
- Review dan edit hasil parsing
- Error handling untuk parsing gagal

**Deliverables:**
- User bisa upload BL dan auto-populate shipment data

#### **Phase 4: Documents & Notifications (Minggu 8-9)**
- Document upload dan management
- WhatsApp notification list per shipment
- WhatsApp API integration
- Notification trigger saat status change

**Deliverables:**
- User bisa upload dokumen pendukung
- WhatsApp notification berjalan otomatis

#### **Phase 5: Polish & Launch (Minggu 10)**
- Custom workflow status
- Bug fixing dan optimization
- Testing dengan real users
- Deployment production

**Deliverables:**
- MVP ready for soft launch

---

## 10. User Stories

### 10.1 User Registration

- **ID**: SPM-001
- **Description**: Sebagai pengguna baru, saya ingin mendaftar akun agar bisa menggunakan Sippment untuk mengelola shipment saya.
- **Acceptance Criteria**:
  - User dapat mengakses halaman registrasi
  - User dapat mendaftar dengan email dan password
  - Sistem memvalidasi format email dan kekuatan password
  - User menerima email konfirmasi setelah registrasi
  - User diarahkan ke onboarding setelah konfirmasi email

### 10.2 User Login

- **ID**: SPM-002
- **Description**: Sebagai pengguna terdaftar, saya ingin login ke akun saya agar bisa mengakses data shipment saya.
- **Acceptance Criteria**:
  - User dapat mengakses halaman login
  - User dapat login dengan email dan password yang valid
  - Sistem menampilkan error jika kredensial salah
  - User diarahkan ke dashboard setelah login berhasil
  - Session tetap aktif selama 7 hari

### 10.3 Upload dan Parse BL

- **ID**: SPM-003
- **Description**: Sebagai user, saya ingin upload dokumen BL dalam format PDF agar sistem dapat mengekstrak data shipment secara otomatis.
- **Acceptance Criteria**:
  - User dapat mengakses fitur upload BL dari dashboard
  - User dapat memilih file PDF dari device
  - Sistem menampilkan loading indicator saat parsing
  - Sistem menampilkan hasil parsing dalam form yang bisa diedit
  - User dapat menyimpan data setelah review
  - Jika parsing gagal, user diarahkan ke form manual dengan pesan error

### 10.4 Create Shipment Manual

- **ID**: SPM-004
- **Description**: Sebagai user, saya ingin membuat shipment secara manual agar bisa mengelola shipment meskipun tidak punya file BL digital.
- **Acceptance Criteria**:
  - User dapat mengakses form create shipment
  - Form menampilkan semua field sesuai data structure
  - Field required ditandai dengan jelas
  - User dapat menyimpan shipment dengan data minimal (BL Number, Consignee, POD, Variant)
  - Shipment baru memiliki status "Created" secara default

### 10.5 View Shipment List

- **ID**: SPM-005
- **Description**: Sebagai user, saya ingin melihat daftar semua shipment saya agar bisa memantau status secara keseluruhan.
- **Acceptance Criteria**:
  - Dashboard menampilkan list semua shipment milik user
  - Setiap item menampilkan: BL Number, Consignee, Status, Vessel, POD
  - Status ditampilkan dengan warna berbeda per status
  - User dapat filter berdasarkan status
  - User dapat search berdasarkan BL Number, Consignee, atau Vessel
  - List diurutkan berdasarkan last updated (terbaru di atas)

### 10.6 View Shipment Detail

- **ID**: SPM-006
- **Description**: Sebagai user, saya ingin melihat detail lengkap sebuah shipment agar bisa mengetahui semua informasi terkait.
- **Acceptance Criteria**:
  - User dapat klik shipment dari list untuk melihat detail
  - Halaman detail menampilkan semua data shipment
  - Halaman detail menampilkan status timeline dengan history
  - Halaman detail menampilkan daftar dokumen pendukung
  - Halaman detail menampilkan daftar nomor WA notifikasi

### 10.7 Update Status Shipment

- **ID**: SPM-007
- **Description**: Sebagai user, saya ingin mengubah status shipment agar pihak terkait mengetahui progress terkini.
- **Acceptance Criteria**:
  - User dapat mengubah status dari halaman detail
  - User dapat memilih status baru dari dropdown
  - Sistem mencatat timestamp perubahan status
  - Status history diupdate dengan entry baru
  - Notifikasi WhatsApp terkirim ke semua nomor yang terdaftar
  - UI menampilkan konfirmasi status berhasil diubah

### 10.8 Upload Dokumen Pendukung

- **ID**: SPM-008
- **Description**: Sebagai user, saya ingin upload dokumen pendukung (invoice, packing list, dll) agar semua dokumen tersimpan dalam satu tempat.
- **Acceptance Criteria**:
  - User dapat upload dokumen dari halaman detail shipment
  - User dapat memilih kategori dokumen (Invoice, Packing List, COO, MSDS, Lainnya)
  - Sistem menerima format PDF, JPG, PNG
  - Sistem menampilkan progress upload
  - Dokumen yang diupload muncul di daftar dokumen shipment
  - User dapat preview dokumen yang sudah diupload

### 10.9 Download/Delete Dokumen

- **ID**: SPM-009
- **Description**: Sebagai user, saya ingin download atau menghapus dokumen yang sudah diupload.
- **Acceptance Criteria**:
  - User dapat klik download pada dokumen untuk mengunduh file
  - User dapat klik delete pada dokumen untuk menghapus
  - Sistem menampilkan konfirmasi sebelum delete
  - Dokumen yang dihapus tidak muncul lagi di daftar

### 10.10 Tambah Nomor WhatsApp Notifikasi

- **ID**: SPM-010
- **Description**: Sebagai user, saya ingin menambahkan nomor WhatsApp per shipment agar pihak terkait mendapat notifikasi otomatis saat status berubah.
- **Acceptance Criteria**:
  - User dapat menambah nomor WA dari halaman detail shipment
  - User harus input nomor WA dengan format valid (contoh: 628123456789)
  - User dapat memberikan label untuk nomor WA (contoh: "Consignee", "Trucking")
  - Nomor WA yang ditambahkan muncul di daftar notifikasi
  - User dapat menambahkan multiple nomor WA per shipment

### 10.11 Kelola Nomor WhatsApp Notifikasi

- **ID**: SPM-011
- **Description**: Sebagai user, saya ingin mengedit atau menghapus nomor WhatsApp dari daftar notifikasi.
- **Acceptance Criteria**:
  - User dapat mengedit label nomor WA
  - User dapat mengaktifkan/menonaktifkan notifikasi per nomor WA
  - User dapat menghapus nomor WA dari daftar
  - Perubahan tersimpan dan berlaku untuk notifikasi selanjutnya

### 10.12 Terima Notifikasi WhatsApp

- **ID**: SPM-012
- **Description**: Sebagai penerima notifikasi, saya ingin menerima pesan WhatsApp otomatis saat status shipment berubah agar saya selalu update tanpa perlu bertanya.
- **Acceptance Criteria**:
  - Notifikasi terkirim dalam waktu < 1 menit setelah status diubah
  - Notifikasi berisi: BL Number, Status baru, Timestamp
  - Notifikasi untuk status "Approaching" berisi reminder BC 1.1
  - Notifikasi tidak terkirim jika nomor WA dinonaktifkan

### 10.13 Kustomisasi Workflow Status

- **ID**: SPM-013
- **Description**: Sebagai user, saya ingin menyesuaikan workflow status sesuai kebutuhan operasional saya karena setiap kantor punya proses berbeda.
- **Acceptance Criteria**:
  - User dapat mengakses pengaturan workflow dari Settings
  - User dapat menambah status baru dengan nama custom
  - User dapat mengatur urutan status dengan drag-and-drop
  - User dapat menonaktifkan status default yang tidak dipakai
  - User dapat reset ke workflow default
  - Custom workflow berlaku untuk semua shipment user tersebut

### 10.14 Edit Shipment

- **ID**: SPM-014
- **Description**: Sebagai user, saya ingin mengedit data shipment jika ada informasi yang berubah atau salah.
- **Acceptance Criteria**:
  - User dapat mengakses mode edit dari halaman detail
  - Semua field dapat diedit kecuali BL Number
  - Perubahan tersimpan setelah user klik Save
  - Sistem menampilkan konfirmasi perubahan berhasil

### 10.15 Delete Shipment

- **ID**: SPM-015
- **Description**: Sebagai user, saya ingin menghapus shipment yang sudah tidak relevan.
- **Acceptance Criteria**:
  - User dapat menghapus shipment dari halaman detail
  - Sistem menampilkan konfirmasi sebelum delete
  - Shipment yang dihapus tidak muncul lagi di dashboard
  - Dokumen terkait shipment juga terhapus

### 10.16 Reset Password

- **ID**: SPM-016
- **Description**: Sebagai user yang lupa password, saya ingin mereset password agar bisa mengakses akun kembali.
- **Acceptance Criteria**:
  - User dapat klik "Forgot Password" di halaman login
  - User memasukkan email terdaftar
  - Sistem mengirim email dengan link reset password
  - User dapat membuat password baru via link tersebut
  - Password baru aktif setelah disimpan

### 10.17 Edit Profile

- **ID**: SPM-017
- **Description**: Sebagai user, saya ingin mengedit profil saya (nama, nomor WA utama).
- **Acceptance Criteria**:
  - User dapat mengakses halaman Profile dari Settings
  - User dapat mengedit nama
  - User dapat mengedit nomor WhatsApp utama
  - Perubahan tersimpan setelah klik Save

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| BL (Bill of Lading) | Dokumen resmi dari shipping line yang menjadi bukti kontrak pengiriman barang |
| SPPB | Surat Persetujuan Pengeluaran Barang — dokumen dari Bea Cukai yang mengizinkan barang keluar dari pelabuhan |
| BC 1.1 | Pemberitahuan Impor Barang — dokumen yang harus disiapkan importir sebelum barang tiba |
| FCL | Full Container Load — satu container penuh untuk satu shipper |
| LCL | Less than Container Load — container dibagi untuk beberapa shipper |
| POL | Port of Loading — pelabuhan asal muat barang |
| POD | Port of Discharge — pelabuhan tujuan bongkar barang |
| PPJK | Pengusaha Pengurusan Jasa Kepabeanan — pihak yang mengurus dokumen kepabeanan |
| Consignee | Penerima barang yang tercantum di BL |
| Shipper | Pengirim barang yang tercantum di BL |

### B. Status Flow Diagram

```
Created → Sailing → Pre-arrive → Arrived → Clearing → Released → Delivered
```

### C. WhatsApp Notification Templates

**Status Update (General)**
```
[Sippment Update]
📦 Ref: {rf/No BL (fallback)}
📍 Status: {status}
🕐 Waktu: {timestamp}
```

**Status: Approaching**
```
[Sippment Update]
📦 Ref: {rf/No BL (fallback)}
📍 Status: Approaching
🕐 Waktu: {timestamp}

⚠️ Shipment menjelang tiba. Pastikan dokumen BC 1.1 sudah siap.
```

**Status: Released**
```
[Sippment Update]
📦 Ref: {rf/No BL (fallback)}
📍 Status: Released
🕐 Waktu: {timestamp}

✅ SPPB sudah terbit. Barang siap diambil dari pelabuhan.
```
