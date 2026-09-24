# CEISA 4.0 Pabean SDK dengan Bun

Repo ini menyediakan SDK Bun/TypeScript untuk memanggil API Pabean CEISA 4.0. Sumber kontraknya adalah [arsip dokumentasi GitBook](./CEISA40_ARCHIVE.md), sehingga endpoint yang tercantum belum tentu masih aktif. SDK ini adalah **client untuk CEISA**, bukan server API lokal. Cukai, Manifes, dan Barang Kiriman belum diimplementasikan.

## 1. Siapkan Bun dan konfigurasi

Di direktori repo, jalankan:

```bash
bun install
```

Buat atau lengkapi `.env` dengan akun CEISA Anda. Bun akan membacanya otomatis; `.env` sudah diabaikan oleh `.gitignore`.

```dotenv
CEISA_API_URL=https://apisdev-gw.beacukai.go.id
CEISA_USERNAME=nama_pengguna_ceisa
CEISA_PASSWORD=kata_sandi_ceisa

# Opsional, bila akun/layanan Anda memerlukannya:
# CEISA_API_KEY=api_key_ceisa
# CEISA_ORIGIN=https://domain-perusahaan.example
# CEISA_NPWP=npwp_perusahaan
```

URL production yang tercantum dalam arsip adalah `https://apis-gw.beacukai.go.id`. Pastikan `CEISA_API_URL` menunjuk environment yang memang ingin Anda akses. Pengujian read-only ke development dapat dilakukan tanpa mengubah `.env`:

```bash
CEISA_API_URL=https://apisdev-gw.beacukai.go.id bun run smoke:read
```

Jangan menaruh username, password, API key, atau token di file source dan jangan mencetaknya saat debugging.

## 2. Coba endpoint baca dari command line

Skrip yang tersedia:

| Perintah | Hasil |
|---|---|
| `bun run login` | Memeriksa login; hanya mencetak waktu kedaluwarsa dan ketersediaan refresh token. |
| `bun run kurs USD` | Mengambil kurs terkini untuk USD. Tambahkan tanggal: `bun run kurs USD 2026-09-16`. |
| `bun run lartas 01012100` | Mencari Lartas untuk kode HS. Endpoint ini belum berhasil diverifikasi hidup; lihat catatan di bawah. |
| `bun run aju` | Merangkum nomor aju dari status/respons perusahaan. Memerlukan `CEISA_NPWP` atau `NPWP`. |
| `bun run smoke:read` | Mencoba login dan kurs USD; output hanya status operasi. |

Jika `CEISA_SMOKE_HS` diisi, smoke juga mencoba Lartas:

```bash
CEISA_SMOKE_HS=01012100 bun run smoke:read
```

`bun run aju` memanggil endpoint status perusahaan yang menurut arsip mengambil respons “yang belum diambil”. Gunakan hanya ketika Anda memang ingin membaca antrean respons akun tersebut.

### Extension Pi

Package ini menyediakan tiga tool Pi melalui `extensions/ceisa-pabean.ts`:

- `buat_draft_bc23`: membuat dan memvalidasi file draft BC 2.3 secara lokal, tanpa login atau pengiriman ke CEISA;
- `cek_status_aju_ceisa`: membaca status/respons satu nomor AJU melalui API CEISA;
- `cek_kurs_ceisa`: membaca kurs pabean CEISA untuk valuta dan tanggal tertentu.

Tool baca memakai kredensial dari environment atau file `.env` di root package. Path lain dapat ditetapkan melalui `CEISA_ENV_FILE`. `cek_status_aju_ceisa` sengaja tidak memakai endpoint antrean “respons yang belum diambil” seluruh perusahaan.

Instal sebagai package lokal lalu muat ulang Pi:

```bash
pi install /path/ke/pesisir/packages/ceisa-sdk
```

Validasi draft bersifat lokal dan bukan persetujuan CEISA. Tool extension ini tidak menyediakan operasi kirim/finalisasi dokumen.

## 3. Pakai SDK dalam kode Bun

Untuk kode di repo ini, cara paling singkat adalah memakai konfigurasi `.env`:

```ts
import { clientFromEnv } from "./src/env";

const ceisa = clientFromEnv();
const kurs = await ceisa.referensi.kurs("USD", "2026-09-16");
console.log(kurs);
```

Simpan contoh itu sebagai `contoh.ts`, lalu jalankan `bun run contoh.ts`. Client melakukan login saat panggilan pertama, menyimpan token di memori, dan memakai refresh token ketika memungkinkan. Anda tidak perlu memanggil `auth.login()` sebelum setiap request.

Jika konfigurasi berasal dari aplikasi Anda, buat client secara langsung:

```ts
import { CeisaClient } from "./src";

const ceisa = new CeisaClient({
  baseUrl: Bun.env.CEISA_API_URL!,
  username: Bun.env.CEISA_USERNAME!,
  password: Bun.env.CEISA_PASSWORD!,
  apiKey: Bun.env.CEISA_API_KEY,
  origin: Bun.env.CEISA_ORIGIN,
});
```

Metode yang tersedia dalam tahap Pabean:

| Kelompok | Metode dan parameter utama |
|---|---|
| Referensi | `kurs(kodeValuta, tanggal?)`, `lartas(kodeHs)`, `tarifHs(kodeHs, tanggal)`, `manifesBc11({ noHostBl, tglHostBl, kodeKantor, nama })` |
| Lokasi | `pelabuhanCari(kata)`, `gudangTps(kodeKantor)`, `pelabuhanKantor(kodeKantor)` |
| Dokumen baca | `dokumen.detail("23" atau "27", nomorAju, kodeKantor)` |
| Status | `respon.statusPerusahaan(idPerusahaan)`, `respon.statusAju(nomorAju)` |
| PDF | `respon.download(path)`, `respon.billing(kodeBilling)`, `respon.cetakFormulir(nomorAju)` |

Metode JSON mengembalikan `unknown`, karena bentuk respons CEISA dapat berubah; periksa strukturnya sebelum mengakses field. Metode PDF mengembalikan `{ bytes: Uint8Array, contentType: string | null }`. Contoh menyimpan PDF:

```ts
const pdf = await ceisa.respon.download("path-pdf-dari-respons-ceisa");
await Bun.write("respon.pdf", pdf.bytes);
```

Gunakan nilai `path` dari respons CEISA, bukan URL PDF sembarang.

## 4. Periksa skema dan kirim dokumen

Semua jenis dokumen memakai endpoint CEISA `POST /openapi/document`; parameter `jenis` memilih skema lokal. Contohnya, untuk BC 2.0 impor gunakan `"impor-bc20"`. [Katalog skema](./schemas/manifest.json) mencatat 17 jenis, URL sumber, dan status ekstraksi. File JSON masing-masing ada di direktori `schemas/`.

Contoh alur dari file `payload.json` yang Anda isi sesuai skema dokumen:

```ts
import { clientFromEnv } from "./src/env";
import { DocumentValidationError, type DocumentKind } from "./src";

const ceisa = clientFromEnv();
const jenis: DocumentKind = "impor-bc20";
const payload: unknown = await Bun.file("payload.json").json();

const issues = await ceisa.dokumen.validate(jenis, payload);
if (issues.length > 0) {
  console.error(issues); // path seperti $.barang[0].kodeBarang
  process.exit(1);
}

try {
  // isFinal=false menyimpan draft di CEISA; operasi ini tetap mengubah data CEISA.
  const hasil = await ceisa.dokumen.kirim(jenis, payload, { isFinal: false });
  console.log(hasil);
} catch (error) {
  if (error instanceof DocumentValidationError) console.error(error.issues);
  else throw error;
}
```

`dokumen.kirim()` menjalankan validasi lokal secara default. Untuk finalisasi, set `{ isFinal: true }` hanya setelah payload dan alur bisnisnya siap. `isRevision` hanya didokumentasikan untuk ekspor BC 3.0 dan TPB. Jika sistem Anda sudah memvalidasi payload dengan kontrak CEISA yang lebih baru, `{ validate: false }` melewati validasi lokal; CEISA tetap memvalidasi request yang dikirim.

Jenis yang tersedia: `impor-bc20`, `impor-tidak-berwujud`, `ekspor-bc30`, `ftz01-1`, `ftz01-2`, `ftz01-3`, `plb-bc16`, `plb-bc28`, `plb-bc33`, `plb-p3bet`, `tpb-bc23`, `tpb-bc25`, `tpb-bc261`, `tpb-bc262`, `tpb-bc27`, `tpb-bc40`, dan `tpb-bc41`. Anda dapat membaca skema melalui `await ceisa.dokumen.schema(jenis)`.

Validator lokal memeriksa sebagian aturan JSON Schema Draft 7: tipe, field wajib, `const`, `enum`, pola, panjang string, tanggal, batas nilai, dependencies, dan kondisi `if/then`. Ia tidak mencakup seluruh aturan bisnis CEISA. Field `maxlength` nonstandar dalam snapshot tidak diperlakukan sebagai `maxLength`.

## Header autentikasi dan pemecahan masalah

Header default adalah `Authorization: Bearer <token>`. Beberapa halaman referensi lama menulis `Authentication: <token>`; bila diperlukan, set `CEISA_REFERENCE_AUTH_HEADER=Authentication` untuk kurs, Lartas, tarif HS, dan manifes BC 1.1 saja. `CEISA_AUTH_HEADER=Authentication` mengubah header untuk semua endpoint. API key, bila diisi, dikirim sebagai `Beacukai-Api-Key`.

- `401` saat login: periksa kredensial dan environment URL. Akun production belum tentu berlaku di development.
- `404` pada endpoint: path dalam arsip mungkin sudah berubah atau layanan tidak tersedia untuk environment/akun tersebut.
- `DocumentValidationError`: baca `error.issues` untuk path dan aturan yang gagal sebelum request dikirim.
- Respons “expected JSON”: endpoint mengembalikan isi yang tidak cocok dengan kontrak JSON SDK; periksa status layanan tanpa mencetak kredensial atau token.

Hasil verifikasi read-only pada 16 September 2026: akun lokal berhasil login dan mengambil kurs USD di production. Kredensial yang sama ditolak di development (`401 invalid_grant`). Di production, path Lartas dalam arsip (`/openapi/hs-lartas`) dan path skrip lama (`/openapi/lartas`) sama-sama `404` untuk HS `01012100`. Endpoint lain belum diuji hidup. Tidak ada pengiriman dokumen yang dilakukan dalam verifikasi ini.

Untuk memeriksa perubahan kode lokal, jalankan `bun test` dan `bun run typecheck`. Jika arsip dokumentasi berubah, jalankan `bun run schemas:extract` untuk mengekstrak ulang skema.
