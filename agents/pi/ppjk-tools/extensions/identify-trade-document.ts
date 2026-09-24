import { resolve } from "node:path";
import { stat } from "node:fs/promises";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

type DocumentType = "invoice" | "packing_list" | "cipl" | "bill_of_lading" | "air_waybill" | "unknown";
type Confidence = "high" | "medium" | "low";

type SignalGroup = {
  label: string;
  matches: string[];
  score: number;
};

export type TradeDocumentReport = {
  documentType: DocumentType;
  confidence: Confidence;
  extraction: {
    method: "pdftotext";
    charactersRead: number;
  };
  signals: {
    invoice: SignalGroup;
    packingList: SignalGroup;
    billOfLading: SignalGroup;
    airWaybill: SignalGroup;
  };
  reasoning: string;
  limitations: string[];
  nextAction: string;
};

const MAX_TEXT_CHARS = 250_000;

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

function collectSignals(
  text: string,
  label: string,
  weightedTerms: Array<{ term: string; score?: number }>,
): SignalGroup {
  const matches: string[] = [];
  let score = 0;

  for (const { term, score: termScore = 1 } of weightedTerms) {
    if (text.includes(term)) {
      matches.push(term);
      score += termScore;
    }
  }

  return { label, matches, score };
}

/**
 * Deterministically classify extracted trade-document text. This function is
 * exported so it can be tested using labelled document samples without Pi.
 */
export function identifyTradeDocumentText(rawText: string): TradeDocumentReport {
  const text = normalize(rawText.slice(0, MAX_TEXT_CHARS));

  const invoice = collectSignals(text, "Invoice", [
    { term: "commercial invoice", score: 2 },
    { term: "proforma invoice", score: 2 },
    { term: "invoice no", score: 2 },
    { term: "invoice number", score: 2 },
    { term: "unit price" },
    { term: "cif value" },
    { term: "total value" },
    { term: "usd" },
  ]);

  const packingList = collectSignals(text, "Packing list", [
    { term: "packing list", score: 2 },
    { term: "no. of packages", score: 2 },
    { term: "gross weight", score: 2 },
    { term: "net weight", score: 2 },
    { term: "volume" },
    { term: "cbm" },
    { term: "dims" },
    { term: "dimension" },
    { term: "case no" },
  ]);

  const billOfLading = collectSignals(text, "Bill of lading", [
    { term: "bill of lading", score: 3 },
    { term: "ocean bill of lading", score: 3 },
    { term: "b/l no", score: 2 },
    { term: "bl no", score: 2 },
    { term: "vessel", score: 1 },
    { term: "voyage", score: 1 },
    { term: "port of loading", score: 2 },
    { term: "port of discharge", score: 2 },
    { term: "container no", score: 2 },
    { term: "seal no", score: 1 },
    { term: "notify party", score: 1 },
  ]);

  const airWaybill = collectSignals(text, "Air waybill", [
    { term: "air waybill", score: 3 },
    { term: "airway bill", score: 3 },
    { term: "awb no", score: 2 },
    { term: "awb number", score: 2 },
    { term: "flight no", score: 1 },
    { term: "airport of departure", score: 2 },
    { term: "airport of destination", score: 2 },
    { term: "mawb", score: 2 },
    { term: "hawb", score: 2 },
  ]);

  const explicitCipl =
    text.includes("combined commercial invoice and packing list") ||
    text.includes("commercial invoice & packing list") ||
    text.includes("commercial invoice and packing list");

  let documentType: DocumentType = "unknown";
  let confidence: Confidence = "low";
  let reasoning = "Tidak cukup sinyal deterministik untuk mengidentifikasi jenis dokumen.";
  let nextAction = "Minta pengguna memilih jenis dokumen atau unggah dokumen yang lebih jelas.";

  if (airWaybill.score >= 3) {
    const hasAwbNumber =
      airWaybill.matches.includes("awb no") ||
      airWaybill.matches.includes("awb number") ||
      airWaybill.matches.includes("mawb") ||
      airWaybill.matches.includes("hawb");
    documentType = "air_waybill";
    confidence =
      airWaybill.matches.includes("air waybill") ||
      airWaybill.matches.includes("airway bill") || hasAwbNumber
        ? "high"
        : "medium";
    reasoning = "Ditemukan sinyal transport udara yang khas Air Waybill.";
    nextAction = "Ekstrak nomor AWB, airline/flight, bandara asal/tujuan, shipper, consignee, package, dan berat bila tersedia.";
  } else if (explicitCipl) {
    documentType = "cipl";
    confidence = "high";
    reasoning = "Judul CIPL eksplisit ditemukan, didukung oleh sinyal invoice dan packing list.";
    nextAction = "Lanjutkan ekstraksi field CIPL; tidak perlu meminta invoice dan packing list terpisah kecuali SOP mensyaratkannya.";
  } else if (invoice.score >= 3 && packingList.score >= 3) {
    documentType = "cipl";
    confidence = "medium";
    reasoning = "Sinyal invoice dan packing list sama-sama kuat dalam satu dokumen, tetapi judul CIPL eksplisit tidak ditemukan.";
    nextAction = "Tampilkan sebagai kemungkinan CIPL dan minta konfirmasi pengguna sebelum diproses sebagai dokumen gabungan.";
  } else if (billOfLading.score >= 3) {
    const hasBillNumber = billOfLading.matches.includes("b/l no") || billOfLading.matches.includes("bl no");
    const hasVessel = billOfLading.matches.includes("vessel");
    const hasVoyageAndContainer =
      billOfLading.matches.includes("voyage") && billOfLading.matches.includes("container no");

    documentType = "bill_of_lading";
    confidence =
      billOfLading.matches.includes("bill of lading") ||
      billOfLading.matches.includes("ocean bill of lading") ||
      (hasBillNumber && hasVessel) ||
      (hasBillNumber && hasVoyageAndContainer)
        ? "high"
        : "medium";
    reasoning = "Ditemukan sinyal transport laut/angkutan yang khas Bill of Lading.";
    nextAction = "Ekstrak nomor B/L, carrier, vessel/voyage, pelabuhan muat/bongkar, container, dan seal bila tersedia.";
  } else if (invoice.score >= 3) {
    documentType = "invoice";
    confidence = invoice.matches.includes("commercial invoice") || invoice.matches.includes("proforma invoice")
      ? "high"
      : "medium";
    reasoning = "Ditemukan sinyal nilai komersial yang khas invoice tanpa sinyal packing list yang cukup.";
    nextAction = "Tandai packing list sebagai belum terdeteksi dan minta dokumen tersebut bila diperlukan oleh workflow.";
  } else if (packingList.score >= 3) {
    documentType = "packing_list";
    confidence = packingList.matches.includes("packing list") ? "high" : "medium";
    reasoning = "Ditemukan sinyal kemasan, berat, atau dimensi tanpa sinyal invoice yang cukup.";
    nextAction = "Tandai invoice sebagai belum terdeteksi dan minta dokumen tersebut bila diperlukan oleh workflow.";
  }

  return {
    documentType,
    confidence,
    extraction: { method: "pdftotext", charactersRead: Math.min(rawText.length, MAX_TEXT_CHARS) },
    signals: { invoice, packingList, billOfLading, airWaybill },
    reasoning,
    limitations: [
      "Klasifikasi memakai aturan deterministik atas teks yang diekstrak; ini bukan verifikasi legal dokumen.",
      "PDF hasil scan/foto membutuhkan OCR. Bila teks tidak dapat diekstrak, hasil harus ditinjau manusia.",
      "Jenis dokumen ditentukan dari isi, bukan hanya nama file atau judul dokumen.",
    ],
    nextAction,
  };
}

