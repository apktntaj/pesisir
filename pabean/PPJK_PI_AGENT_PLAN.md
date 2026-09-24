# Rencana: Agent PPJK On-Premise Berbasis Pi

## 1. Tujuan

Membangun asisten PPJK yang berjalan di infrastruktur kantor (*on-premise*) untuk membantu komunikasi, pengumpulan data, pengecekan awal, dan penyusunan ringkasan kasus kepabeanan.

WhatsApp menjadi antarmuka pengguna. Pi menjadi *agent runtime* yang menjalankan instruksi domain, skills, dan tools. Sistem tidak menggantikan keputusan profesional PPJK atau proses persetujuan resmi.

## 2. Prinsip Utama

- **On-premise first**: database, dokumen, indeks/RAG, log audit, dan runtime aplikasi berada pada mesin internal.
- **Least privilege**: agent hanya memperoleh tool yang diperlukan; tidak diberi akses shell, file, atau database tanpa pembatasan yang jelas.
- **Human-in-the-loop**: kandidat HS, LARTAS, kelengkapan dokumen, dan tindakan berdampak tinggi selalu dapat ditinjau petugas PPJK.
- **Data minimization**: hanya data minimum yang dikirim ke layanan eksternal, misalnya HS code ke INSW.
- **Auditability**: setiap permintaan, sumber data, pemanggilan tool, respons, dan approval penting dapat ditelusuri.
- **Replaceable channels**: integrasi WhatsApp dapat diganti dari Baileys ke Meta Cloud API tanpa mengubah logika PPJK.

## 3. Arsitektur Target

```text
Pengguna WhatsApp
        │
        ▼
WhatsApp adapter
(Baileys untuk development / Meta Cloud API untuk produksi)
        │
        ▼
Aplikasi agent internal Node.js (daemon)
  ├─ autentikasi dan pemetaan pelanggan/kasus
  ├─ antrean pesan per percakapan
  ├─ manajemen session Pi
  ├─ logging, audit, approval, dan handoff manusia
  └─ Pi SDK
       ├─ skills PPJK
       ├─ extensions/tools PPJK
       ├─ model lokal atau provider model eksternal
       └─ session/context
        │
        ├────────► Database lokal
        ├────────► Penyimpanan dokumen + RAG lokal
        ├────────► INSW/sumber resmi (egress terbatas)
        └────────► Petugas PPJK untuk review/approval
```

Pi tidak diekspos langsung ke internet. Komponen yang menerima webhook WhatsApp adalah adapter/gateway yang dibatasi dan divalidasi.

## 4. Peran Komponen

| Komponen | Tanggung jawab |
|---|---|
| Pi SDK | Menjalankan agent dari aplikasi Node.js: prompt, tools, events, context, dan session. |
| Pi package | Paket Git berisi skills, extension, tools, prompt, dan dependency PPJK. |
| Skills | SOP dan penalaran domain: alur klasifikasi, pertanyaan klarifikasi, batas jawaban, dan aturan eskalasi. |
| Extensions/tools | Integrasi terstruktur: INSW, pencarian BTKI, validasi dokumen, database, CRM, ticket/approval. |
| WhatsApp adapter | Hanya menerima/menormalkan pesan dan mengirim balasan. Tidak memuat logika PPJK. |
| Database lokal | Data klien, kasus, pemetaan nomor ke session, status review, audit log, dan konfigurasi. |
| RAG/dokumen lokal | Dokumen klien dan regulasi yang telah diindeks serta diberi versi/tanggal efektif. |

## 5. Adapter WhatsApp Tipis

Adapter menyediakan kontrak yang stabil untuk aplikasi agent.

```ts
type IncomingMessage = {
  conversationId: string;
  senderId: string;
  text: string;
  attachments?: Array<{ path: string; mimeType: string }>;
};

interface WhatsAppAdapter {
  onMessage(handler: (message: IncomingMessage) => Promise<void>): void;
  sendText(to: string, text: string): Promise<void>;
}
```

Implementasi awal dapat memakai `BaileysAdapter`. Saat produksi, implementasinya diganti menjadi `MetaCloudApiAdapter`; aplikasi PPJK tetap memproses `IncomingMessage` yang sama.

> Baileys memakai automasi WhatsApp Web dan bukan API resmi. Gunakan untuk development dengan nomor/data uji, bukan nomor bisnis utama atau data klien nyata. Untuk produksi gunakan Meta WhatsApp Business/Cloud API.

## 6. Alur Pesan

1. Pesan masuk melalui WhatsApp adapter.
2. Adapter memvalidasi asal pesan, mengunduh lampiran dengan batas ukuran/tipe, lalu menormalkan data.
3. Aplikasi mencari `conversationId`, pelanggan, dan kasus pada database.
4. Pesan dimasukkan ke antrean **per percakapan** agar dua pesan tidak mencampur konteks.
5. Aplikasi memuat atau membuat session Pi untuk percakapan/kasus itu.
6. Pi meminta data yang kurang atau menjalankan tools PPJK yang diizinkan.
7. Respons, sumber data, hasil tool, dan status review dicatat dalam audit log.
8. Adapter mengirim balasan ke WhatsApp.
9. Jika confidence rendah atau tindakan berisiko, sistem membuat tiket/handoff ke petugas PPJK.

## 7. Kemampuan MVP

MVP hanya berfungsi sebagai asisten dan tidak mengajukan deklarasi atau membuat keputusan final.

- Mengumpulkan informasi barang dan dokumen yang belum lengkap.
- Membuat ringkasan kasus untuk petugas PPJK.
- Memberi kandidat HS beserta alasan, data yang kurang, dan status perlu review.
- Memeriksa tarif/LARTAS melalui sumber resmi yang tersedia.
- Membuat checklist invoice, packing list, spesifikasi produk, dan dokumen pendukung.
- Mencari regulasi versi yang relevan dari basis pengetahuan lokal.
- Mengeskalasi kasus ke manusia.

