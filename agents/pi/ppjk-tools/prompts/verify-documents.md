---
description: Periksa konsistensi CIPL/invoice, B/L, atau AWB
argument-hint: "<path-pdf-1> <path-pdf-2> [...]"
---
Gunakan tool `verify_trade_documents` terhadap PDF yang diberikan: $1.

Aturan respons:
1. Laporkan status dan jenis dokumen yang terdeteksi.
2. Kelompokkan temuan menjadi kritis, perlu review, info, dan lulus.
3. Berikan bukti dokumen/halaman dari hasil tool untuk setiap flag material.
4. Jangan menyatakan dokumen sah/tidak sah atau compliant/tidak compliant; hasil hanya pemeriksaan konsistensi berbasis teks.
5. Invoice dengan tanggal setelah B/L/AWB adalah flag untuk review SOP/transaksi, bukan pelanggaran otomatis.