export default function identifyTradeDocumentExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "identify_trade_document",
    label: "Identify Trade Document",
    description:
      "Mengidentifikasi PDF sebagai invoice, packing list, CIPL, Bill of Lading, Air Waybill, atau unknown menggunakan aturan deterministik atas teks PDF. Mengembalikan sinyal/bukti dan tidak memverifikasi keabsahan legal, HS, tarif, atau LARTAS.",
    parameters: Type.Object({
      path: Type.String({ description: "Path PDF lokal yang akan diperiksa." }),
    }),
    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      const requestedPath = params.path.replace(/^@/, "");
      const filePath = resolve(ctx.cwd, requestedPath);

      let fileInfo;
      try {
        fileInfo = await stat(filePath);
      } catch {
        throw new Error(`File tidak ditemukan atau tidak dapat dibaca: ${params.path}`);
      }
      if (!fileInfo.isFile()) throw new Error(`Path bukan file: ${params.path}`);
      if (!filePath.toLowerCase().endsWith(".pdf")) {
        throw new Error("Versi awal identify_trade_document hanya mendukung PDF. Konversi gambar/scan ke PDF atau tambahkan OCR terlebih dahulu.");
      }

      onUpdate?.({ content: [{ type: "text", text: "Mengekstrak teks PDF dan menjalankan aturan klasifikasi..." }] });
      const extraction = await pi.exec("pdftotext", ["-layout", filePath, "-"], {
        signal,
        timeout: 30_000,
      });

      if (extraction.code !== 0) {
        throw new Error(`pdftotext gagal membaca PDF: ${extraction.stderr || "unknown error"}`);
      }
      if (!extraction.stdout.trim()) {
        throw new Error("PDF tidak memiliki teks yang dapat diekstrak. Kemungkinan dokumen berupa scan/foto dan memerlukan OCR.");
      }

      const report = identifyTradeDocumentText(extraction.stdout);
      const evidence = [
        ...report.signals.invoice.matches,
        ...report.signals.packingList.matches,
        ...report.signals.billOfLading.matches,
        ...report.signals.airWaybill.matches,
      ];
      const summary = [
        `Jenis dokumen: ${report.documentType}`,
        `Confidence: ${report.confidence}`,
        `Alasan: ${report.reasoning}`,
        `Sinyal: ${evidence.length > 0 ? evidence.join(", ") : "tidak ada"}`,
        `Tindakan: ${report.nextAction}`,
      ].join("\n");

      return {
        content: [{ type: "text", text: summary }],
        details: report,
      };
    },
  });
}