## 8. Batas Keputusan dan Kualitas Jawaban

- Hasil agent adalah **kandidat/rekomendasi awal**, bukan penetapan HS atau kepatuhan final.
- Tool harus membedakan hasil `ditemukan`, `tidak ditemukan`, `sumber gagal`, dan `belum terverifikasi`.
- Untuk LARTAS, status yang belum terverifikasi tidak boleh disimpulkan sebagai “LARTAS tidak ada”.
- Jawaban harus menyatakan sumber, tanggal/versi regulasi bila ada, asumsi, data yang belum tersedia, dan kebutuhan review.
- Perubahan data, pengajuan dokumen, atau instruksi bernilai hukum/keuangan harus melalui approval petugas berwenang.

## 9. Privasi dan Keamanan

### Data dan model

- Database, dokumen, embeddings, session, dan audit log berada di mesin internal.
- Pertimbangkan model lokal (Ollama, llama.cpp, atau vLLM) bila isi dokumen tidak boleh dikirim ke provider model eksternal.
- Jika menggunakan model cloud, tetapkan klasifikasi data, redaksi PII, persetujuan, dan kebijakan retensi yang jelas.
- Query ke INSW atau sumber eksternal hanya mengirim parameter minimum yang diperlukan.

### Infrastruktur

- Jalankan aplikasi sebagai service (`systemd` atau Docker) pada mesin internal khusus.
- Jangan membuka database atau runtime Pi ke internet.
- Bila memakai Meta Cloud API, webhook publik ditempatkan pada gateway/reverse proxy yang tervalidasi, lalu diteruskan secara aman ke aplikasi internal.
- Terapkan RBAC, enkripsi backup, rotasi secret, pembatasan akses jaringan, dan monitoring.
- Validasi MIME, ukuran, dan asal lampiran sebelum dokumen diproses.

## 10. Struktur Paket Pi

```text
ppjk-pi-package/
├── package.json
├── extensions/
│   ├── insw.ts
│   ├── case-store.ts
│   ├── document-check.ts
│   └── human-handoff.ts
└── skills/
    ├── hs-btki/
    │   └── SKILL.md
    ├── lartas/
    │   └── SKILL.md
    └── document-review/
        └── SKILL.md
```

Paket ini disimpan di Git agar dapat dipasang pada mesin development, staging, maupun mesin on-premise produksi secara konsisten.

## 11. Tahapan Implementasi

### Tahap 1 — Agent lokal

1. Definisikan SOP, batas jawaban, dan template eskalasi.
2. Buat skills PPJK pertama.
3. Buat tool read-only untuk cek data resmi dan pencarian basis pengetahuan lokal.
4. Uji melalui Pi terminal menggunakan data sintetis.

### Tahap 2 — Paket dan persistensi

1. Bundel skills/tools sebagai Pi package Git.
2. Rancang skema database: pelanggan, kasus, percakapan, session, pesan, tool result, review, dan audit.
3. Implementasikan penyimpanan dan pemulihan session per kasus.
4. Tambahkan logging terstruktur serta redaksi data sensitif.

### Tahap 3 — Service Pi SDK

1. Buat aplikasi Node.js daemon yang memuat Pi SDK dan paket PPJK.
2. Buat worker/queue per `conversationId`.
3. Hubungkan Pi session dengan record kasus di database.
4. Tambahkan mekanisme human handoff dan approval.

### Tahap 4 — WhatsApp development

1. Implementasikan adapter Baileys dengan nomor pengujian.
2. Uji pesan teks, konteks percakapan, error handling, dan batas lampiran.
3. Jangan gunakan data klien produksi selama tahap ini.

### Tahap 5 — Produksi

1. Ganti adapter dengan Meta Cloud API resmi.
2. Siapkan gateway webhook, verifikasi signature, dan aturan jaringan.
3. Jalankan penetration/security review dan uji pemulihan backup.
4. Terapkan monitoring, alert, SOP insiden, dan pelatihan operator.

## 12. Keputusan Teknis Awal

| Area | Keputusan awal |
|---|---|
| Runtime agent | Pi SDK dalam aplikasi Node.js internal |
| Penyebaran | On-premise, service/daemon pada mesin internal |
| Kanal development | Baileys dengan akun dan data uji |
| Kanal production | Meta WhatsApp Business/Cloud API resmi |
| Pengetahuan domain | Pi skills + basis pengetahuan lokal berversi |
| Integrasi data | Tools/extensions read-only dan terukur |
| Keputusan final | Petugas PPJK/human approval |
| Data sensitif | Lokal secara default; egress minimum dan terkontrol |

## 13. Risiko yang Perlu Dikelola

- Ketidakakuratan model atau klasifikasi tanpa spesifikasi barang lengkap.
- Perubahan regulasi/tarif dan data LARTAS yang tidak mutakhir.
- Risiko akun WhatsApp bila memakai Baileys di luar development.
- Kebocoran data melalui provider model cloud, log, lampiran, atau backup.
- Context antar-klien tercampur bila session/queue tidak dipisahkan.
- Tool yang terlalu berkuasa atau tanpa audit/approval.

## 14. Langkah Berikutnya

1. Tentukan 3–5 use case MVP yang paling bernilai dan rendah risiko.
2. Tulis SOP dan contoh percakapan untuk masing-masing use case.
3. Buat struktur repository Pi package.
4. Buat satu tool data resmi dan satu skill PPJK sebagai *vertical slice*.
5. Uji di Pi terminal sebelum menambahkan WhatsApp.
