# Peluang Agentic App pada Industri PPJK Indonesia

**Deep research — 25 Agustus 2026**

## Ringkasan keputusan

Agentic app sangat relevan untuk PPJK, tetapi bentuk terbaiknya bukan "broker kepabeanan otonom". Produk yang layak adalah **Clearance Operations Agent**: workspace berbasis shipment yang menyiapkan dossier, memeriksa dokumen, mengambil aturan bertanggal, memantau CEISA/INSW/NLE, menangani exception berdasarkan SOP, dan mengeskalasi keputusan berisiko kepada Ahli Kepabeanan atau pengguna berwenang.

MVP terbaik adalah **Pre-clearance Readiness Agent**. Ia membaca invoice, packing list, B/L atau AWB, COO, dan perizinan; menyandingkan field; menemukan konflik atau kekurangan; meminta klarifikasi; lalu membuat shipment record dan checklist siap proses. Tambahkan regulatory-change sentinel dan status monitoring dalam mode read-only. Fitur HS/lartas dan draft PIB/PEB masuk tahap berikutnya, dengan human approval sebelum klasifikasi final atau submit.

## Mengapa peluangnya kuat

- PPJK bekerja pada gabungan dokumen tidak terstruktur, aturan dinamis, beberapa sistem, deadline, dan exception—tepat untuk agent yang mempertahankan state dan menggunakan tool.
- CEISA 4.0 memiliki Open API/H2H untuk dokumen, status, lartas, kurs, manifes, dan tarif; NLE/INSW dirancang untuk pertukaran data serta penghapusan duplikasi. [Developer Portal CEISA](https://openapi.beacukai.go.id/portal/), [NLE](https://nle.insw.go.id/overview)
- PPJK wajib memiliki Ahli Kepabeanan dan menghadapi risiko pemblokiran akses serta tanggung jawab pungutan tertentu. Final legal/financial action harus tetap di bawah otorisasi manusia. [PMK 219/2019](https://jdih.kemenkeu.go.id/api/download/FullText/2019/219~PMK.04~2019Per.pdf)
- Aturan berubah cepat: ketentuan impor dan daftar lartas berubah lagi pada Juni–Juli 2026, disusul perubahan klasifikasi/tarif efektif 28 Juli 2026. [Permendag 18/2026](https://peraturan.bpk.go.id/Details/351566/permendag-no-18-tahun-2026), [KMK 40/MK/BC/2026](https://jdih.kemenkeu.go.id/dok/40mkbc2026), [PMK 50/2026](https://jdih.kemenkeu.go.id/dok/pmk-50-tahun-2026)

Nilai ekspor dan impor Indonesia pada 2025 sekitar US$524,8 miliar jika dijumlahkan. Ini bukan ukuran pendapatan PPJK, tetapi menunjukkan skala arus transaksi yang menggunakan data kepabeanan. [BPS](https://www.bps.go.id/id/pressrelease/2026/02/02/2537/perkembangan-ekspor-dan-impor.html)

Data pemerintah terakhir yang ditemukan tentang populasi PPJK sudah stale: baseline 2019 menyebut sekitar 1.600 PPJK aktif, 31.257 importir, dan 1.057.084 PIB. Sebanyak 5,39% PIB menerima SPTNP terkait tarif dan/atau nilai pabean. Angka ini tidak diekstrapolasi ke 2026 dan tidak berarti seluruh koreksi adalah error PPJK, tetapi mengonfirmasi materialitas klasifikasi dan nilai pabean. [Prosiding BPPK 2020](https://bppk.kemenkeu.go.id/res/filestream/files/portal-bppk-media/content/page/document/2020_Pusdiklat_BC_Prosiding_Kajian_Akademis_Ind.pdf)

## Alur kerja yang menjadi target

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

Untuk impor dipakai, PIB bersumber dari invoice, packing list, B/L/AWB, identifikasi barang, dan dokumen persyaratan impor; proses memakai self-assessment dan pemeriksaan berbasis risiko. [PMK 190/2022](https://jdih.kemenkeu.go.id/download/9796f4b5-4e17-4a02-ba12-e9036c07761e/190~PMK.04~2022.pdf), [DJBC](https://www.beacukai.go.id/impor-untuk-dipakai)

## Use case prioritas

| Prioritas | Use case | Peran agent | Nilai | Risiko |
|---|---|---|---|---|
| P0 | **Pre-clearance readiness** | Ekstraksi, rekonsiliasi, missing-document chase, checklist, shipment record | Sangat tinggi | Rendah–sedang |
| P0 | **Status & exception control tower** | Monitor respons, klasifikasi pending/reject/billing/jalur, jalankan runbook, buat task dan update | Sangat tinggi | Sedang |
| P0 | **Regulatory impact sentinel** | Diff aturan bertanggal; petakan perubahan ke HS/SKU/klien/shipment; eskalasi review | Tinggi | Sedang |
| P1 | **HS–tarif–lartas copilot** | Pertanyaan atribut, kandidat HS beserta alasan/sumber, lartas/origin/FTA, estimasi landed cost | Sangat tinggi | Tinggi |
| P1 | **Customs-value dossier** | Rekonsiliasi invoice–PO–payment–freight–insurance–royalty/assists dan evidence pack KNP/SPTNP | Tinggi | Tinggi |
| P1 | **Draft PIB/PEB & validation** | Bentuk draft/payload, validasi field, tampilkan lineage, siapkan approval | Sangat tinggi | Tinggi |
| P1 | **Post-entry audit agent** | Satukan dokumen, declaration, billing, perubahan, korespondensi, dan log; buat audit pack | Tinggi | Sedang |
| P2 | **Permit/FTA optimization** | Cek izin, kuota, masa berlaku, COO/FTA eligibility, deadline, dan status | Tinggi | Tinggi |
| P2 | **Client communication & job costing** | Status update, reminder, exception summary, disbursement, draft invoice, margin | Sedang | Rendah–sedang |

### MVP: Pre-clearance Readiness Agent

Agent bekerja dari shipment baru: ekstraksi → normalisasi → rekonsiliasi → pertanyaan klarifikasi → checklist → shipment record → handoff. Ia tidak menebak atribut produk yang hilang dan tidak mengubah dokumen sumber. MVP ini memberi manfaat terukur tanpa memerlukan hak submit, sekaligus membangun data koreksi ahli untuk HS/lartas copilot.

### Diferensiasi berikutnya: HS/lartas copilot

BTKI menghubungkan HS dengan tarif, pajak, lartas, statistik, dan enforcement. [DJBC, BTKI](https://www.beacukai.go.id/btki-dan-tarif) WCO telah membuktikan kelayakan rekomendasi kandidat HS, tetapi menegaskan bahwa AI harus menjadi opini pendukung, bukan pengganti ahli. [WCO BACUDA](https://www.wcoomd.org/en/media/newsroom/2022/march/wco-bacuda-experts-develop-a-neural-network-model-to-assist-classification-of-goods-in-hs.aspx), [WCO AI-HS](https://www.wcoomd.org/en/media/newsroom/2023/november/advanced-ai-hs-tool-developed-by-the-azerbaijan-customs.aspx)

Output yang aman berisi top-k candidate, pertanyaan atribut pembeda, dasar aturan, konsekuensi tarif/lartas, bukti historis internal, dan alasan ketidakpastian. Ahli Kepabeanan memilih atau menolak kandidat.

### Customs-value dossier

Nilai pabean memerlukan bukti objektif, bukan hanya angka invoice. Agent dapat menyandingkan freight, insurance, assists, royalty/licence fee, proceeds, diskon, dan hubungan para pihak, lalu membentuk evidence pack untuk review atau respons KNP/SPTNP. Deklarasi final tetap human-approved. [PMK 144/2022](https://jdih.kemenkeu.go.id/dok/144-pmk-04-2022/summary)

## Desain produk

Clearance Operations Agent memerlukan tujuh lapisan:

1. ingestion dan canonical shipment/SKU data model dengan field lineage;
2. OCR/extraction serta rekonsiliasi dokumen;
3. regulatory knowledge bertanggal dan berversi;
4. agent orchestrator untuk task, klarifikasi, runbook, dan state;
5. connector resmi ke CEISA/INSW/NLE serta ERP/TMS;
6. approval, role, dan separation of duties;
7. audit trail serta evaluation harness.

AI membaca, merencanakan, memberi kandidat, dan mengorkestrasi. Rules engine menangani formula, schema, required fields, dan larangan eksplisit. Manusia memegang interpretasi final, approval, submit, amendment, pembayaran, serta komunikasi sensitif.

## Batas kewenangan

| Tindakan | Otomatis | Approval |
|---|---:|---:|
| Membaca status, ekstraksi, rekonsiliasi | Ya | Sampling QA |
| Membuat task/checklist/alert | Ya | Tidak |
| Reminder eksternal templated | Dapat | Sesuai kebijakan |
| Kandidat HS/lartas/valuation/origin | Bukan keputusan final | Ahli/reviewer |
| Draft PIB/PEB | Ya, draft | Review wajib |
| Submit/amend/cancel/resubmit | Tidak | Pengguna berwenang |
| Pembayaran/jaminan | Tidak | Finance/otorisator |

Guardrail minimum: fail closed saat sumber tidak tersedia; sumber dan effective date pada setiap rekomendasi; no shared credential; least privilege; tenant isolation; perlindungan data sesuai [UU PDP](https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022); pertahanan prompt injection; validator deterministik; replayable audit trail; serta evaluasi berkelanjutan. [NIST AI RMF](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)

## Pilot 90 hari

**Minggu 0–2:** pilih satu branch, impor untuk dipakai, dan satu keluarga komoditas; baseline sekitar 200 job historis bila tersedia; definisikan field, ground truth, role, SOP, dan API.  
**Minggu 3–6:** shadow mode untuk intake, checklist, dan status; bandingkan dengan operator; uji outage, prompt injection, duplication, dan idempotency.  
**Minggu 7–10:** assisted production; read-only CEISA/INSW dahulu; draft/task automation; klasifikasi, lartas, submit, amendment, dan pembayaran tetap manual approval.  
**Minggu 11–12:** evaluasi dan keputusan go/no-go.

Gate minimum:

- 100% output compliance material memiliki sumber dan effective date;
- 0 final submission/payment yang tidak diotorisasi;
- tidak ada false-negative lartas kritis pada sampel pilot;
- waktu sentuh turun tanpa kenaikan correction/reject;
- semua override memiliki reason code dan dapat direplay.

KPI: first-pass completeness, menit kerja per shipment, putaran klarifikasi, waktu dokumen-lengkap ke draft, correction/reject rate, exception detection latency, expert review time, override rate, dan audit-pack completeness.

## Kesimpulan

Product-market logic-nya kuat, tetapi moat bukan model AI. Moat yang lebih realistis adalah **canonical customs data + regulatory versioning + connector resmi + expert feedback + audit-grade action history**.

Urutan investasi:

1. document readiness dan shipment workspace;
2. read-only status/exception monitoring;
3. regulatory impact mapping;
4. HS/lartas copilot dari feedback ahli;
5. draft declaration via API;
6. final legal/financial actions tetap human-approved.

## Limitasi

Tidak ada wawancara primer dalam riset ini. Tidak ditemukan data publik mutakhir yang kuat tentang jumlah PPJK aktif, revenue, margin, error rate, atau touch-time per proses. Dokumentasi Open API membuktikan kelayakan umum, tetapi endpoint dan scope spesifik harus diverifikasi saat discovery teknis. Jenis exception terlihat pada [BCP CEISA](https://bcp.beacukai.go.id/page.py), tetapi frekuensi serta biayanya perlu diukur dari data perusahaan.
