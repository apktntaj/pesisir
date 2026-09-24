# PPJK Pi Package

Paket Pi untuk workflow intake dokumen perdagangan dan klasifikasi awal barang.

## Skill klasifikasi barang v2

`klasifikasi-barang-pabean` menggunakan tiga tingkat respons:

- **Quick assist** sebagai default: kandidat utama dan maksimal satu pertanyaan pembeda.
- **Review** untuk membandingkan kandidat berdasarkan data teknis.
- **Compliance check** untuk penggunaan PIB/PEB, tarif, atau LARTAS yang memerlukan verifikasi sumber resmi.

Skill lama `hs-btki` dinonaktifkan dari pemanggilan otomatis agar tidak memberi instruksi yang bertabrakan.

## Tool pertama

`identify_trade_document` mengklasifikasikan PDF menjadi:

- `invoice`
- `packing_list`
- `cipl` (Combined Commercial Invoice and Packing List)
- `bill_of_lading`
- `air_waybill`
- `unknown`

Deteksi memakai aturan deterministik terhadap teks PDF yang diekstrak dengan `pdftotext` (Poppler). Tool mengembalikan sinyal yang cocok, confidence, keterbatasan, dan tindakan berikutnya. Tool ini tidak memverifikasi keabsahan legal dokumen, HS, tarif, ataupun LARTAS.

## Prasyarat

```bash
sudo apt install poppler-utils
```

PDF scan/foto belum didukung pada versi awal karena memerlukan OCR.

## Pemeriksaan konsistensi CIPL/invoice dan B/L/AWB

`verify_trade_documents` menerima satu sampai enam PDF dan memeriksa kelengkapan serta konsistensi data yang berhasil diekstrak:

- keberadaan dokumen komersial (invoice/CIPL) dan dokumen pengangkutan (B/L/AWB);
- nomor invoice dan B/L/AWB;
- jumlah package, gross weight, dan consignee antardokumen;
- aritmetika baris invoice sederhana bila tabel PDF dapat dibaca;
- kronologi tanggal invoice dan tanggal pengangkutan sebagai **flag review**, bukan pelanggaran otomatis.

Untuk CIPL/invoice bertabel, aktifkan `includeVisionArtifacts: true`. Tool akan merender halaman komersial menjadi PNG sementara agar model/manusia dapat meninjau layout tabel secara visual. Ekstraksi teks tetap menjadi sumber utama; angka dari review visual harus direkonsiliasi dengan bukti halaman dan total dokumen.

Tool mengembalikan bukti nilai beserta halaman PDF dan tingkat temuan (`critical`, `review`, `info`, atau `pass`). Tool tidak memverifikasi autentisitas/legalitas dokumen, HS, nilai pabean, tarif, LARTAS, atau perizinan.

Contoh:

```text
Periksa @/home/aa/Downloads/CIPL.pdf dan @/home/aa/Downloads/AWB.pdf
```

## Uji lokal dengan Pi

```bash
pi -e ./extensions/identify-trade-document.ts -e ./extensions/verify-trade-documents.ts
```

Lalu minta Pi menggunakan tool terhadap file PDF, misalnya:

```text
Identifikasi @/home/aa/Downloads/CIPL SHENZHEN.pdf

# atau
Periksa @/home/aa/Downloads/CIPL.pdf dan @/home/aa/Downloads/AWB.pdf

# untuk CIPL bertabel, minta review visual juga
Periksa @/home/aa/Downloads/CIPL.pdf dan @/home/aa/Downloads/Bill-of-Lading.pdf, termasuk review visual tabel CIPL
```

## Test

```bash
npm test
```

## Instalasi sebagai paket lokal

Dari direktori ini:

```bash
pi install .
```

Setelah itu tool dan skill akan tersedia secara global. Untuk membagikannya ke mesin lain, simpan direktori ini dalam repository Git lalu gunakan `pi install git:...`.
