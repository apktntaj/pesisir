export type VerificationDocumentType =
  | "invoice"
  | "packing_list"
  | "cipl"
  | "bill_of_lading"
  | "air_waybill"
  | "unknown";

export type FindingSeverity = "critical" | "review" | "info";
export type FindingStatus = "pass" | "flag" | "not_checked";

export type Evidence<T> = {
  value: T;
  source: string;
  page: number;
};

export type DocumentFacts = {
  documentType: VerificationDocumentType;
  confidence: "high" | "medium" | "low";
  invoiceNumber?: Evidence<string>;
  invoiceDate?: Evidence<string>;
  shipmentDate?: Evidence<string>;
  transportNumber?: Evidence<string>;
  seller?: Evidence<string>;
  consignee?: Evidence<string>;
  grossWeightKg?: Evidence<number>;
  netWeightKg?: Evidence<number>;
  packageCount?: Evidence<number>;
  invoiceTotal?: Evidence<number>;
  currency?: Evidence<string>;
  incoterm?: Evidence<string>;
  portOfLoading?: Evidence<string>;
  portOfDischarge?: Evidence<string>;
  lineArithmetic: Array<{
    quantity: number;
    unitPrice: number;
    lineAmount: number;
    source: string;
    page: number;
  }>;
};

export type DocumentInput = {
  path: string;
  text: string;
};

export type DocumentReview = {
  path: string;
  facts: DocumentFacts;
};

export type DocumentFinding = {
  id: string;
  severity: FindingSeverity;
  status: FindingStatus;
  title: string;
  message: string;
  evidence: Array<{ path: string; source: string; page: number }>;
};

export type TradeDocumentVerificationReport = {
  status: "ready" | "needs_review";
  documents: DocumentReview[];
  findings: DocumentFinding[];
  summary: {
    critical: number;
    review: number;
    info: number;
    passed: number;
  };
  limitations: string[];
};

type TextLine = { text: string; page: number };

const DATE_CAPTURE =
  "(\\d{4}[-/.]\\d{1,2}[-/.]\\d{1,2}|\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}|\\d{1,2}\\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\s+\\d{2,4})";
const NUMBER_CAPTURE = "([A-Z0-9][A-Z0-9./_-]{2,})";

function linesWithPages(text: string): TextLine[] {
  return text.split("\f").flatMap((pageText, pageIndex) =>
    pageText.split(/\r?\n/).map((line) => ({ text: line.trim(), page: pageIndex + 1 })),
  );
}

