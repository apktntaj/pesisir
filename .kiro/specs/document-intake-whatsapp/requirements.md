# Requirements Document

## Introduction

Fitur **Document Intake via WhatsApp** memungkinkan staf PPJK mengirim dokumen kiriman (B/L, AWB, invoice, packing list, CIPL) langsung melalui WhatsApp. OpenClaw mengidentifikasi jenis dokumen, mengekstrak data terstruktur, dan membuat record operasional — SourceDocument, DocumentExtraction, CiplVersion, Shipment, dan CustomsJob — di API on-premise. Staf dapat mereview dan mengedit hasil di web UI tanpa perlu memasukkan data secara manual ke sistem.

Fitur ini menutup gap antara MCP tools yang sudah ada (hanya event management) dengan alur kerja PPJK inti: penerimaan dan pemrosesan dokumen pengiriman barang.

---

## Glossary

- **API**: `apps/api` — backend Hono + Drizzle + PostgreSQL, system of record on-premise.
- **MCP_Server**: `apps/mcp-server` — adapter MCP yang menghubungkan OpenClaw ke API via stdio.
- **OpenClaw**: Agen conversational yang berjalan di atas WhatsApp. Melakukan pemahaman dokumen dan memanggil MCP tools.
- **Web_UI**: `apps/project-management` — antarmuka web Next.js untuk review dan editing operasional.
- **SourceMessage**: Record pesan WhatsApp yang tersimpan di API, memuat referensi eksternal, konversasi, dan pengirim.
- **SourceDocument**: File attachment (PDF, Excel, gambar) yang disimpan on-premise di API dengan konten biner dan hash SHA-256.
- **DocumentExtraction**: Satu sesi ekstraksi terstruktur oleh OpenClaw terhadap satu SourceDocument, memuat kumpulan DocumentExtractionFacts.
- **DocumentExtractionFact**: Satu field hasil ekstraksi dengan nilai teraserta (`assertedValue`), status informasi, dan lokasi bukti.
- **InformationState**: Status epistemik suatu fakta: `SOURCE_BACKED | CONFIRMED | INFERRED | UNKNOWN | CONFLICTING | NOT_APPLICABLE`.
- **CIPL**: Commercial Invoice dan Packing List — dokumen utama deklarasi barang pameran.
- **CiplVersion**: Satu versi dokumen CIPL yang diterima, dapat berstatus `DRAFT` atau `READY`.
- **CiplItem**: Satu baris barang dalam satu CiplVersion.
- **Shipment**: Record transportasi barang yang dikaitkan ke CiplVersion, berupa B/L (jalur laut) atau AWB (jalur udara).
- **CustomsJob**: Pekerjaan kepabeanan formal (BC 2.3, BC 2.5, BC 3.0) yang dikaitkan ke Shipment, dengan lifecycle eksplisit.
- **ActorRef**: Referensi stabil pengirim, misalnya `whatsapp:+628123456789`. Bukan ID user database.
- **IdempotencyKey**: UUID unik per operasi yang dikonfirmasi, digunakan untuk mencegah duplikasi pada retry.
- **EventExhibitor**: Partisipasi peserta pameran di satu event; merupakan konteks yang diperlukan untuk membuat CIPL.

---

## Requirements

### Requirement 1: Pencatatan Pesan WhatsApp sebagai SourceMessage

**User Story:** Sebagai staf PPJK yang mengirim dokumen via WhatsApp, saya ingin setiap pesan yang relevan dicatat di sistem, agar ada jejak audit yang lengkap menghubungkan dokumen ke percakapan aslinya.

#### Acceptance Criteria

