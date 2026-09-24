# Deep Research: Peluang Agentic App pada Industri PPJK Indonesia

**Audiens:** pemimpin bisnis, produk, dan teknologi yang sedang menilai peluang aplikasi vertikal untuk PPJK  
**Tanggal:** 25 Agustus 2026  
**Geografi:** Indonesia  
**Fokus:** pengurusan impor/ekspor oleh Pengusaha Pengurusan Jasa Kepabeanan (PPJK), terutama impor untuk dipakai  

## Ruang lingkup dan asumsi

Laporan ini menilai di mana pola agentic app—aplikasi yang dapat mengamati keadaan, menyusun langkah, memakai beberapa tool/sistem, mempertahankan state pekerjaan, dan mengeskalasi pengecualian—lebih berguna daripada chatbot, OCR, atau RPA biasa. Analisis mengutamakan sumber primer pemerintah, regulator, dan organisasi kepabeanan. Freight forwarding, trucking, dan warehousing dibahas hanya sejauh bersinggungan dengan pengurusan pabean.

Tidak ditemukan statistik publik mutakhir yang andal tentang jumlah PPJK aktif, pendapatan industri, distribusi volume per perusahaan, atau baseline waktu/error operasional PPJK. Karena itu, laporan tidak mengarang TAM atau ROI nominal. Nilai perdagangan digunakan hanya sebagai indikator skala arus barang, bukan ukuran pendapatan PPJK.

## Jawaban eksekutif

Agentic app sangat relevan untuk PPJK, tetapi bentuk terbaiknya bukan "broker kepabeanan otonom". Produk yang paling masuk akal adalah **Clearance Operations Agent**: lapisan orkestrasi yang menyiapkan dossier shipment, memeriksa konsistensi dokumen, mengambil aturan bertanggal, memantau CEISA/INSW/NLE, menangani exception berdasarkan SOP, dan mengarahkan keputusan berisiko kepada Ahli Kepabeanan atau pengguna berwenang.

Wedge produk terbaik adalah **Pre-clearance Readiness Agent**. Ia memberi nilai cepat dengan risiko hukum lebih rendah: membaca invoice/packing list/B/L atau AWB/COO/perizinan, menyandingkan field, meminta dokumen yang hilang, membuat draft shipment record, dan menghasilkan checklist siap proses. Tambahkan regulatory-change sentinel dan status/exception monitoring dalam mode read-only. Setelah data dan evaluasi matang, perluas ke rekomendasi HS/lartas dan draft PIB/PEB—tetap dengan persetujuan manusia sebelum keputusan klasifikasi atau submit.

Alasan utamanya:

1. PPJK beroperasi di persimpangan dokumen tidak terstruktur, aturan yang berubah, beberapa sistem, deadline, dan exception—kondisi yang cocok untuk agent, bukan sekadar form automation.
2. Digital rail sudah ada. CEISA 4.0 memiliki Open API/H2H untuk dokumen, status, lartas, kurs, manifes, dan tarif; NLE/INSW memang dirancang untuk pertukaran data dan penghapusan duplikasi.
3. Risikonya nyata. PPJK wajib memiliki Ahli Kepabeanan, dapat diblokir bila kewajiban tidak dipenuhi, dan dapat menanggung pungutan bila pemberi kuasa tidak ditemukan. Kredensial dan keputusan final tidak boleh diserahkan ke agent tanpa kontrol.
4. Peraturan berubah cepat. Aturan impor dan daftar lartas berubah lagi pada Juni–Juli 2026; rule engine harus bertanggal dan bersumber, bukan mengandalkan ingatan model.

## 1. Bentuk industri dan proses kerja

