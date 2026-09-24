Setuju—untuk tahap awal, bangun sebagai **headless PPJK tool layer**, bukan workflow engine. Biarkan setiap PPJK mengatur SOP, assignment, approval, dan notifikasi sendiri.

MVP paling kecil yang saya sarankan:

1. `extract_documents(files)`
   - Ekstrak invoice, packing list, B/L/AWB, COO, izin.
   - Output terstruktur + asal field/page + confidence.

2. `reconcile_shipment(documents)`
   - Bandingkan pihak, berat, kemasan, kontainer, nilai, valuta, incoterm, dan uraian barang.
   - Output hanya mismatch/missing fields—tanpa membuat task.

3. `lookup_compliance(product, hs_candidate, date, origin)`
   - Cari kandidat HS, tarif, lartas, dan dokumen yang diperlukan.
   - Wajib mengembalikan sumber resmi dan tanggal berlaku; jangan memberi keputusan final.

4. `validate_declaration(draft, type)`
   - Validasi field wajib, format, konsistensi nilai/CIF, dan aturan deterministik sebelum PIB/PEB dibuat atau dikirim.

5. `get_clearance_status(reference)`
   - Read-only status dari CEISA/INSW bila akses API tersedia.

6. `build_evidence_pack(shipment_id)`
   - Bentuk paket bukti: dokumen sumber, hasil ekstraksi, validasi, aturan yang dipakai, dan jejak perubahan.

Batas MVP: tidak ada submit PIB/PEB, amendment, pembayaran, assignment, SLA, atau workflow. Itu membuat tool aman dipakai oleh perusahaan dengan proses yang sangat berbeda, sambil tetap selaras dengan risiko PPJK dan kapabilitas integrasi CEISA. [CEISA Open API](https://openapi.beacukai.go.id/portal/)

Arsitektur sederhananya:

```text
Agent perusahaan / workflow perusahaan
              ↓ tool call
PPJK Tool Server (MCP/API)
  ├─ document extraction
  ├─ reconciliation
  ├─ compliance lookup
  ├─ deterministic validation
  └─ CEISA/INSW read-only connector
```

Urutan implementasi saya: `extract_documents` → `reconcile_shipment` → `lookup_compliance` → `validate_declaration`. Ini sudah cukup bernilai tanpa mengunci pelanggan ke workflow Anda.