1. THE MCP_Server SHALL menyediakan tool `record_source_message` yang dapat dipanggil oleh OpenClaw untuk mencatat pesan WhatsApp ke API sebagai SourceMessage.
2. THE `record_source_message` tool SHALL menerima parameter: `channel` (nilai tetap `WHATSAPP`), `externalMessageId` (string, maks. 255 karakter), `conversationRef` (string, maks. 255 karakter), `senderRef` (string dalam format `whatsapp:+{E.164}`, maks. 30 karakter), `occurredAt` (ISO 8601 dengan timezone), `bodyText` (opsional, maks. 4096 karakter), serta `actorRef` dan `idempotencyKey`.
3. IF `record_source_message` dipanggil dengan kombinasi `channel` dan `externalMessageId` yang sudah pernah dicatat di API, THEN THE API SHALL mengembalikan respons idempoten dengan data SourceMessage yang sudah ada tanpa membuat record baru, dan THE MCP_Server SHALL meneruskan `id` SourceMessage tersebut ke OpenClaw.
4. THE MCP_Server SHALL mengembalikan `id` SourceMessage yang berhasil disimpan oleh API sehingga OpenClaw dapat mengaitkannya ke SourceDocument berikutnya.
5. IF salah satu field wajib (`channel`, `externalMessageId`, `conversationRef`, `senderRef`, `occurredAt`) tidak ada, kosong, atau `occurredAt` tidak dalam format ISO 8601 yang valid, THEN THE API SHALL mengembalikan error `VALIDATION_ERROR` dengan penjelasan yang menyebutkan field mana yang gagal validasi.
6. IF panggilan ke API gagal dengan error server (HTTP 5xx atau timeout setelah 10 detik), THEN THE MCP_Server SHALL mengembalikan error kepada OpenClaw dengan pesan yang mengindikasikan kegagalan penyimpanan, tanpa menyimpan record parsial.

---

### Requirement 2: Penyimpanan Dokumen sebagai SourceDocument

**User Story:** Sebagai staf PPJK, saya ingin file yang saya kirim via WhatsApp disimpan secara on-premise dengan konten biner utuh, agar dokumen asli selalu tersedia untuk audit dan verifikasi ulang.

#### Acceptance Criteria

