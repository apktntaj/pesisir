import { join, resolve } from "node:path";
import { mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { verifyTradeDocuments } from "../lib/trade-document-verification.ts";

const MAX_DOCUMENTS = 6;
const MAX_TEXT_CHARS_PER_DOCUMENT = 250_000;
const DEFAULT_MAX_VISION_PAGES = 12;

export default function verifyTradeDocumentsExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "verify_trade_documents",
    label: "Verify Trade Documents",
    description:
      "Memeriksa konsistensi CIPL/invoice dengan Bill of Lading atau AWB dari PDF berbasis teks. Mengecek kelengkapan, nomor dokumen, package, gross weight, consignee, aritmetika sederhana, dan kronologi tanggal. Hasil adalah flag review, bukan verifikasi legal atau kepatuhan final.",
    promptSnippet: "Periksa konsistensi CIPL/invoice dan B/L/AWB PDF dengan bukti field dan flag review",
    promptGuidelines: [
      "Gunakan verify_trade_documents saat pengguna mengunggah CIPL/invoice bersama B/L atau AWB dan meminta pemeriksaan konsistensi dokumen.",
      "Jangan menyatakan dokumen sah atau tidak sah dari verify_trade_documents; jelaskan temuan sebagai lulus, perlu review, atau belum dapat diperiksa.",
      "Jangan menyimpulkan invoice setelah B/L/AWB sebagai pelanggaran otomatis; verify_trade_documents hanya memberi flag kronologi untuk ditinjau terhadap SOP.",
    ],
    parameters: Type.Object({
      paths: Type.Array(Type.String({ description: "Path PDF lokal. Awalan @ diperbolehkan." }), {
        minItems: 1,
        maxItems: MAX_DOCUMENTS,
        description: "Satu sampai enam PDF CIPL/invoice, packing list, B/L, atau AWB.",
      }),
      includeVisionArtifacts: Type.Optional(Type.Boolean({
        description: "Buat PNG halaman dokumen komersial untuk review visual oleh model/manusia. Gunakan untuk tabel CIPL yang tidak terbaca rapi dari teks.",
      })),
      maxVisionPages: Type.Optional(Type.Integer({
        minimum: 1,
        maximum: 20,
        description: "Maksimum halaman per dokumen komersial yang dirender sebagai PNG; default 12.",
      })),
    }),
    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      const paths = [...new Set(params.paths.map((path) => path.replace(/^@/, "")))];
      if (paths.length !== params.paths.length) {
        throw new Error("Setiap path hanya boleh diberikan satu kali.");
      }

      const files = await Promise.all(
        paths.map(async (requestedPath) => {
          const filePath = resolve(ctx.cwd, requestedPath);
          let fileInfo;
          try {
            fileInfo = await stat(filePath);
          } catch {
            throw new Error(`File tidak ditemukan atau tidak dapat dibaca: ${requestedPath}`);
          }
          if (!fileInfo.isFile()) throw new Error(`Path bukan file: ${requestedPath}`);
          if (!filePath.toLowerCase().endsWith(".pdf")) {
            throw new Error(`Hanya PDF yang didukung: ${requestedPath}`);
          }
          return { requestedPath, filePath };
        }),
      );

      onUpdate?.({ content: [{ type: "text", text: "Mengekstrak teks PDF dan memeriksa konsistensi dokumen..." }] });
      const extracted = await Promise.all(
        files.map(async ({ requestedPath, filePath }) => {
          const result = await pi.exec("pdftotext", ["-layout", filePath, "-"], {
            signal,
            timeout: 30_000,
          });
          if (result.code !== 0) {
            throw new Error(`pdftotext gagal membaca ${requestedPath}: ${result.stderr || "unknown error"}`);
          }
          if (!result.stdout.trim()) {
            throw new Error(`${requestedPath} tidak memiliki teks yang dapat diekstrak. Kemungkinan berupa scan/foto dan memerlukan OCR.`);
          }
          return {
            path: requestedPath,
            text: result.stdout.slice(0, MAX_TEXT_CHARS_PER_DOCUMENT),
            truncated: result.stdout.length > MAX_TEXT_CHARS_PER_DOCUMENT,
          };
        }),
      );

      const report = verifyTradeDocuments(extracted);
      if (extracted.some((item) => item.truncated)) {
        report.limitations.push(
          `Teks dokumen dibatasi pada ${MAX_TEXT_CHARS_PER_DOCUMENT.toLocaleString("id-ID")} karakter per PDF; field setelah batas tersebut mungkin belum diperiksa.`,
        );
      }
      const visionArtifacts: Array<{ documentPath: string; imagePaths: string[] }> = [];
      if (params.includeVisionArtifacts) {
        onUpdate?.({ content: [{ type: "text", text: "Menyiapkan halaman PNG untuk review visual tabel CIPL/invoice..." }] });
        const outputDir = await mkdtemp(join(tmpdir(), "ppjk-vision-review-"));
        const maximumPages = params.maxVisionPages ?? DEFAULT_MAX_VISION_PAGES;
        const commercialDocuments = report.documents.filter((document) =>
          ["cipl", "invoice", "packing_list"].includes(document.facts.documentType),
        );

        for (const [documentIndex, document] of commercialDocuments.entries()) {
          const file = files.find((candidate) => candidate.requestedPath === document.path);
          if (!file) continue;
          const info = await pi.exec("pdfinfo", [file.filePath], { signal, timeout: 15_000 });
          const pagesMatch = info.stdout.match(/^Pages:\s+(\d+)$/m);
          const pageCount = pagesMatch?.[1] ? Number(pagesMatch[1]) : 0;
          if (info.code !== 0 || !Number.isFinite(pageCount) || pageCount < 1) {
            report.limitations.push(`Halaman visual tidak dapat dibuat untuk ${document.path}: pdfinfo gagal membaca jumlah halaman.`);
            continue;
          }

          const imagePaths: string[] = [];
          for (let page = 1; page <= Math.min(pageCount, maximumPages); page += 1) {
            const prefix = join(outputDir, `document-${documentIndex + 1}-page`);
            const rendered = await pi.exec("pdftoppm", ["-png", "-r", "144", "-f", String(page), "-l", String(page), file.filePath, prefix], {
              signal,
              timeout: 30_000,
            });
            if (rendered.code !== 0) {
              report.limitations.push(`Halaman ${page} dari ${document.path} tidak dapat dirender untuk review visual.`);
              continue;
            }
            imagePaths.push(`${prefix}-${page}.png`);
          }
          if (imagePaths.length > 0) visionArtifacts.push({ documentPath: document.path, imagePaths });
          if (pageCount > maximumPages) {
            report.limitations.push(`Review visual ${document.path} dibatasi ke ${maximumPages} dari ${pageCount} halaman pertama.`);
          }
        }
      }

      const flagged = report.findings.filter((item) => item.status === "flag");
      const summary = [
        `Status: ${report.status === "ready" ? "siap untuk review lanjutan" : "perlu review"}`,
        `Dokumen: ${report.documents.map((item) => `${item.path} (${item.facts.documentType}, ${item.facts.confidence})`).join("; ")}`,
        `Temuan: ${report.summary.critical} kritis, ${report.summary.review} perlu review, ${report.summary.info} info, ${report.summary.passed} lulus.`,
        flagged.length > 0 ? `Flag: ${[...new Set(flagged.map((item) => item.title))].join("; ")}` : undefined,
        visionArtifacts.length > 0 ? `Artefak review visual: ${visionArtifacts.flatMap((item) => item.imagePaths).join(", ")}` : undefined,
        "Catatan: hasil ini adalah pemeriksaan konsistensi, bukan verifikasi legal atau kepatuhan final.",
      ].filter((line): line is string => Boolean(line)).join("\n");

      return {
        content: [{ type: "text", text: summary }],
        details: { ...report, visionArtifacts },
      };
    },
  });
}
