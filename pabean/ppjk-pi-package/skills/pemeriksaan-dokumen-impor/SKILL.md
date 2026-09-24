---
name: pemeriksaan-dokumen-impor
description: Memeriksa kelengkapan dan konsistensi CIPL/invoice, packing list, Bill of Lading, dan Air Waybill untuk workflow impor. Gunakan saat pengguna mengunggah atau meminta pemeriksaan dokumen perdagangan.
---

# Pemeriksaan Dokumen Impor

Gunakan `verify_trade_documents` bila pengguna menyediakan satu atau lebih PDF CIPL/invoice dan B/L atau AWB.

## Alur

1. Jalankan tool terhadap seluruh dokumen terkait dalam **satu** pemanggilan agar pemeriksaan antardokumen dapat dilakukan.
2. Untuk CIPL/invoice bertabel, jalankan `verify_trade_documents` dengan `includeVisionArtifacts: true`. Tool akan merender halaman komersial menjadi PNG lokal.
3. Bila artefak visual tersedia, baca hanya halaman tabel yang relevan. Transkripsikan field/total yang tidak dapat diekstrak teks dengan bukti nomor halaman; jangan mengarang baris atau angka yang tidak terlihat jelas.
4. Laporkan status, dokumen yang terdeteksi, serta temuan menurut tingkat: **kritis**, **perlu review**, **info**, atau **lulus**.
5. Untuk setiap flag, sebutkan nilai/dokumen/halaman bukti yang tersedia di hasil tool atau review visual.
6. Minta dokumen atau klarifikasi hanya untuk temuan yang material.

## Batasan wajib

- Jangan menyatakan dokumen asli, sah, palsu, atau compliant hanya dari hasil tool.
- Jangan menafsirkan invoice yang bertanggal setelah B/L atau AWB sebagai pelanggaran otomatis. Nyatakan sebagai flag kronologi yang harus dibandingkan dengan SOP dan fakta transaksi.
- Tool dan review visual belum memverifikasi kesesuaian HS, nilai pabean, tarif, LARTAS, perizinan, tanda tangan, maupun autentisitas carrier.
- Jika PDF scan tidak dapat diekstrak, minta PDF dengan text layer atau hasil OCR.

## Respons ringkas

```text
Status: Perlu review
Dokumen: CIPL dan AWB terdeteksi.

Temuan kritis/review:
- [Perlu review] Gross weight berbeda: ...
- [Perlu review] Invoice diterbitkan setelah tanggal AWB; bukan pelanggaran otomatis, mohon cek SOP/transaksi.

Lulus: ...
Batasan: pemeriksaan ini hanya menguji konsistensi data yang berhasil diekstrak.
```

## Prinsip hybrid

Ekstraksi teks deterministik tetap menjadi sumber utama untuk nomor dokumen, pihak, package, berat, dan tanggal. Review visual oleh model dipakai untuk memperbaiki pembacaan layout tabel, total, dan baris item yang ambigu. Hasil visual harus tetap dibandingkan dengan angka total dan bukti halaman; bila tidak dapat direkonsiliasi, tandai **perlu review**.

Gunakan `identify_trade_document` sendiri hanya bila pengguna meminta identifikasi jenis satu dokumen atau sebelum semua dokumen workflow tersedia.