Secara hukum, PPJK adalah badan usaha yang memenuhi kewajiban pabean untuk dan atas kuasa importir atau eksportir. Registrasi PPJK memerlukan NIB, NPWP/status wajib pajak valid, dan pegawai berkualifikasi Ahli Kepabeanan; satu Ahli Kepabeanan hanya dapat dipakai sebagai persyaratan satu PPJK. Perjanjian komersial dengan klien tidak menghapus tanggung jawab PPJK ketika importir/eksportir pemberi kuasa tidak ditemukan. [PMK 219/PMK.04/2019](https://jdih.kemenkeu.go.id/api/download/FullText/2019/219~PMK.04~2019Per.pdf)

Untuk impor dipakai, PIB dibuat dari dokumen pelengkap seperti invoice, packing list, B/L atau AWB, identifikasi barang, dan dokumen pemenuhan persyaratan impor. Importir melakukan self-assessment bea masuk, cukai, dan pajak dalam rangka impor; barang lartas harus memenuhi ketentuan sebelum keluar. Pemeriksaan dilakukan selektif melalui jalur hijau/merah. [PMK 190/PMK.04/2022](https://jdih.kemenkeu.go.id/download/9796f4b5-4e17-4a02-ba12-e9036c07761e/190~PMK.04~2022.pdf), [penjelasan DJBC tentang impor untuk dipakai](https://www.beacukai.go.id/impor-untuk-dipakai)

Alur kerja sederhananya:

```text
Dokumen klien & carrier
        ↓
Intake → identifikasi barang → HS/tarif/origin → lartas/perizinan
        ↓                         ↓
  rekonsiliasi data         keputusan ahli
        ↓                         ↓
draft PIB/PEB → validasi → persetujuan manusia → CEISA/INSW
        ↓
status, billing, jalur, pemeriksaan, exception → release
        ↓
arsip job, invoice, rekonsiliasi, audit trail
```

NLE memperluas konteks dari kedatangan sarana pengangkut sampai barang tiba di gudang, dengan integrasi layanan pemerintah dan swasta, DO, SP2, trucking, karantina, dan perizinan. [NLE overview](https://nle.insw.go.id/overview), [produk dan layanan NLE](https://nle.insw.go.id/)

Skala arus barang besar: BPS melaporkan ekspor 2025 sekitar US$282,9 miliar dan impor sekitar US$241,9 miliar—sekitar US$524,8 miliar jika dijumlahkan. Ini bukan pendapatan PPJK, tetapi menunjukkan besarnya basis transaksi yang memerlukan data kepabeanan. [BPS, perkembangan ekspor dan impor Desember 2025](https://www.bps.go.id/id/pressrelease/2026/02/02/2537/perkembangan-ekspor-dan-impor.html)

Baseline nasional terakhir yang ditemukan dalam sumber pemerintah sudah tua: data 2019 yang dipublikasikan BPPK menyebut sekitar 1.600 PPJK aktif menangani 31.257 importir dan 1.057.084 PIB. Sebanyak 57.009 PIB atau 5,39% menerima SPTNP terkait koreksi tarif dan/atau nilai pabean. Angka ini tidak boleh diekstrapolasi ke 2026 atau dianggap sebagai error PPJK—koreksi dapat berasal dari data importir, perbedaan interpretasi, atau ketidakpatuhan—tetapi menunjukkan bahwa klasifikasi dan nilai pabean merupakan problem material. [Prosiding Kajian Akademis Pusdiklat Bea dan Cukai 2020](https://bppk.kemenkeu.go.id/res/filestream/files/portal-bppk-media/content/page/document/2020_Pusdiklat_BC_Prosiding_Kajian_Akademis_Ind.pdf)

## 2. Mengapa agentic, bukan chatbot atau RPA saja

Sebagian tugas PPJK deterministik: validasi format NPWP, perhitungan, mapping field, dan pembentukan payload API. Tugas itu sebaiknya tetap berupa rules engine atau software biasa. Agent berguna ketika pekerjaan memerlukan kombinasi berikut:

- mengambil fakta dari banyak dokumen dan sistem;
- menentukan langkah berikut berdasarkan state shipment;
- meminta klarifikasi spesifik kepada klien;
- mengambil regulasi/BTKI/lartas yang berlaku pada tanggal transaksi;
- mencoba SOP alternatif saat sistem atau respons bermasalah;
- memantau deadline dan exception secara kontinu;
- membuat draft, mencatat alasan, lalu mengeskalasi keputusan berisiko.

Hal ini konsisten dengan arah digital kepabeanan. CEISA 4.0 mengizinkan sistem eksternal terhubung untuk dokumen, status, lartas, kurs, manifes, dan tarif, dan menyebut manfaat pengurangan redundansi, kesalahan, serta pertukaran data real-time. [Developer Portal CEISA 4.0](https://openapi.beacukai.go.id/portal/), [penerapan Open API CEISA 4.0](https://onewebfile.beacukai.go.id/cdn/download/file/685a4669846e515ab1d90c72)

Dokumentasi business-continuity CEISA juga memperlihatkan exception nyata: dokumen dapat pending/reject, status portal dan modul perlu ditarik ulang, dan saat kondisi TIK tidak normal tersedia H2H, platform pihak ketiga, CEISA Lite, Excel, atau proses manual. Ini merupakan masalah orkestrasi berbasis state, bukan sekadar tanya-jawab. [Business Continuity Plan CEISA](https://bcp.beacukai.go.id/page.py), [FAQ penggunaan modul kepabeanan](https://www.beacukai.go.id/faq-impor-penggunaan-modul-kepabeanan)

## 3. Prioritas use case

Penilaian berikut adalah sintesis berbasis frekuensi proses, dampak kesalahan/keterlambatan, kesiapan data/integrasi, dan kemampuan membatasi risiko. Ia perlu divalidasi dengan data operasional calon pengguna.

| Prioritas | Use case | Apa yang dilakukan agent | Agentic fit | Nilai | Risiko |
|---|---|---|---|---|---|
| P0 | **Pre-clearance readiness & document dossier** | Mengambil dokumen dari kanal resmi, mengekstrak field, menyandingkan invoice–packing list–B/L/AWB–COO–izin, menemukan konflik/kekurangan, meminta klarifikasi, membuat shipment record dan checklist | Sangat tinggi | Sangat tinggi | Rendah–sedang |
| P0 | **Status & exception control tower** | Memantau respons CEISA/INSW/NLE/carrier/TPS, mengklasifikasikan pending/reject/billing/jalur, menjalankan runbook, membuat tugas, memberi ETA/status kepada tim dan klien, lalu eskalasi | Sangat tinggi | Sangat tinggi | Sedang |
| P0 | **Regulatory change impact sentinel** | Memantau JDIH/INSW, membuat diff aturan bertanggal, memetakan perubahan HS/tarif/lartas/izin ke SKU, klien, dan shipment mendatang, meminta review ahli | Sangat tinggi | Tinggi | Sedang |
| P1 | **HS–tarif–lartas–landed cost copilot** | Mengajukan pertanyaan atribut barang, memberi beberapa kandidat HS beserta alasan/sumber, mengambil tarif/lartas/origin/FTA, menghitung estimasi, dan menandai ketidakpastian | Tinggi | Sangat tinggi | Tinggi |
| P1 | **Customs-value dossier agent** | Menyandingkan invoice–PO–payment–freight–insurance–royalty/assists, menandai komponen CIF yang hilang, dan menyiapkan evidence pack untuk KNP/SPTNP | Tinggi | Tinggi | Tinggi |
| P1 | **PIB/PEB drafting & pre-submit validation** | Mengubah dossier tervalidasi menjadi draft deklarasi/payload, menjalankan validasi field dan business rule, menunjukkan lineage setiap nilai, dan menyiapkan approval | Tinggi | Sangat tinggi | Tinggi |
| P1 | **Post-entry audit & evidence agent** | Menyatukan declaration, dokumen sumber, billing, pembayaran, perubahan, korespondensi, dan log keputusan; mencari anomali serta membentuk audit pack | Tinggi | Tinggi | Sedang |
| P2 | **Permit/FTA optimization agent** | Memeriksa kebutuhan izin dan masa berlaku, eligibility tarif preferensi/COO, kuota serta deadline; menyusun paket permohonan atau renewal dan memonitor status | Tinggi | Tinggi | Tinggi |
| P2 | **Client communication, SLA & job-costing agent** | Membuat update status, reminder, ringkasan exception, rekonsiliasi disbursement, draft invoice, dan analisis margin job | Sedang | Sedang | Rendah–sedang |

### 3.1 Pre-clearance readiness: MVP terbaik

**Trigger:** email/upload/API untuk shipment baru atau dokumen tambahan.  
**Tindakan:** ekstraksi → normalisasi → rekonsiliasi → pertanyaan klarifikasi → checklist → shipment record → handoff ke ahli/operator.  
**Mengapa dahulu:** hampir semua proses hilir bergantung pada data ini; manfaat dapat diukur sebelum agent diberi hak submit; dan hasil koreksi ahli menghasilkan dataset terlabel untuk fitur HS/lartas berikutnya.  
**Batas:** agent tidak menebak fakta produk yang hilang dan tidak mengubah dokumen sumber.

### 3.2 Status & exception control tower

Agent membaca respons resmi, menghubungkannya dengan SOP internal dan state pekerjaan, lalu menentukan langkah berikut. Contoh: mendeteksi respons tidak sinkron, membuat tugas tarik ulang, meminta pemeriksaan dokumen, atau menyiapkan opsi BCP. Ia dapat mengirim update status templated sesuai kebijakan, tetapi cancellation, resubmit, atau perubahan declaration tetap memerlukan approval.

### 3.3 Regulatory change impact sentinel

Ini adalah use case yang sangat agentic karena perubahan harus ditemukan, dibandingkan, diinterpretasi, dan dipetakan ke portofolio aktif. Permendag 16/2025 telah diubah lagi oleh Permendag 18/2026; daftar barang dibatasi diperbarui melalui KMK 40/MK/BC/2026 efektif 4 Juli 2026; dan PMK 50/2026 mengubah klasifikasi/tarif efektif 28 Juli 2026. [Permendag 18/2026](https://peraturan.bpk.go.id/Details/351566/permendag-no-18-tahun-2026), [KMK 40/MK/BC/2026](https://jdih.kemenkeu.go.id/dok/40mkbc2026), [PMK 50/2026](https://jdih.kemenkeu.go.id/dok/pmk-50-tahun-2026)

Output wajib menyebut sumber, tanggal berlaku, versi rule, SKU/shipment yang terdampak, dan confidence. Model tidak boleh menjawab dari memorinya saja.

### 3.4 HS/lartas copilot: diferensiasi tinggi, bukan MVP pertama

BTKI menghubungkan klasifikasi dengan tarif, pajak, lartas, statistik, dan penegakan hukum. [DJBC, BTKI dan tarif](https://www.beacukai.go.id/btki-dan-tarif) WCO telah mengembangkan model yang merekomendasikan kandidat HS dari uraian barang, tetapi WCO juga menekankan bahwa alat AI-HS harus menambah—bukan menggantikan—keahlian petugas dan hanya menjadi opini pendukung. [WCO BACUDA HS recommendation](https://www.wcoomd.org/en/media/newsroom/2022/march/wco-bacuda-experts-develop-a-neural-network-model-to-assist-classification-of-goods-in-hs.aspx), [WCO Azerbaijan AI-HS](https://www.wcoomd.org/en/media/newsroom/2023/november/advanced-ai-hs-tool-developed-by-the-azerbaijan-customs.aspx)

Desain yang aman menghasilkan top-k candidate, pertanyaan atribut pembeda, dasar KUMHS/catatan, bukti historis internal, konsekuensi tarif/lartas, dan alasan ketidakpastian. Ahli Kepabeanan memilih atau menolak kandidat. Keputusan itu disimpan sebagai supervised feedback.

### 3.5 Drafting declaration & validation

Open API membuat integrasi draft/status layak secara teknis. Namun final submit, amendment, cancellation, resubmit, pembayaran, dan penggunaan kredensial harus dipisahkan dari reasoning agent. Payload dibangun oleh komponen deterministik dari field yang memiliki lineage; agent hanya mengorkestrasi dan menjelaskan exception.

### 3.6 Customs-value dossier

Nilai pabean tidak cukup dengan menyalin angka invoice. Penentuan dapat membutuhkan bukti objektif mengenai freight, insurance, assists, royalty/licence fee, proceeds, diskon, dan hubungan para pihak. Agent dapat mengumpulkan serta menyandingkan evidence, menandai elemen yang belum tercakup, dan menyusun response pack; deklarasi nilai final tetap disetujui manusia. [PMK 144/PMK.04/2022 tentang nilai pabean](https://jdih.kemenkeu.go.id/dok/144-pmk-04-2022/summary)

### 3.7 Audit & evidence

PPJK termasuk pihak yang wajib menyelenggarakan pembukuan dan menyimpan buku/catatan/dokumen serta data elektronik selama 10 tahun; audit kepabeanan berbasis risiko juga mencakup PPJK. [UU Kepabeanan, Pasal 49–51](https://www.pajak.go.id/id/peraturan/perubahan-atas-undang-undang-nomor-10-tahun-1995-tentang-kepabeanan), [PMK 114/2024 tentang audit kepabeanan](https://jdih.kemenkeu.go.id/dok/pmk-114-tahun-2024/summary) Agent dapat membuat evidence graph per field/keputusan, mendeteksi dokumen hilang, dan merakit audit pack—nilai yang sering tidak terlihat pada tahap submission saja.

## 4. Produk yang direkomendasikan

### Clearance Operations Agent

Produk bukan satu chatbot, melainkan workspace berbasis shipment:

1. **Ingestion dan canonical data model:** email/upload/ERP/API masuk ke satu shipment/SKU master; setiap field menyimpan sumber, halaman, confidence, waktu, dan editor.
2. **Document intelligence:** OCR/extraction dan rekonsiliasi, tetapi angka/identitas penting melewati validator deterministik.
3. **Versioned regulatory knowledge:** snapshot BTKI, lartas, izin, tarif, origin/FTA, dan aturan dengan effective date serta provenance.
4. **Agent orchestrator:** memilih tool, membuat task, meminta informasi, menjalankan runbook exception, dan menyimpan state.
5. **Connectors:** CEISA Open API/H2H, INSW/NLE, TMS/ERP, carrier/TPS, dan kanal komunikasi resmi sesuai akses yang tersedia.
6. **Approval and separation of duties:** role operator, reviewer, Ahli Kepabeanan, finance, dan submitter; tindakan berisiko memerlukan step-up approval.
7. **Audit/evaluation layer:** log input, rule version, model/version, tool call, output, approval, perubahan, dan hasil aktual.

Arsitektur harus memisahkan:

- **AI:** membaca dokumen, merencanakan, merangkum, memberi kandidat, dan mengorkestrasi;
- **rules engine:** formula, schema, required-field checks, threshold, dan larangan eksplisit;
- **human authority:** interpretasi mengikat, approval, submit, amendment, pembayaran, dan komunikasi sensitif.

## 5. Matriks kewenangan agent

| Tindakan | Otomatis | Perlu approval |
|---|---:|---:|
| Membaca dokumen dan status resmi; mengekstrak/membandingkan field | Ya | Tidak, dengan sampling QA |
| Membuat task internal, checklist, dan alert | Ya | Tidak |
| Mengirim reminder eksternal templated | Dapat, sesuai kebijakan | Untuk pesan non-template/sensitif |
| Membuat kandidat HS, lartas, nilai pabean, origin/FTA | Tidak sebagai keputusan final | Ahli Kepabeanan/reviewer |
| Membuat draft PIB/PEB/payload | Ya, sebagai draft | Review sebelum digunakan |
| Submit, amend, cancel, resubmit declaration | Tidak | Pengguna berwenang |
| Pembayaran/pelepasan dana atau jaminan | Tidak | Finance/otorisator |
| Mengubah master SKU/regulatory rule | Tidak secara diam-diam | Dual control dan versioning |

## 6. Guardrail wajib

1. **Fail closed:** bila sumber resmi tidak tersedia, aturan tidak jelas, dokumen konflik, atau effective date tidak dapat ditentukan, agent berhenti dan eskalasi.
2. **Evidence before answer:** setiap rekomendasi material menampilkan field source, aturan, tanggal berlaku, dan alasan; tidak ada citation-free compliance advice.
3. **No shared bot credential:** gunakan OAuth/token resmi, least privilege, account per entity/role, dan step-up authorization. PMK 219 menempatkan penyalahgunaan akses pada pemilik akses.
4. **Tenant isolation dan UU PDP:** minimisasi data, encryption, retention policy, DPA dengan vendor/model provider, kontrol transfer/subprocessor, redaction, dan prosedur insiden. [UU 27/2022 tentang Pelindungan Data Pribadi](https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022)
5. **Prompt-injection defense:** dokumen/email adalah data tidak tepercaya; instruksi di dalamnya tidak boleh mengubah policy, tool scope, atau tujuan agent.
6. **Deterministic validation:** perhitungan, schema API, field wajib, dan referential integrity tidak diserahkan pada LLM.
7. **Replayable audit trail:** simpan versi dokumen, ekstraksi, rule, prompt/policy, output, approval, dan respons sistem.
8. **Evaluasi berkelanjutan:** top-k HS recall, false-negative lartas, extraction accuracy per field, exception resolution, override rate, dan unauthorized action rate. NIST merekomendasikan peran human oversight yang jelas, evaluasi dalam kondisi deployment, verifikasi sumber, dan monitoring berkelanjutan. [NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/), [NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)

## 7. Pilot 90 hari

### Minggu 0–2: baseline dan data contract

- pilih satu kantor/branch, satu alur (impor untuk dipakai), dan satu keluarga komoditas;
- gunakan sekitar 200 job historis jika tersedia, termasuk normal, reject, jalur merah, dan perubahan dokumen;
- petakan field, sumber kebenaran, role, SOP, API, error code, dan waktu kerja manual;
- tetapkan ground truth oleh Ahli Kepabeanan dan kebijakan data.

### Minggu 3–6: shadow mode

- agent mengerjakan document intake, rekonsiliasi, checklist, dan status monitoring tanpa memengaruhi proses produksi;
- bandingkan dengan operator; kategorikan kesalahan ekstraksi, reasoning, source freshness, dan SOP;
- uji prompt injection, tenant isolation, outage, duplicated event, dan idempotency.

### Minggu 7–10: assisted production

- aktifkan draft dan task automation untuk sejumlah klien yang setuju;
- gunakan read-only CEISA/INSW lebih dahulu; external message hanya template yang disetujui;
- semua klasifikasi, lartas, valuation, submit, amendment, dan pembayaran tetap manual approval.

### Minggu 11–12: keputusan go/no-go

Gate minimum:

- 100% output compliance material memiliki sumber dan effective date;
- 0 final submission/payment yang tidak diotorisasi;
- tidak ada false-negative lartas kritis pada sampel pilot;
- waktu sentuh operator turun tanpa kenaikan correction/reject;
- semua override memiliki reason code dan dapat direplay.

KPI utama: first-pass document completeness, menit kerja per shipment, jumlah putaran klarifikasi, waktu dari dokumen lengkap ke draft, pre-registration correction/reject rate, exception detection latency, expert review time, override rate, dan audit-pack completeness.

Formula ROI yang dapat diisi setelah baseline:

```text
benefit bulanan =
  (shipment × menit yang dihemat × biaya tenaga kerja per menit)
  + (error yang dihindari × expected cost per error)
  + (hari delay/demurrage yang dihindari × biaya per hari)
  + kapasitas tambahan/gross margin
  − biaya model, OCR, integrasi, operasi, dan review
```

## 8. Apa yang tidak direkomendasikan

- **Autonomous customs broker:** tidak sesuai dengan profil risiko, tanggung jawab akses, dan kebutuhan Ahli Kepabeanan.
- **Chatbot regulasi generik sebagai produk utama:** mudah ditiru, sulit dipercaya, dan tidak tertanam pada shipment state serta action loop.
- **HS classifier satu jawaban:** harus top-k, evidence-backed, dan ditinjau ahli.
- **Screen scraping sebagai tulang punggung:** gunakan API/H2H resmi; browser automation hanya fallback yang diotorisasi bila memang diperbolehkan.
- **Hard-coded lartas/tarif:** perubahan 2025–2026 menunjukkan perlunya rule snapshot bertanggal.
- **Fine-tuning pada seluruh dokumen klien sejak awal:** mulai dengan retrieval, rules, dan feedback terkontrol; penggunaan data untuk training memerlukan dasar, izin, dan isolasi yang jelas.

## 9. Kesimpulan keputusan

Ada product-market logic yang kuat untuk agentic app di PPJK karena empat hal bertemu sekaligus: dokumen beragam, aturan dinamis, sistem yang dapat diintegrasikan, dan exception yang mahal. Namun diferensiasi bukan model AI semata. Moat yang lebih realistis adalah **canonical customs data model + regulatory versioning + connector resmi + expert feedback + audit-grade action history**.

Urutan investasi yang disarankan:

1. bangun document readiness, shipment workspace, dan read-only status/exception monitoring;
2. tambahkan regulatory impact mapping;
3. gunakan feedback ahli untuk HS/lartas copilot;
4. baru aktifkan draft declaration via API;
5. pertahankan final legal/financial actions di bawah human approval.

## Limitasi dan gap

- Tidak ada wawancara primer dengan operator PPJK, importir, DJBC, atau LNSW dalam riset ini.
- Tidak ditemukan statistik publik mutakhir dan terverifikasi mengenai jumlah PPJK aktif, revenue, margin, konsentrasi pasar, error rate, atau waktu kerja per aktivitas.
- Dokumentasi publik Open API membuktikan kapabilitas umum, tetapi endpoint, scope, credential model, rate limit, dan approval untuk dokumen spesifik harus diverifikasi saat discovery teknis.
- Temuan pain point dari FAQ/BCP membuktikan jenis exception, bukan frekuensi atau biaya setiap exception.
- Dampak lartas/tarif per komoditas memerlukan pembacaan lampiran dan rule snapshot pada tanggal transaksi.

## Claim-to-source ledger

| Klaim | Sumber | Penerbit/tanggal | Confidence/catatan |
|---|---|---|---|
| Definisi, registrasi, Ahli Kepabeanan, pemblokiran, tanggung jawab akses PPJK | [PMK 219/2019](https://jdih.kemenkeu.go.id/api/download/FullText/2019/219~PMK.04~2019Per.pdf) | Kemenkeu, 31 Des 2019 | Tinggi; panduan DJBC 2026 masih merujuknya, walau ada anomali metadata status pada sebagian halaman JDIH |
| Alur dan dokumen impor dipakai, self-assessment, lartas, jalur | [PMK 190/2022](https://jdih.kemenkeu.go.id/download/9796f4b5-4e17-4a02-ba12-e9036c07761e/190~PMK.04~2022.pdf) | Kemenkeu, 14 Des 2022 | Tinggi |
| Alur ekspor dan kuasa PPJK | [PMK 155/2022](https://jdih.kemenkeu.go.id/api/download/ee16c00e-e189-41e3-ab54-3a432ebe7f4c/155~PMK.04~2022.pdf) | Kemenkeu, 2 Nov 2022 | Tinggi |
| Retensi pembukuan/data elektronik 10 tahun | [UU Kepabeanan](https://www.pajak.go.id/id/peraturan/perubahan-atas-undang-undang-nomor-10-tahun-1995-tentang-kepabeanan) | Pemerintah RI/DJP, 15 Nov 2006 | Tinggi |
| Audit berbasis risiko mencakup PPJK | [PMK 114/2024](https://jdih.kemenkeu.go.id/dok/pmk-114-tahun-2024/summary) | Kemenkeu, Des 2024; efektif 1 Mar 2025 | Tinggi |
| CEISA 4.0 terintegrasi dan real-time | [CEISA 4.0](https://www.beacukai.go.id/ceisa40) | DJBC, diakses 25 Agu 2026 | Tinggi untuk kapabilitas umum |
| Open API untuk dokumen/status/lartas/kurs/manifes/tarif | [Developer Portal](https://openapi.beacukai.go.id/portal/) | DJBC, diakses 25 Agu 2026 | Tinggi; scope endpoint per pengguna perlu verifikasi |
| Exception dan jalur BCP CEISA | [BCP CEISA](https://bcp.beacukai.go.id/page.py) | DJBC, pembaruan 2024 | Tinggi untuk jenis exception, tidak mengukur frekuensi |
| NLE mengintegrasikan arus dokumen/barang dan sektor swasta | [NLE overview](https://nle.insw.go.id/overview) | LNSW, diakses 25 Agu 2026 | Tinggi |
| Skala ekspor/impor 2025 | [BPS](https://www.bps.go.id/id/pressrelease/2026/02/02/2537/perkembangan-ekspor-dan-impor.html) | BPS, 2 Feb 2026 | Tinggi; indikator arus perdagangan, bukan revenue PPJK |
| Baseline 1.600 PPJK, 1.057.084 PIB, 5,39% SPTNP | [Prosiding BPPK](https://bppk.kemenkeu.go.id/res/filestream/files/portal-bppk-media/content/page/document/2020_Pusdiklat_BC_Prosiding_Kajian_Akademis_Ind.pdf) | BPPK Kemenkeu, 2020; data 2019 | Tinggi untuk dataset 2019, rendah sebagai ukuran 2026; jangan diasumsikan seluruh SPTNP adalah error PPJK |
| Perubahan impor dan lartas 2026 | [Permendag 18/2026](https://peraturan.bpk.go.id/Details/351566/permendag-no-18-tahun-2026), [KMK 40/MK/BC/2026](https://jdih.kemenkeu.go.id/dok/40mkbc2026) | Kemendag/Kemenkeu, Jun–Jul 2026 | Tinggi untuk status umum; dampak HS perlu lampiran |
| Perubahan klasifikasi/tarif Jul 2026 | [PMK 50/2026](https://jdih.kemenkeu.go.id/dok/pmk-50-tahun-2026) | Kemenkeu, berlaku 28 Jul 2026 | Tinggi |
| AI dapat merekomendasikan kandidat HS | [WCO BACUDA](https://www.wcoomd.org/en/media/newsroom/2022/march/wco-bacuda-experts-develop-a-neural-network-model-to-assist-classification-of-goods-in-hs.aspx) | WCO, 3 Mar 2022 | Tinggi untuk kelayakan umum, bukan akurasi konteks Indonesia |
| AI-HS harus augment, bukan replace expert | [WCO Azerbaijan AI-HS](https://www.wcoomd.org/en/media/newsroom/2023/november/advanced-ai-hs-tool-developed-by-the-azerbaijan-customs.aspx) | WCO, Nov 2023 | Tinggi |
| Nilai pabean membutuhkan bukti objektif dan dapat diminta dokumen tambahan | [PMK 144/2022](https://jdih.kemenkeu.go.id/dok/144-pmk-04-2022/summary) | Kemenkeu, 2022 | Tinggi |
| Human oversight, testing, source verification, privacy/security | [NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/), [GAI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) | NIST, 2023–2024 | Tinggi; kerangka sukarela lintas sektor |
| Kewajiban PDP pada pengendali/prosesor | [UU 27/2022](https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022) | Pemerintah RI, 17 Okt 2022 | Tinggi |

## Pencarian dan stop test

Pencarian mencakup JDIH Kemenkeu/Kemendag, DJBC/CEISA Developer Portal, LNSW/NLE, BPS, WCO, NIST, dan aturan PDP. Gelombang kedua memeriksa status perubahan 2025–2026, tanggung jawab PPJK, audit/retensi, exception CEISA, Open API, dan batas assistive AI-HS. Riset dihentikan karena klaim konsekuensial sudah memiliki dukungan primer atau limitasi eksplisit; pencarian tambahan kemungkinan menambah detail komoditas/perusahaan, bukan mengubah prioritas produk. Gap kuantitatif industri memerlukan data lapangan, bukan pencarian web tambahan.
