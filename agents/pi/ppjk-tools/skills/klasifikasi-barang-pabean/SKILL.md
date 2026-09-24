---
name: klasifikasi-barang-pabean
description: Memberikan kandidat klasifikasi barang dan HS/BTKI Indonesia secara praktis dan bertingkat. Gunakan ketika pengguna menanyakan HS code, klasifikasi barang, pos tarif, tarif impor, atau LARTAS; default ke jawaban cepat dan naikkan ketelitian hanya saat diperlukan.
metadata:
  version: "2.0"
---

# Klasifikasi Barang Pabean v2

Bantu pengguna menemukan kandidat klasifikasi yang berguna tanpa menghambat percakapan dengan terlalu banyak pertanyaan. Berikan rekomendasi awal, bukan penetapan resmi.

## Pilih mode dari konteks

### 1. Quick assist — default

Gunakan untuk pertanyaan singkat seperti “HS code helm Bluetooth apa?”.

- Berikan kandidat utama lebih dulu bila ada dasar yang masuk akal.
- Sebutkan paling banyak dua kandidat alternatif yang benar-benar relevan.
- Berikan alasan singkat berdasarkan bentuk, fungsi, bahan, atau kondisi saat diimpor.
- Ajukan **maksimal satu pertanyaan pembeda** yang paling mungkin mengubah klasifikasi.
- Jangan meminta daftar panjang data teknis di awal.
- Gunakan tingkat heading/subheading yang dapat dipertanggungjawabkan; jangan mengarang rincian 8 digit.

Format default:

```text
Kandidat awal: [kode/heading] — [uraian singkat]
Alasan: [1–2 kalimat]
Pertanyaan pembeda: [satu pertanyaan, hanya jika perlu]
Catatan: [alternatif atau batasan singkat]
```

### 2. Review

Gunakan bila pengguna meminta perbandingan kandidat, memberikan datasheet/foto, atau ingin alasan lebih rinci.

- Ringkas fakta barang yang tersedia.
- Bandingkan kandidat utama dan alternatif beserta fakta pembeda.
- Terapkan KUMHS serta Catatan Bagian/Bab/Subpos yang relevan jika sumbernya tersedia.
- Minta hanya data yang material terhadap pilihan klasifikasi.
- Nyatakan bagian yang sudah kuat dan bagian yang masih berupa asumsi.

### 3. Compliance check

Gunakan bila hasil akan dipakai untuk PIB/PEB, pengguna meminta “final”, tarif/LARTAS terkini, atau keputusan memiliki dampak kepatuhan.

- Verifikasi nomenklatur dan rincian nasional terhadap sumber resmi Indonesia yang berlaku.
- Catat sumber, edisi atau regulasi, serta tanggal berlaku yang benar-benar ditemukan.
- Untuk HS Indonesia 8 digit yang sudah diketahui, gunakan `cek_lartas` guna memeriksa tarif dan status LARTAS terkini.
- Jangan menafsirkan `lartas.verification=unverified` sebagai “LARTAS tidak ada”; jelaskan bahwa sumber publik hanya berhasil memverifikasi data tarif.
- Pisahkan kesimpulan klasifikasi, tarif, dan LARTAS.
- Sarankan review PPJK atau mekanisme resmi bila bukti tidak cukup atau risikonya tinggi.

## Prinsip klasifikasi

1. Mulai dari barang sebagaimana disajikan saat impor/ekspor, bukan hanya nama dagang.
2. Pertimbangkan fungsi objektif, bahan/komposisi, tingkat integrasi, dan cara barang dijual atau diimpor.
3. Untuk barang gabungan, tanyakan keterpisahan komponen hanya bila jawabannya dapat mengubah heading.
4. Jangan mengarang HS, uraian pos, tarif, LARTAS, atau rujukan hukum.
5. Jika informasi tipis, kandidat awal tetap boleh diberikan dengan bahasa proporsional seperti “kemungkinan besar”, “mulai cek dari”, atau “kandidat awal”.
6. Hindari disclaimer panjang. Satu catatan singkat cukup pada mode quick assist.
7. Naikkan mode secara otomatis saat pengguna meminta hasil operasional atau kepatuhan.

Baca [panduan klasifikasi](references/panduan-klasifikasi.md) hanya saat melakukan review atau compliance check.

## Contoh gaya quick assist

Pertanyaan: “HS code helm dengan mic dan headphone Bluetooth?”

Jawaban yang diharapkan:

```text
Kandidat awal: 6506.10 — helm keselamatan, bila diimpor sebagai satu helm lengkap dan fungsi utamanya tetap pelindung kepala.

Jika modul mic/headphone Bluetooth diimpor terpisah, modul tersebut perlu diklasifikasikan tersendiri pada kelompok perangkat audio/komunikasi.

Pertanyaan pembeda: modul Bluetooth menyatu dengan helm atau diimpor sebagai unit terpisah?
```

Jangan langsung meminta foto, datasheet, komposisi, sertifikat, dan seluruh detail lain kecuali pengguna meminta review lebih lanjut.
