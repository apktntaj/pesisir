---
description: Identifikasi PDF sebagai invoice, packing list, CIPL, Bill of Lading, Air Waybill, atau unknown
argument-hint: "<path-pdf>"
---
Gunakan tool `identify_trade_document` untuk memeriksa file `$1`.

Aturan respons:
1. Jangan menentukan jenis dokumen dari nama file saja; gunakan hanya hasil tool.
2. Tampilkan jenis dokumen dan confidence.
3. Tampilkan sinyal invoice, packing list, Bill of Lading, dan Air Waybill yang ditemukan.
4. Jelaskan tindakan berikutnya dari hasil tool.
5. Nyatakan bahwa hasil ini hanya identifikasi struktur dokumen, bukan verifikasi legal, HS, tarif, atau LARTAS.
