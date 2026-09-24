# VSS Operations Workspace

Frontend Svelte untuk VSS API. Workspace ini melengkapi operasi WhatsApp/OpenClaw dengan layar untuk meninjau dan mengoreksi pekerjaan secara terstruktur; API tetap menjadi system of record.

## Jalankan lokal

Mulai API dan PostgreSQL terlebih dahulu dari `../apps/api/`:

```bash
docker compose up -d postgres
bun run db:migrate
bun run dev
```

Kemudian, dari folder ini:

```bash
npm install
npm run dev
```

Buka `http://127.0.0.1:5173`. Vite meneruskan `/api` dan `/health` ke VSS API pada port `3001`, sehingga browser tidak perlu mengakses API lintas-origin.

## Konfigurasi

Salin `.env.example` menjadi `.env` bila ingin mengatur identitas operator yang dikirim pada mutation:

```env
VITE_ACTOR_REF=web:operator-andi
```

Untuk deployment, layani frontend dan API melalui origin/reverse proxy yang sama, atau tambahkan kebijakan CORS eksplisit pada API. Jangan menaruh kredensial atau rahasia di variabel `VITE_*` karena nilainya terkirim ke browser.

## Cakupan awal

- Ringkasan event dan koneksi API;
- pembuatan organizer, venue, exhibitor, dan event;
- detail event serta partisipasi exhibitor;
- pembatalan/reaktivasi event lewat perintah lifecycle API.

Setiap perubahan mengirim `X-Actor-Ref` dan `Idempotency-Key`; validasi, audit trail, serta aturan lifecycle tetap ditegakkan oleh VSS API.