function normalizeText(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeParty(value: string): string {
  return normalizeText(value)
    .replace(/\b(?:LTD|LIMITED|INC|LLC|CO|CORP|CORPORATION|PT|CV)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(value: string): number | undefined {
  let candidate = value.replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
  if (!candidate || !/\d/.test(candidate)) return undefined;

  const commas = [...candidate.matchAll(/,/g)].map((match) => match.index ?? 0);
  const dots = [...candidate.matchAll(/\./g)].map((match) => match.index ?? 0);
  const lastComma = commas.at(-1) ?? -1;
  const lastDot = dots.at(-1) ?? -1;

  if (lastComma !== -1 && lastDot !== -1) {
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? /\./g : /,/g;
    candidate = candidate.replace(thousands, "").replace(decimal, ".");
  } else if (lastComma !== -1 || lastDot !== -1) {
    const separator = lastComma !== -1 ? "," : ".";
    const parts = candidate.split(separator);
    if (parts.length > 2 || (parts[1]?.length === 3 && parts.length === 2)) {
      candidate = parts.join("");
    } else {
      candidate = `${parts[0]}.${parts[1] ?? ""}`;
    }
  }

  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function firstMatch(lines: TextLine[], expressions: RegExp[]): Evidence<string> | undefined {
  for (const line of lines) {
    for (const expression of expressions) {
      const match = line.text.match(expression);
      if (match?.[1]) {
        return { value: match[1].trim(), source: line.text, page: line.page };
      }
    }
  }
  return undefined;
}

function labeledText(lines: TextLine[], labels: string[]): Evidence<string> | undefined {
  const expression = new RegExp(`^\\s*(?:${labels.join("|")})\\s*:?\\s*(.*)$`, "i");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.text.match(expression);
    if (!match) continue;

    const value = match[1].trim() || lines.slice(index + 1).find((candidate) => candidate.text)?.text;
    if (value) return { value, source: line.text || value, page: line.page };
  }
  return undefined;
}

function weight(lines: TextLine[], label: string): Evidence<number> | undefined {
  const expression = new RegExp(
    `${label}\\s*:?\\s*([0-9][0-9, .]*)\\s*(KGS?|KILOGRAMS?|LBS?|POUNDS?)?`,
    "i",
  );
  for (const line of lines) {
    const match = line.text.match(expression);
    if (!match?.[1]) continue;
    const numeric = parseNumber(match[1]);
    if (numeric === undefined) continue;
    const unit = (match[2] ?? "KG").toUpperCase();
    const kilograms = unit.startsWith("LB") || unit.startsWith("POUND") ? numeric * 0.45359237 : numeric;
    return { value: kilograms, source: line.text, page: line.page };
  }
  return undefined;
}

function packageCount(lines: TextLine[]): Evidence<number> | undefined {
  const expressions = [
    /(?:total\s+)?(?:no\.?\s*of\s*)?(?:packages?|pkgs?|cartons?|ctns?|cases?|boxes?)\s*:?\s*(\d+)/i,
    /(?:total\s*)?(\d+)\s*(?:packages?|pkgs?|cartons?|ctns?|cases?|boxes?)\b/i,
  ];
  for (const line of lines) {
    for (const expression of expressions) {
      const match = line.text.match(expression);
      const numeric = match?.[1] ? Number(match[1]) : undefined;
      if (numeric !== undefined && Number.isFinite(numeric)) {
        return { value: numeric, source: line.text, page: line.page };
      }
    }
  }
  return undefined;
}

function money(lines: TextLine[]): Evidence<number> | undefined {
  const expression = /(?:invoice\s+total|grand\s+total|total\s+(?:invoice\s+)?(?:amount|value))\s*:?\s*(?:USD|EUR|IDR|CNY|JPY|SGD)?\s*([0-9][0-9, .]*)/i;
  for (const line of lines) {
    const match = line.text.match(expression);
    if (!match?.[1]) continue;
    const numeric = parseNumber(match[1]);
    if (numeric !== undefined) return { value: numeric, source: line.text, page: line.page };
  }
  return undefined;
}

function dateAsUtc(value: string): number | undefined {
  const normalized = value.trim();
  let year: number;
  let month: number;
  let day: number;

  const iso = normalized.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else {
    const numeric = normalized.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (numeric) {
      day = Number(numeric[1]);
      month = Number(numeric[2]);
      year = Number(numeric[3]);
      if (year < 100) year += 2000;
    } else {
      const named = Date.parse(`${normalized} UTC`);
      return Number.isNaN(named) ? undefined : named;
    }
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  const result = Date.UTC(year, month - 1, day);
  const check = new Date(result);
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day
    ? result
    : undefined;
}

function arithmeticNumberCandidates(value: string): number[] {
  const candidates = new Set<number>();
  const standard = parseNumber(value);
  if (standard !== undefined) candidates.add(standard);

  // CIPL sering memakai koma sebagai desimal tiga digit (contoh 850,000),
  // sementara angka total memakai dua digit. Simpan kedua interpretasi dan
  // pilih pasangan yang paling konsisten secara aritmetika.
  const compact = value.replace(/\s/g, "");
  if (/^-?\d+[,.]\d+$/.test(compact)) {
    const decimal = Number(compact.replace(",", "."));
    if (Number.isFinite(decimal)) candidates.add(decimal);
  }
  return [...candidates];
}

function findLineArithmetic(lines: TextLine[]): DocumentFacts["lineArithmetic"] {
  const candidates: DocumentFacts["lineArithmetic"] = [];
  const hasInvoiceTable = lines.some((line) => /\bqty\b/i.test(line.text)) &&
    lines.some((line) => /(?:unit\s+price|cif\s+value|amount)/i.test(line.text));
  if (!hasInvoiceTable) return candidates;

  const expression = /(?:^|\s)([0-9][0-9,.]*)\s+(?:PCS?|UNITS?|SETS?|KGS?)\s+([0-9][0-9,.]*)\s+([0-9][0-9,.]*)(?:\s|$)/i;
  for (const line of lines) {
    const match = line.text.match(expression);
    if (!match) continue;
    const quantity = parseNumber(match[1]);
    if (quantity === undefined) continue;

    const combinations = arithmeticNumberCandidates(match[2]).flatMap((unitPrice) =>
      arithmeticNumberCandidates(match[3]).map((lineAmount) => ({
        unitPrice,
        lineAmount,
        difference: Math.abs(quantity * unitPrice - lineAmount),
      })),
    );
    const best = combinations.sort((left, right) => left.difference - right.difference)[0];
    if (!best) continue;
    candidates.push({ quantity, unitPrice: best.unitPrice, lineAmount: best.lineAmount, source: line.text, page: line.page });
  }
  return candidates;
}

export function classifyDocumentText(text: string): Pick<DocumentFacts, "documentType" | "confidence"> {
  const normalized = text.toLowerCase().replace(/\s+/g, " ");
  const invoiceScore = ["commercial invoice", "invoice no", "invoice number", "unit price", "invoice total"]
    .filter((term) => normalized.includes(term)).length;
  const packingScore = ["packing list", "gross weight", "net weight", "no. of packages", "number of packages"]
    .filter((term) => normalized.includes(term)).length;
  const billScore = ["bill of lading", "ocean bill of lading", "b/l no", "bl no", "vessel", "voyage", "container no", "port of loading"]
    .filter((term) => normalized.includes(term)).length;
  const awbScore = ["air waybill", "airway bill", "awb no", "awb number", "flight no", "airport of departure"]
    .filter((term) => normalized.includes(term)).length;

  const ciplExplicit = /combined commercial invoice\s*(?:and|&)\s*packing list|commercial invoice\s*(?:and|&)\s*packing list/.test(normalized);
  if (ciplExplicit) return { documentType: "cipl", confidence: "high" };
  if (awbScore >= 2) return { documentType: "air_waybill", confidence: normalized.includes("air waybill") || normalized.includes("airway bill") ? "high" : "medium" };
  if (billScore >= 2) return { documentType: "bill_of_lading", confidence: normalized.includes("bill of lading") ? "high" : "medium" };
  if (invoiceScore >= 2 && packingScore >= 2) return { documentType: "cipl", confidence: "medium" };
  if (invoiceScore >= 2) return { documentType: "invoice", confidence: normalized.includes("commercial invoice") ? "high" : "medium" };
  if (packingScore >= 2) return { documentType: "packing_list", confidence: normalized.includes("packing list") ? "high" : "medium" };
  return { documentType: "unknown", confidence: "low" };
}

export function extractDocumentFacts(text: string): DocumentFacts {
  const lines = linesWithPages(text);
  const classification = classifyDocumentText(text);
  const invoiceNumber = firstMatch(lines, [
    new RegExp(`(?:invoice)\\s*(?:no\\.?|number|#)\\s*[:#]?\\s*${NUMBER_CAPTURE}`, "i"),
  ]);
  const invoiceDate = firstMatch(lines, [new RegExp(`(?:invoice\\s+date|date)\\s*:?\\s*${DATE_CAPTURE}`, "i")]);
  const transportNumber = firstMatch(lines, [
    new RegExp(`(?:b\\/?l|bill\\s+of\\s+lading|air\\s*waybill|airway\\s*bill|awb)\\s*(?:no\\.?|number|#)?\\s*[:#]?\\s*${NUMBER_CAPTURE}`, "i"),
  ]);
  const shipmentDate = firstMatch(lines, [
    new RegExp(`(?:on\\s+board\\s+date|date\\s+of\\s+shipment|shipment\\s+date|flight\\s+date|date\\s+of\\s+issue)\\s*:?\\s*${DATE_CAPTURE}`, "i"),
  ]);
  const currency = firstMatch(lines, [/(?:currency)\s*:?\s*(USD|EUR|IDR|CNY|JPY|SGD|GBP|AUD|CAD)\b/i]) ??
    firstMatch(lines, [/\b(USD|EUR|IDR|CNY|JPY|SGD|GBP|AUD|CAD)\b/i]);
  const incoterm = firstMatch(lines, [/\b(EXW|FCA|FAS|FOB|CFR|CIF|CPT|CIP|DAP|DPU|DDP)\b(?:\s+[A-Z][A-Z .,-]+)?/i]);

  return {
    ...classification,
    invoiceNumber,
    invoiceDate,
    shipmentDate,
    transportNumber,
    seller: labeledText(lines, ["seller", "exporter", "shipper"]),
    consignee: labeledText(lines, ["consignee", "buyer", "importer"]),
    grossWeightKg: weight(lines, "gross\\s+weight"),
    netWeightKg: weight(lines, "net\\s+weight"),
    packageCount: packageCount(lines),
    invoiceTotal: money(lines),
    currency,
    incoterm,
    portOfLoading: labeledText(lines, ["port\\s+of\\s+loading", "place\\s+of\\s+receipt", "airport\\s+of\\s+departure"]),
    portOfDischarge: labeledText(lines, ["port\\s+of\\s+discharge", "place\\s+of\\s+delivery", "airport\\s+of\\s+destination"]),
    lineArithmetic: findLineArithmetic(lines),
  };
}

function finding(
  id: string,
  severity: FindingSeverity,
  status: FindingStatus,
  title: string,
  message: string,
  evidence: Array<{ path: string; source: string; page: number }> = [],
): DocumentFinding {
  return { id, severity, status, title, message, evidence };
}

function present<T>(documents: DocumentReview[], getter: (facts: DocumentFacts) => Evidence<T> | undefined) {
  return documents.flatMap((document) => {
    const value = getter(document.facts);
    return value ? [{ path: document.path, ...value }] : [];
  });
}

function compareTextField(
  id: string,
  title: string,
  documents: DocumentReview[],
  getter: (facts: DocumentFacts) => Evidence<string> | undefined,
): DocumentFinding | undefined {
  const values = present(documents, getter);
  const unique = new Set(values.map((item) => normalizeParty(item.value)));
  if (values.length < 2) return undefined;
  if (unique.size === 1) {
    return finding(id, "info", "pass", title, "Nilai yang tersedia konsisten antar dokumen.", values);
  }
  return finding(id, "review", "flag", title, "Nilai yang tersedia berbeda antar dokumen; periksa apakah perbedaan tersebut memang sesuai peran pihak/transaksi.", values);
}

function compareNumberField(
  id: string,
  title: string,
  documents: DocumentReview[],
  getter: (facts: DocumentFacts) => Evidence<number> | undefined,
  tolerance: (left: number, right: number) => boolean,
): DocumentFinding | undefined {
  const values = present(documents, getter);
  if (values.length < 2) return undefined;
  const first = values[0].value;
  if (values.every((item) => tolerance(first, item.value))) {
    return finding(id, "info", "pass", title, "Nilai yang tersedia konsisten antar dokumen.", values);
  }
  return finding(id, "review", "flag", title, "Nilai yang tersedia berbeda antar dokumen dan perlu ditinjau.", values);
}

export function verifyTradeDocuments(inputs: DocumentInput[]): TradeDocumentVerificationReport {
  const documents = inputs.map((input) => ({ path: input.path, facts: extractDocumentFacts(input.text) }));
  const findings: DocumentFinding[] = [];
  const commercial = documents.filter((document) => ["invoice", "cipl"].includes(document.facts.documentType));
  const transport = documents.filter((document) => ["bill_of_lading", "air_waybill"].includes(document.facts.documentType));

  if (commercial.length === 0) {
    findings.push(finding("commercial-document", "critical", "flag", "Invoice/CIPL belum terdeteksi", "Unggah atau konfirmasi dokumen invoice atau CIPL sebelum melanjutkan pemeriksaan nilai dan barang."));
  } else {
    findings.push(finding("commercial-document", "info", "pass", "Invoice/CIPL terdeteksi", "Setidaknya satu dokumen komersial telah teridentifikasi."));
  }

  if (transport.length === 0) {
    findings.push(finding("transport-document", "critical", "flag", "B/L atau AWB belum terdeteksi", "Unggah atau konfirmasi dokumen pengangkutan sebelum melanjutkan pemeriksaan konsistensi pengiriman."));
  } else {
    findings.push(finding("transport-document", "info", "pass", "Dokumen pengangkutan terdeteksi", "Setidaknya satu B/L atau AWB telah teridentifikasi."));
  }

  for (const document of transport) {
    if (!document.facts.transportNumber) {
      findings.push(finding("transport-number", "review", "flag", "Nomor B/L/AWB tidak terbaca", `Nomor dokumen pengangkutan tidak berhasil diekstrak dari ${document.path}.`, []));
    }
  }

  for (const document of commercial) {
    if (!document.facts.invoiceNumber) {
      findings.push(finding("invoice-number", "review", "flag", "Nomor invoice tidak terbaca", `Nomor invoice tidak berhasil diekstrak dari ${document.path}.`, []));
    }
    if (!document.facts.invoiceTotal) {
      findings.push(finding("invoice-total", "info", "not_checked", "Total invoice belum diekstrak", `Total invoice tidak dapat dicek otomatis dari ${document.path}.`, []));
    }
  }

  const packageCheck = compareNumberField(
    "package-count",
    "Jumlah package",
    documents,
    (facts) => facts.packageCount,
    (left, right) => left === right,
  );
  if (packageCheck) findings.push(packageCheck);

  const grossWeightCheck = compareNumberField(
    "gross-weight",
    "Gross weight",
    documents,
    (facts) => facts.grossWeightKg,
    (left, right) => Math.abs(left - right) <= Math.max(0.5, left * 0.01),
  );
  if (grossWeightCheck) findings.push(grossWeightCheck);

  const consigneeCheck = compareTextField("consignee", "Consignee/buyer", documents, (facts) => facts.consignee);
  if (consigneeCheck) findings.push(consigneeCheck);

  for (const document of commercial) {
    const arithmetic = document.facts.lineArithmetic;
    if (arithmetic.length === 0) continue;
    const mismatches = arithmetic.filter((line) => {
      const expected = line.quantity * line.unitPrice;
      return Math.abs(expected - line.lineAmount) > Math.max(0.01, expected * 0.005);
    });

    if (mismatches.length === 0) {
      findings.push(finding("line-arithmetic", "info", "pass", "Aritmetika baris invoice", `${arithmetic.length} baris tabel yang dapat diekstrak konsisten secara aritmetika.`, []));
    } else {
      findings.push(finding("line-arithmetic", "review", "flag", "Aritmetika baris invoice", `${mismatches.length} dari ${arithmetic.length} baris tabel yang diekstrak tidak konsisten; lakukan review visual pada tabel sumber.`, mismatches.slice(0, 10).map((line) => ({ path: document.path, source: line.source, page: line.page }))));
    }
  }

  for (const invoice of commercial) {
    if (!invoice.facts.invoiceDate) continue;
    for (const shipment of transport) {
      if (!shipment.facts.shipmentDate) continue;
      const invoiceTime = dateAsUtc(invoice.facts.invoiceDate.value);
      const shipmentTime = dateAsUtc(shipment.facts.shipmentDate.value);
      if (invoiceTime === undefined || shipmentTime === undefined) {
        findings.push(finding("date-chronology", "info", "not_checked", "Kronologi tanggal", "Format tanggal tidak dapat dibandingkan otomatis.", [
          { path: invoice.path, source: invoice.facts.invoiceDate.source, page: invoice.facts.invoiceDate.page },
          { path: shipment.path, source: shipment.facts.shipmentDate.source, page: shipment.facts.shipmentDate.page },
        ]));
      } else if (invoiceTime > shipmentTime) {
        const days = Math.round((invoiceTime - shipmentTime) / 86_400_000);
        findings.push(finding("date-chronology", "review", "flag", "Kronologi tanggal", `Invoice diterbitkan ${days} hari setelah tanggal pengangkutan. Ini bukan pelanggaran otomatis; konfirmasi terhadap SOP dan transaksi.`, [
          { path: invoice.path, source: invoice.facts.invoiceDate.source, page: invoice.facts.invoiceDate.page },
          { path: shipment.path, source: shipment.facts.shipmentDate.source, page: shipment.facts.shipmentDate.page },
        ]));
      } else {
        findings.push(finding("date-chronology", "info", "pass", "Kronologi tanggal", "Tanggal invoice tidak melewati tanggal pengangkutan yang tersedia.", [
          { path: invoice.path, source: invoice.facts.invoiceDate.source, page: invoice.facts.invoiceDate.page },
          { path: shipment.path, source: shipment.facts.shipmentDate.source, page: shipment.facts.shipmentDate.page },
        ]));
      }
    }
  }

  const summary = findings.reduce(
    (result, item) => {
      if (item.status === "pass") result.passed += 1;
      else if (item.severity === "critical") result.critical += 1;
      else if (item.severity === "review") result.review += 1;
      else result.info += 1;
      return result;
    },
    { critical: 0, review: 0, info: 0, passed: 0 },
  );

  return {
    status: summary.critical > 0 || summary.review > 0 ? "needs_review" : "ready",
    documents,
    findings,
    summary,
    limitations: [
      "Hasil adalah pemeriksaan konsistensi berbasis teks, bukan verifikasi keabsahan legal atau penetapan kepatuhan.",
      "PDF scan/foto tanpa text layer belum didukung; gunakan OCR atau dokumen PDF yang dapat diekstrak teksnya.",
      "Tanggal invoice setelah B/L/AWB hanya ditandai untuk review; hal tersebut tidak otomatis merupakan pelanggaran.",
      "Kesesuaian uraian barang, HS, tarif, LARTAS, dan perizinan belum diperiksa oleh tool ini.",
    ],
  };
}
