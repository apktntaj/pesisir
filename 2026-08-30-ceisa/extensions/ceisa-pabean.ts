import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  formatSize,
  truncateHead,
  withFileMutationQueue,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { CeisaClient, type AuthHeader, type CeisaOptions } from "../src/ceisa.ts";
import { createBc23Draft, reviewBc23Draft } from "../src/bc23-draft.ts";
import { summarizeAjuStatus } from "../src/status.ts";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ENV_PATH = join(PACKAGE_ROOT, ".env");

export default function ceisaPabeanExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "buat_draft_bc23",
    label: "Buat Draft BC 2.3",
    description:
      "Membuat file JSON draft TPB BC 2.3 dan memvalidasinya secara lokal berdasarkan snapshot skema CEISA. Tool ini tidak login, tidak memanggil API, dan tidak mengirim atau memfinalisasi dokumen CEISA.",
    promptSnippet: "Buat draft JSON BC 2.3 lokal tanpa mengirim ke CEISA",
    promptGuidelines: [
      "Gunakan buat_draft_bc23 ketika pengguna meminta kerangka atau draft BC 2.3; jelaskan bahwa file belum dikirim ke CEISA.",
      "Jangan menyatakan draft BC 2.3 diterima atau disetujui Bea Cukai hanya karena validasi lokal lulus.",
    ],
    parameters: Type.Object({
      outputPath: Type.Optional(Type.String({
        description: "Path file JSON keluaran relatif terhadap direktori kerja; default bc23-draft.json. Awalan @ diperbolehkan.",
      })),
      data: Type.Optional(Type.Record(Type.String(), Type.Unknown(), {
        description: "Nilai awal BC 2.3 yang akan digabungkan ke kerangka pada level teratas.",
      })),
      overwrite: Type.Optional(Type.Boolean({
        description: "Izinkan menimpa file yang sudah ada; default false.",
      })),
    }),
    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      signal?.throwIfAborted();
      const requestedPath = (params.outputPath ?? "bc23-draft.json").replace(/^@/, "");
      const outputPath = resolve(ctx.cwd, requestedPath);
      const draft = { ...createBc23Draft(), ...(params.data ?? {}) };
      const review = await reviewBc23Draft(draft);

      onUpdate?.({ content: [{ type: "text", text: "Menulis dan memvalidasi draft BC 2.3 secara lokal..." }] });
      await withFileMutationQueue(outputPath, async () => {
        if (!params.overwrite && await exists(outputPath)) {
          throw new Error(`File sudah ada; gunakan overwrite=true bila memang ingin menimpanya: ${requestedPath}`);
        }
        signal?.throwIfAborted();
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, `${JSON.stringify(draft, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
      });

      const summary = [
        `Draft BC 2.3 dibuat: ${outputPath}`,
        `Status lokal: ${review.ready ? "lengkap menurut pemeriksaan lokal" : "belum lengkap/perlu review"}`,
        `Masalah skema: ${review.schemaIssues.length}`,
        `Masalah kelengkapan/konsistensi: ${review.readinessIssues.length}`,
        "Remote request: tidak ada; dokumen tidak dikirim ke CEISA.",
      ].join("\n");
      return {
        content: [{ type: "text", text: summary }],
        details: { outputPath, review, remoteRequest: false },
      };
    },
  });

  pi.registerTool({
    name: "cek_status_aju_ceisa",
    label: "Cek Status AJU CEISA",
    description:
      "Membaca status dan respons satu nomor AJU 26 digit melalui GET /openapi/status/:nomorAju CEISA. Read-only; tidak mengambil antrean status seluruh perusahaan dan tidak mengirim perubahan.",
    promptSnippet: "Baca status/respons satu nomor AJU dari CEISA secara read-only",
    promptGuidelines: [
      "Gunakan cek_status_aju_ceisa hanya ketika pengguna memberikan nomor AJU 26 digit dan meminta status atau respons CEISA.",
      "Jelaskan bahwa cek_status_aju_ceisa adalah pembacaan API CEISA; hasil kosong atau gagal bukan bukti bahwa dokumen tidak pernah ada.",
    ],
    parameters: Type.Object({
      nomorAju: Type.String({
        minLength: 1,
        description: "Nomor AJU 26 digit; spasi, titik, atau tanda hubung sebagai pemisah diperbolehkan.",
      }),
    }),
    async execute(_toolCallId, params, signal, onUpdate) {
      const nomorAju = normalizeAju(params.nomorAju);
      onUpdate?.({ content: [{ type: "text", text: `Membaca status AJU ${nomorAju} dari CEISA...` }] });
      const client = await clientFromPackageEnv(signal);
      const payload = await client.respon.statusAju(nomorAju);
      const summary = summarizeAjuStatus(payload);
      const output = {
        nomorAju,
        operation: "GET /openapi/status/:nomorAju",
        readOnly: true,
        ...summary,
      };
      return jsonToolResult(output);
    },
  });

  pi.registerTool({
    name: "cek_kurs_ceisa",
    label: "Cek Kurs CEISA",
    description:
      "Membaca kurs pabean CEISA untuk kode valuta dan tanggal opsional melalui endpoint referensi kurs. Read-only dan bukan kurs pasar/forex. Output dibatasi 2000 baris atau 50KB.",
    promptSnippet: "Baca kurs pabean CEISA berdasarkan valuta dan tanggal",
    promptGuidelines: [
      "Gunakan cek_kurs_ceisa ketika pengguna meminta kurs pabean/CEISA; jangan menyebutnya kurs pasar atau kurs bank.",
      "Jika tanggal tidak diberikan, cek_kurs_ceisa meminta kurs terkini yang disediakan CEISA.",
    ],
    parameters: Type.Object({
      kodeValuta: Type.String({
        minLength: 3,
        maxLength: 3,
        description: "Kode valuta tiga huruf, misalnya USD, EUR, atau CNY.",
      }),
      tanggal: Type.Optional(Type.String({
        description: "Tanggal kurs dalam format YYYY-MM-DD; bila kosong, gunakan kurs terkini dari CEISA.",
      })),
    }),
    async execute(_toolCallId, params, signal, onUpdate) {
      const kodeValuta = params.kodeValuta.trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(kodeValuta)) throw new Error("kodeValuta harus terdiri dari tiga huruf, misalnya USD.");
      if (params.tanggal && !/^\d{4}-\d{2}-\d{2}$/.test(params.tanggal)) {
        throw new Error("tanggal harus berformat YYYY-MM-DD.");
      }
      onUpdate?.({ content: [{ type: "text", text: `Membaca kurs ${kodeValuta}${params.tanggal ? ` tanggal ${params.tanggal}` : " terkini"} dari CEISA...` }] });
      const client = await clientFromPackageEnv(signal);
      const payload = await client.referensi.kurs(kodeValuta, params.tanggal);
      return jsonToolResult({
        kodeValuta,
        tanggalDiminta: params.tanggal ?? null,
        operation: "GET referensi kurs CEISA",
        readOnly: true,
        data: payload,
      });
    },
  });
}

async function clientFromPackageEnv(signal?: AbortSignal): Promise<CeisaClient> {
  const config = await loadCeisaConfig();
  const authHeader = parseAuthHeader(config.CEISA_AUTH_HEADER, "CEISA_AUTH_HEADER");
  const referenceAuthHeader = parseAuthHeader(config.CEISA_REFERENCE_AUTH_HEADER, "CEISA_REFERENCE_AUTH_HEADER");
  const requestFetch = ((input: Parameters<typeof globalThis.fetch>[0], init: RequestInit = {}) => globalThis.fetch(input, {
    ...init,
    signal: signal ?? init.signal,
  })) as typeof globalThis.fetch;
  const options: CeisaOptions = {
    baseUrl: required(config, "CEISA_API_URL"),
    username: required(config, "CEISA_USERNAME"),
    password: required(config, "CEISA_PASSWORD"),
    apiKey: optional(config.CEISA_API_KEY),
    origin: optional(config.CEISA_ORIGIN),
    authHeader,
    referenceAuthHeader,
    fetch: requestFetch,
  };
  return new CeisaClient(options);
}

async function loadCeisaConfig(): Promise<Record<string, string | undefined>> {
  const configuredPath = process.env.CEISA_ENV_FILE;
  const envPath = configuredPath
    ? (isAbsolute(configuredPath) ? configuredPath : resolve(process.cwd(), configuredPath))
    : DEFAULT_ENV_PATH;
  let fileValues: Record<string, string> = {};
  try {
    fileValues = parseDotEnv(await readFile(envPath, "utf8"));
  } catch (error) {
    const missingRuntimeConfig = !process.env.CEISA_API_URL || !process.env.CEISA_USERNAME || !process.env.CEISA_PASSWORD;
    if (missingRuntimeConfig) {
      const message = error instanceof Error ? error.message : "tidak dapat dibaca";
      throw new Error(`Konfigurasi CEISA tidak tersedia. Isi environment atau ${envPath} (${message}).`);
    }
  }
  return { ...fileValues, ...process.env };
}

function parseDotEnv(text: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match?.[1]) continue;
    let value = match[2] ?? "";
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    values[match[1]] = value;
  }
  return values;
}

function normalizeAju(input: string): string {
  if (!/^[\d.\s-]+$/.test(input)) throw new Error("Nomor AJU hanya boleh berisi digit dan pemisah spasi, titik, atau tanda hubung.");
  const nomorAju = input.replace(/\D/g, "");
  if (!/^\d{26}$/.test(nomorAju)) throw new Error("Nomor AJU harus tepat 26 digit.");
  return nomorAju;
}

function parseAuthHeader(value: string | undefined, name: string): AuthHeader | undefined {
  if (!value) return undefined;
  if (value === "Authorization" || value === "Authentication") return value;
  throw new Error(`${name} harus Authorization atau Authentication.`);
}

function required(config: Record<string, string | undefined>, name: string): string {
  const value = config[name]?.trim();
  if (!value) throw new Error(`Konfigurasi ${name} belum diisi.`);
  return value;
}

function optional(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

async function exists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function jsonToolResult(value: unknown) {
  const serialized = JSON.stringify(value, null, 2);
  const truncation = truncateHead(serialized, { maxLines: DEFAULT_MAX_LINES, maxBytes: DEFAULT_MAX_BYTES });
  const notice = truncation.truncated
    ? `\n\n[Output dibatasi: ${truncation.outputLines}/${truncation.totalLines} baris, ${formatSize(truncation.outputBytes)}/${formatSize(truncation.totalBytes)}.]`
    : "";
  return {
    content: [{ type: "text" as const, text: truncation.content + notice }],
    details: { result: value, truncation: truncation.truncated ? truncation : undefined },
  };
}