1. WHEN OpenClaw menerima lampiran dari WhatsApp, THE MCP_Server SHALL menyediakan tool `upload_source_document` untuk mengunggah file ke API sebagai SourceDocument.
2. THE `upload_source_document` tool SHALL menerima parameter: `sourceMessageId` (UUID SourceMessage yang sudah dicatat), `fileName` (string, maks. 255 karakter), `mimeType`, `receivedAt` (RFC 3339 dengan timezone offset), `contentBase64` (konten file dikodekan base64), serta `actorRef` dan `idempotencyKey`.
3. THE API SHALL menerima tipe MIME berikut untuk SourceDocument: `application/pdf`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/csv`, `image/jpeg`, `image/png`.
4. IF ukuran file kurang dari 1 byte atau melebihi 20 MiB setelah decode base64, THEN THE API SHALL mengembalikan error `INVALID_DOCUMENT_SIZE`.
5. WHEN SourceDocument berhasil disimpan, THE API SHALL menghitung dan menyimpan hash SHA-256 dari konten file sebagai string hex 64 karakter lowercase untuk verifikasi integritas.
6. WHEN `upload_source_document` berhasil dipanggil, THE MCP_Server SHALL mengembalikan `id` SourceDocument yang tersimpan sehingga OpenClaw dapat mengaitkannya ke DocumentExtraction.
7. IF `sourceMessageId` yang diberikan tidak merujuk ke SourceMessage yang ada di API, THEN THE API SHALL mengembalikan error `SOURCE_MESSAGE_NOT_FOUND` sebelum menyimpan SourceDocument.

---

### Requirement 3: Identifikasi Jenis Dokumen oleh OpenClaw

**User Story:** Sebagai staf PPJK, saya ingin agen secara otomatis mengenali apakah dokumen yang saya kirim adalah B/L, AWB, CIPL, invoice, atau packing list, agar saya tidak perlu menyatakan jenis dokumen secara eksplisit setiap kali.

#### Acceptance Criteria

1. THE OpenClaw SHALL memiliki skill `document-intake` yang mendefinisikan protokol identifikasi jenis dokumen untuk tipe: `CIPL`, `BL` (Bill of Lading), `AWB` (Air Waybill), `INVOICE`, `PACKING_LIST`, dan `UNKNOWN` (tidak dapat diidentifikasi).
2. WHEN OpenClaw menerima lampiran, THE `document-intake` skill SHALL menginstruksikan OpenClaw untuk mengidentifikasi jenis dokumen dengan tingkat kepercayaan (`high`, `medium`, `low`) sebelum memulai ekstraksi data.
3. IF tingkat kepercayaan identifikasi adalah `medium` atau `low`, THEN THE `document-intake` skill SHALL menginstruksikan OpenClaw untuk meminta klarifikasi kepada staf dengan menyebutkan jenis dokumen yang paling mungkin, bukan langsung menggunakan tebakan tersebut.
4. WHEN jenis dokumen berhasil diidentifikasi dengan kepercayaan `high`, THE `document-intake` skill SHALL menginstruksikan OpenClaw untuk menampilkan ringkasan kepada staf yang memuat: jenis dokumen, nama file, dan EventExhibitor yang relevan (nama + id) sebelum melanjutkan ke ekstraksi.
5. THE `document-intake` skill SHALL menginstruksikan OpenClaw untuk menghubungkan dokumen ke EventExhibitor yang tepat dengan cara: pertama mencari berdasarkan nama peserta dari isi dokumen menggunakan tool `list_event_exhibitors`, kedua meminta konfirmasi eksplisit dari staf jika ada lebih dari satu kandidat atau tidak ada yang cocok.
6. IF lampiran tidak dapat dibaca atau diproses oleh OpenClaw (misal file rusak atau format tidak didukung), THEN THE `document-intake` skill SHALL menginstruksikan OpenClaw untuk memberitahu staf bahwa dokumen tidak dapat diproses dan meminta pengiriman ulang, tanpa memanggil tool penyimpanan apapun.

---

### Requirement 4: Ekstraksi Terstruktur dan Penyimpanan DocumentExtraction

**User Story:** Sebagai staf PPJK, saya ingin data yang diekstrak dari dokumen tersimpan dengan status kepercayaan yang jelas (SOURCE_BACKED, INFERRED, UNKNOWN, dll), agar saya tahu mana yang perlu dikonfirmasi dan mana yang sudah pasti.

#### Acceptance Criteria

1. THE MCP_Server SHALL menyediakan tool `submit_document_extraction` untuk menyimpan hasil ekstraksi OpenClaw ke API sebagai DocumentExtraction beserta DocumentExtractionFacts-nya, dengan parameter wajib `sourceDocumentId` (UUID).
2. THE `submit_document_extraction` tool SHALL menerima parameter: `sourceDocumentId` (UUID), array `facts` (minimal satu elemen), serta `actorRef`, `sourceMessageId` (opsional), dan `idempotencyKey`.
3. THE setiap elemen `facts` SHALL memuat: `field` (nama field, non-kosong), `informationState` (salah satu dari `SOURCE_BACKED | CONFIRMED | INFERRED | UNKNOWN | CONFLICTING | NOT_APPLICABLE`), `assertedValue` (opsional, JSON), `confidencePercent` (opsional, integer 0–100), `conflictExplanation` (wajib jika `informationState` adalah `CONFLICTING`), `evidenceLocators` (array string, tiap elemen adalah string tidak kosong yang mengidentifikasi lokasi dalam dokumen sumber, misal nomor halaman atau kutipan teks, boleh kosong).
4. IF `informationState` adalah `CONFLICTING` dan `conflictExplanation` tidak disertakan, THEN THE API SHALL mengembalikan error `VALIDATION_ERROR` dan menolak seluruh submission.
5. THE API SHALL menyimpan semua facts dalam satu transaksi atomik bersama record DocumentExtraction induknya; jika validasi salah satu fact gagal, seluruh submission ditolak dan tidak ada record yang tersimpan.
6. WHEN `submit_document_extraction` berhasil, THE API SHALL mengembalikan `id` DocumentExtraction beserta daftar lengkap facts yang tersimpan.
7. THE `document-intake` skill SHALL menginstruksikan OpenClaw untuk tidak menginvent nilai pada field yang tidak ditemukan dalam dokumen — gunakan `informationState: UNKNOWN` dengan `assertedValue: null` untuk field yang tidak ada.
8. IF `sourceDocumentId` tidak merujuk ke SourceDocument yang ada, THEN THE API SHALL mengembalikan error `SOURCE_DOCUMENT_NOT_FOUND` dan menolak seluruh submission.

---

### Requirement 5: Pembuatan CiplVersion dari Dokumen CIPL

**User Story:** Sebagai staf PPJK, saya ingin CIPL yang diterima via WhatsApp langsung membuat record CiplVersion beserta item-itemnya di sistem, agar data barang tidak perlu diinput ulang secara manual.

#### Acceptance Criteria

1. THE MCP_Server SHALL menyediakan tool `create_cipl` untuk membuat CIPL baru dengan CiplVersion pertama (status `DRAFT`) dari dokumen yang sudah diunggah.
2. THE `create_cipl` tool SHALL menerima parameter: `eventExhibitorId` (UUID EventExhibitor aktif), `sourceDocumentId` (UUID SourceDocument), `receivedAt` (RFC 3339 dengan timezone offset), `referenceNumber` (opsional), `revisionNote` (opsional), `items` (array minimal satu elemen), serta `actorRef`, `sourceMessageId` (opsional), dan `idempotencyKey`.
3. THE setiap elemen `items` SHALL memuat minimal: `lineNumber` (integer positif unik dalam satu versi; duplikasi menghasilkan error `VALIDATION_ERROR`), `description` (non-kosong), `quantity` (desimal positif > 0), `unit` (non-kosong). Field opsional: `unitValue` (desimal ≥ 0), `currency`, `grossWeightKg` (desimal ≥ 0), `netWeightKg` (desimal ≥ 0), `countryOfOrigin`, `identifiers`, `intendedUse`, `intendedDisposal`.
4. IF `eventExhibitorId` merujuk ke EventExhibitor yang tidak ditemukan atau berstatus `WITHDRAWN`, THEN THE API SHALL mengembalikan error `INACTIVE_EVENT_EXHIBITOR`.
5. THE MCP_Server SHALL menyediakan tool `mark_cipl_version_ready` yang menerima `ciplVersionId` (UUID CiplVersion berstatus `DRAFT`) untuk mengubah status CiplVersion ke `READY` setelah staf mengkonfirmasi kebenaran data.
6. WHEN CiplVersion di-mark `READY`, THE API SHALL secara atomik memperbarui `activeVersionId` pada CIPL induk ke `ciplVersionId` tersebut dan mengubah status CIPL induk ke `READY`.
7. THE MCP_Server SHALL menyediakan tool `list_cipls` dengan parameter `eventExhibitorId` (UUID) untuk mendaftarkan CIPL pada satu EventExhibitor, mengembalikan `id`, `referenceNumber`, `status`, dan `activeVersionId`.
8. IF `mark_cipl_version_ready` dipanggil pada CiplVersion yang sudah berstatus `READY`, THEN THE API SHALL mengembalikan error `CIPL_VERSION_ALREADY_READY`.

---

### Requirement 6: Pembuatan Shipment dari Dokumen B/L atau AWB

**User Story:** Sebagai staf PPJK, saya ingin B/L atau AWB yang dikirim via WhatsApp membuat record Shipment di sistem yang sudah terhubung ke CIPL yang relevan, agar saya tidak perlu menginput ulang data transportasi.

#### Acceptance Criteria

1. THE MCP_Server SHALL menyediakan tool `create_shipment` untuk membuat Shipment baru yang terhubung ke CiplVersion berstatus `READY`.
2. THE `create_shipment` tool SHALL menerima parameter: `ciplVersionId` (UUID CiplVersion READY), `sourceDocumentId` (UUID SourceDocument B/L atau AWB), `documentType` (`BL` atau `AWB`), `documentNumber` (non-kosong), `direction` (`IMPORT` atau `EXPORT`), `allocations` (array minimal satu elemen), serta field opsional: `shipmentMode` (`FCL` atau `LCL`), `shipper`, `consignee`, `notifyParty`, `carrier`, `etaOrEtd` (RFC 3339 dengan timezone), `origin`, `destination`; serta `actorRef`, `sourceMessageId` (opsional), dan `idempotencyKey`.
3. THE setiap elemen `allocations` SHALL memuat: `ciplItemId` (UUID CiplItem dari CiplVersion yang sama), `quantity` (desimal positif > 0), `unit` (harus sama persis dengan unit CiplItem; mismatch menghasilkan error `UNIT_MISMATCH`).
4. IF total alokasi quantity untuk satu CiplItem di seluruh Shipment melebihi quantity yang tertera di CiplItem, THEN THE API SHALL mengembalikan error `CIPL_ALLOCATION_EXCEEDED` dengan detail CiplItem yang melebihi batas.
5. IF `ciplVersionId` merujuk ke CiplVersion yang berstatus `DRAFT`, THEN THE API SHALL mengembalikan error `CIPL_VERSION_NOT_READY`.
6. THE MCP_Server SHALL menyediakan tool `list_shipments` dengan parameter wajib `ciplVersionId` untuk mendaftarkan Shipment, mengembalikan `id`, `documentType`, `documentNumber`, `status`, dan `direction`.
7. THE MCP_Server SHALL menyediakan tool `get_shipment` dengan parameter `id` (UUID) untuk mengambil detail satu Shipment beserta semua `allocations` (masing-masing memuat `ciplItemId`, `quantity`, `unit`).

---

### Requirement 7: Pembuatan CustomsJob dari Shipment

**User Story:** Sebagai staf PPJK, saya ingin CustomsJob (BC 2.3, BC 2.5, atau BC 3.0) dibuat secara otomatis atau atas instruksi saya setelah Shipment siap, agar persiapan dokumen kepabeanan dapat segera dimulai.

#### Acceptance Criteria

1. THE MCP_Server SHALL menyediakan tool `create_customs_job` untuk membuat CustomsJob baru (status awal `DRAFT`) yang terhubung ke Shipment yang ada.
2. THE `create_customs_job` tool SHALL menerima parameter: `shipmentId` (UUID Shipment), `documentType` (`BC_2_3`, `BC_2_5`, atau `BC_3_0`), `allocations` (array minimal satu elemen), `notes` (opsional), serta `actorRef`, `sourceMessageId` (opsional), dan `idempotencyKey`.
3. THE setiap elemen `allocations` pada `create_customs_job` SHALL memuat: `shipmentAllocationId` (UUID ShipmentAllocation dari Shipment yang sama), `quantity` (desimal positif > 0), `unit` (harus sama persis dengan unit ShipmentAllocation).
4. IF total alokasi quantity untuk satu ShipmentAllocation melebihi sisa quantity yang belum teralokasi ke CustomsJob lain (non-CANCELLED), THEN THE API SHALL mengembalikan error `ALLOCATION_EXCEEDED` dengan detail ShipmentAllocation yang melebihi batas.
5. THE MCP_Server SHALL menyediakan tool `list_customs_jobs` dengan parameter wajib `shipmentId` untuk mendaftarkan CustomsJob, mengembalikan `id`, `documentType`, `status`, dan `notes`.
6. THE MCP_Server SHALL menyediakan tool `get_customs_job` dengan parameter `id` (UUID) untuk mengambil detail satu CustomsJob beserta `allocations` dan riwayat `transitions` berurutan berdasarkan `occurredAt` ascending.
7. THE `document-intake` skill SHALL menginstruksikan OpenClaw untuk meminta konfirmasi eksplisit jenis dokumen kepabeanan (`BC_2_3`, `BC_2_5`, `BC_3_0`) dari staf sebelum memanggil `create_customs_job`.

---

### Requirement 8: Transisi Lifecycle CustomsJob via MCP

**User Story:** Sebagai staf PPJK, saya ingin dapat memajukan atau menahan status CustomsJob melalui WhatsApp, agar saya tidak perlu selalu membuka web UI untuk update status pekerjaan.

#### Acceptance Criteria

1. THE MCP_Server SHALL menyediakan tool `transition_customs_job` untuk memindahkan CustomsJob ke status berikutnya dalam lifecycle: `DRAFT → PREPARING → SUBMITTED → REGISTERED → RELEASED → COMPLETED`, serta ke `ON_HOLD` atau `CANCELLED` dari status manapun kecuali `COMPLETED` dan `CANCELLED`.
2. THE `transition_customs_job` tool SHALL menerima parameter: `id` (UUID CustomsJob), `toStatus` (salah satu status di atas), `reason` (string non-kosong, wajib jika `toStatus` adalah `ON_HOLD` atau `CANCELLED`), `evidenceSourceDocumentId` (UUID SourceDocument, opsional), serta `actorRef`, `sourceMessageId` (opsional), dan `idempotencyKey`.
3. IF `toStatus` bukan langkah berikutnya yang valid dalam lifecycle normal dan bukan `ON_HOLD` atau `CANCELLED`, THEN THE API SHALL mengembalikan error `INVALID_TRANSITION` dengan menyebutkan status saat ini dan status yang diperbolehkan.
4. IF CustomsJob berada dalam status `COMPLETED` atau `CANCELLED`, THEN THE API SHALL menolak semua permintaan transisi dengan error `INVALID_TRANSITION`.
5. THE MCP_Server SHALL menyediakan tool `resume_customs_job` untuk mengembalikan CustomsJob dari status `ON_HOLD` ke `PREPARING`, dengan parameter wajib: `id`, `reason` (string non-kosong), `evidenceSourceDocumentId` (UUID SourceDocument, wajib), serta `actorRef`, `sourceMessageId` (opsional), dan `idempotencyKey`.
6. THE `document-intake` skill SHALL menginstruksikan OpenClaw untuk meminta alasan eksplisit dari staf dan menampilkan ringkasan perubahan sebelum memanggil `transition_customs_job` dengan `toStatus` `ON_HOLD` atau `CANCELLED`.

---

### Requirement 9: Review Dokumen Ekstraksi oleh Staf via MCP

**User Story:** Sebagai staf PPJK, saya ingin mengkonfirmasi atau mengoreksi hasil ekstraksi dokumen melalui WhatsApp, agar data yang masuk ke sistem kepabeanan sudah diverifikasi manusia.

#### Acceptance Criteria

1. THE MCP_Server SHALL menyediakan tool `list_extraction_facts` dengan parameter `extractionId` (UUID DocumentExtraction) untuk menampilkan semua DocumentExtractionFacts dari satu DocumentExtraction, termasuk `id`, `field`, `informationState`, `assertedValue`, `confidencePercent`, dan `evidenceLocators`.
2. WHEN `review_extraction_fact` berhasil dipanggil, THE MCP_Server SHALL mengembalikan `id` DocumentExtractionFactReview yang tersimpan beserta `resultingState` dan `resultingValue` yang dikonfirmasi.
3. THE `review_extraction_fact` tool SHALL menerima parameter: `extractionFactId` (UUID), `kind` (`CONFIRM` atau `CORRECT`), `resultingState` (harus salah satu InformationState; untuk `CONFIRM` harus sama dengan `informationState` asal), `resultingValue` (wajib jika `kind` adalah `CORRECT`, boleh `null` untuk koreksi eksplisit ke nilai kosong), `reason` (non-kosong), `evidenceLocators` (array string, boleh kosong), serta `actorRef`, `sourceMessageId` (opsional), dan `idempotencyKey`.
4. WHEN OpenClaw selesai memproses DocumentExtraction, THE `document-intake` skill SHALL menginstruksikan OpenClaw untuk menyajikan secara proaktif semua facts dengan `informationState` `UNKNOWN` atau `CONFLICTING` kepada staf, dengan format ringkas per item: nama field, nilai saat ini, status, dan konflik (jika ada).
5. IF `kind` adalah `CORRECT` dan `resultingValue` tidak disertakan dalam input, THEN THE API SHALL mengembalikan error `VALIDATION_ERROR`.
6. IF `review_extraction_fact` dipanggil pada `extractionFactId` yang sudah memiliki review dengan `kind: CONFIRM` sebelumnya, THEN THE API SHALL tetap menerima review baru sebagai koreksi lanjutan dan mencatatnya sebagai DocumentExtractionFactReview tambahan.

---

### Requirement 10: Halaman Review Shipment di Web UI

**User Story:** Sebagai staf atau supervisor PPJK, saya ingin melihat daftar dan detail Shipment di web UI yang datanya bersumber dari API (bukan IndexedDB), agar informasi yang tampil selalu sinkron dengan data yang diinput melalui WhatsApp.

#### Acceptance Criteria

1. THE Web_UI SHALL menyediakan halaman daftar Shipment yang mengambil data dari API endpoint `GET /api/v1/shipments` dengan parameter opsional `ciplVersionId`, menampilkan minimal: `documentType`, `documentNumber`, `status`, dan `direction` untuk setiap Shipment.
2. THE Web_UI SHALL menyediakan halaman detail Shipment yang mengambil data dari API endpoint `GET /api/v1/shipments/:id`, menampilkan: `documentType`, `documentNumber`, `status`, `direction`, `shipper`, `consignee`, `carrier`, `etaOrEtd`, `origin`, `destination`, dan tabel `allocations` (masing-masing menampilkan `quantity` dan `unit`).
3. THE Web_UI SHALL mengambil data Shipment hanya melalui `@/lib/data-client` — tidak boleh mengimpor storage adapter secara langsung dari komponen `app/` atau `components/`.
4. WHEN data Shipment gagal diambil dari API (error jaringan atau HTTP ≥ 400), THE Web_UI SHALL menampilkan pesan error yang informatif di dalam halaman tanpa mematikan atau me-redirect seluruh halaman.
5. THE Web_UI SHALL menampilkan status Shipment dengan label Bahasa Indonesia: `DRAFT` → "Draf", `DOCUMENT_RECEIVED` → "Dokumen Diterima", `UNDER_REVIEW` → "Sedang Ditinjau", `READY_FOR_CUSTOMS` → "Siap Pabean", `ON_HOLD` → "Ditahan", `CANCELLED` → "Dibatalkan".

---

### Requirement 11: Halaman Review CustomsJob di Web UI

**User Story:** Sebagai staf atau supervisor PPJK, saya ingin melihat daftar dan detail CustomsJob di web UI beserta riwayat transisi statusnya, agar saya dapat memantau progres pekerjaan kepabeanan tanpa bergantung pada percakapan WhatsApp.

#### Acceptance Criteria

1. THE Web_UI SHALL menyediakan halaman daftar CustomsJob yang mengambil data dari API endpoint `GET /api/v1/customs-jobs` dengan parameter opsional `shipmentId`, menampilkan minimal: `documentType`, `status`, dan `notes` untuk setiap CustomsJob.
2. THE Web_UI SHALL menyediakan halaman detail CustomsJob yang mengambil data dari API endpoint `GET /api/v1/customs-jobs/:id`, menampilkan: `documentType`, `status`, `notes`, tabel `allocations`, dan daftar `transitions` berurutan berdasarkan `occurredAt` ascending.
3. THE Web_UI SHALL menampilkan riwayat transisi CustomsJob dalam format timeline yang memuat per entri: status asal, status tujuan, alasan (atau "–" jika tidak ada), `actorRef`, dan waktu `occurredAt`.
4. THE Web_UI SHALL mengambil data CustomsJob hanya melalui `@/lib/data-client`.
5. WHEN CustomsJob berada dalam status `ON_HOLD`, THE Web_UI SHALL menampilkan badge berwarna kuning atau oranye dengan label "Ditahan" baik di daftar maupun di header halaman detail, sehingga mudah teridentifikasi.
6. WHEN halaman detail CustomsJob gagal memuat data (404 atau error jaringan), THE Web_UI SHALL menampilkan pesan error yang deskriptif di dalam halaman tanpa mematikan atau me-redirect seluruh halaman.
7. THE Web_UI SHALL menampilkan setiap alokasi CustomsJob dengan `quantity` dan `unit` yang terbaca di tabel alokasi pada halaman detail.

---

### Requirement 12: Integritas Audit Trail dan Idempotency

**User Story:** Sebagai administrator sistem PPJK, saya ingin setiap aksi yang dilakukan OpenClaw tercatat dalam audit log dengan actorRef dan idempotencyKey, agar operasi aman untuk di-retry dan setiap perubahan data dapat dipertanggungjawabkan.

#### Acceptance Criteria

1. WHEN THE API menerima operasi tulis yang berhasil (record_source_message, upload_source_document, submit_document_extraction, create_cipl, create_shipment, create_customs_job, transition_customs_job, review_extraction_fact), THE API SHALL mencatat satu baris ke tabel `audit_events` yang memuat `entity_type`, `entity_id`, `action`, `before_data`, `after_data`, `actor_ref`, `source_message_id`, dan `idempotency_key` secara atomik dalam transaksi database yang sama dengan operasi tulis tersebut.
2. WHEN THE API menerima operasi tulis yang berhasil, THE API SHALL menyimpan satu baris ke tabel `idempotency_records` yang memuat method HTTP, path, hash request body, HTTP status response, dan response body secara atomik dalam transaksi yang sama, sehingga permintaan ulang dengan `Idempotency-Key` yang identik mengembalikan HTTP status dan body yang tersimpan tanpa mengeksekusi operasi atau menulis baris baru.
3. THE MCP_Server SHALL menyertakan field `actorRef` (string tidak kosong yang merepresentasikan pengirim secara stabil, misalnya `whatsapp:+628xxx`), `idempotencyKey` (UUID v4, unik per operasi yang dikonfirmasi; gunakan kembali nilai yang sama saat retry), dan `sourceMessageId` (string ID pesan asal, opsional) dalam input schema setiap write tool.
4. IF `Idempotency-Key` yang sama dikirim dengan kombinasi method, path, atau hash request body yang berbeda, THEN THE API SHALL mengembalikan HTTP 409 dengan kode error `IDEMPOTENCY_CONFLICT` tanpa mengeksekusi operasi.
5. THE API SHALL menolak setiap request tulis yang tidak menyertakan header `X-Actor-Ref` (string tidak kosong) dengan HTTP 400 dan kode error `ACTOR_REQUIRED`, atau tidak menyertakan `Idempotency-Key` (UUID dengan panjang minimal 8 karakter) dengan HTTP 400 dan kode error `IDEMPOTENCY_KEY_REQUIRED`.
6. THE MCP_Server SHALL mengoper nilai `actorRef` ke header `X-Actor-Ref`, `idempotencyKey` ke header `Idempotency-Key`, dan `sourceMessageId` (jika ada) ke header `X-Source-Message-Id` pada setiap HTTP request tulis ke API.

---

### Requirement 13: Keamanan dan Batasan Arsitektur

**User Story:** Sebagai pengelola infrastruktur PPJK, saya ingin memastikan bahwa tidak ada data dokumen atau ekstraksi yang dikirim ke layanan cloud eksternal, agar kerahasiaan data kepabeanan pelanggan tetap terjaga.

#### Acceptance Criteria

1. THE API SHALL menerima hasil ekstraksi dokumen sebagai data terstruktur dari OpenClaw — API tidak boleh melakukan ekstraksi dokumen sendiri menggunakan layanan AI cloud (Gemini, OpenAI, dsb.) maupun memiliki dependency pada library tersebut di `package.json`.
2. THE API SHALL menyimpan seluruh konten SourceDocument sebagai kolom `bytea` di database PostgreSQL on-premise — tidak boleh mengunggah, merujuk, atau meneruskan konten dokumen ke layanan penyimpanan eksternal manapun.
3. THE MCP_Server SHALL berkomunikasi dengan API hanya melalui HTTP ke URL yang dikonfigurasi via environment variable `VSS_API_BASE_URL` — tidak ada koneksi langsung ke database PostgreSQL dari MCP_Server.
4. WHILE `apps/project-management` beroperasi, THE Web_UI SHALL mengakses data operasional hanya melalui API HTTP (`apps/api`) — tidak melalui koneksi langsung ke database PostgreSQL, dan tidak melalui IndexedDB untuk data yang sudah dimigrasikan ke API.
5. THE `document-intake` skill SHALL mendefinisikan dengan eksplisit bahwa ekstraksi dan interpretasi isi dokumen dilakukan oleh OpenClaw, bukan oleh API atau Web UI, dan bahwa API hanya menyimpan hasil ekstraksi yang dikirimkan oleh OpenClaw.
