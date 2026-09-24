---
name: document-intake
description: Mengidentifikasi dokumen perdagangan yang diunggah sebagai invoice, packing list, CIPL, Bill of Lading, atau Air Waybill menggunakan tool deterministic. Gunakan saat pengguna mengunggah atau menanyakan jenis dokumen perdagangan.
---

# Document Intake PPJK

1. Saat pengguna memberikan PDF dokumen perdagangan, panggil `identify_trade_document`.
2. Jangan menyimpulkan jenis dokumen dari nama file saja.
3. Sampaikan jenis dokumen, confidence, dan sinyal/bukti yang dikembalikan tool.
4. Bila hasil `unknown` atau confidence rendah, minta pengguna mengonfirmasi jenis dokumen atau mengunggah dokumen yang lebih jelas.
5. Bila hasilnya `invoice`, jelaskan bahwa packing list belum terdeteksi. Bila hasilnya `packing_list`, jelaskan bahwa invoice belum terdeteksi. Jangan menyatakan kedua dokumen pasti diwajibkan; ikuti SOP kasus.
6. Bila hasilnya `cipl`, jelaskan bahwa unsur invoice dan packing list ditemukan pada dokumen yang sama.
7. Bila hasilnya `bill_of_lading` atau `air_waybill`, jelaskan bahwa ini dokumen pengangkutan. Jangan menganggapnya sebagai pengganti invoice atau packing list.
8. Bila pengguna sudah memberikan CIPL/invoice bersama B/L atau AWB dan meminta pemeriksaan isi/kecocokan, gunakan skill `pemeriksaan-dokumen-impor` serta tool `verify_trade_documents`.
9. Tool ini hanya mengidentifikasi struktur dokumen. Jangan menyimpulkan keabsahan legal, kesesuaian HS, tarif, LARTAS, atau kepatuhan dari hasil ini.
