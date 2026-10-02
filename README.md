# Pesisir

Asisten operasional PPJK on-premise dengan WhatsApp/OpenClaw sebagai antarmuka utama. Arah produk, batas kewenangan, dan pembagian peran sistem dijelaskan dalam [`PROJECT_INTENT.md`](PROJECT_INTENT.md).

## Struktur

```text
apps/
  api/                 System of record dan business API
  workspace/           Workspace operasional berbasis Svelte
  project-management/  Aplikasi Next.js lama dan referensi domain (submodule)
  mcp-server/          Adapter tool OpenClaw ke VSS API
  insw-gateway/        Gateway integrasi INSW/LARTAS lama
packages/
  ceisa-sdk/           SDK CEISA dan schema dokumen pabean
agents/
  openclaw/            Skill OpenClaw
  pi/ppjk-tools/       Tool deterministik dan skill Pi

docs/
  architecture/        Keputusan dan alternatif arsitektur
  knowledge/           Pengetahuan domain terkurasi
  research/            Riset produk dan PPJK
```

## Menjalankan dengan Docker

```bash
cp .env.example .env
# Isi AUTH_SECRET — buat dengan: openssl rand -base64 32
docker compose up -d
```

Service yang berjalan: PostgreSQL (5432), API (3001), web UI (3000), INSW gateway (3002).

Instruksi rinci per komponen tersedia di README masing-masing.

## Prinsip pengembangan

- `apps/api/` adalah pemilik data operasional, invariant, lifecycle, audit, dan otorisasi.
- Agent dan web memanggil API; keduanya bukan sumber data kedua.
- `apps/project-management/` menyimpan logic domain matang yang dimigrasikan bertahap, bukan persistence target.
- Keputusan pabean berdampak tinggi tetap memerlukan manusia berwenang.
- Dokumen pelanggan, ekspor percakapan, token, dan database runtime tidak disimpan dalam source control.
