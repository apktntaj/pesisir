import { getDocumentSchema, validateDocument, type ValidationIssue } from "./schemas";

export type Bc23Review = {
  ready: boolean;
  schemaIssues: ValidationIssue[];
  readinessIssues: ValidationIssue[];
};

/**
 * Creates a local-only BC 2.3 working draft. Empty values are intentional and
 * will be reported by reviewBc23Draft until completed.
 */
export function createBc23Draft(): Record<string, unknown> {
  return {
    asalData: "S",
    asuransi: 0,
    bruto: 0,
    cif: 0,
    fob: 0,
    freight: 0,
    hargaPenyerahan: 0,
    jabatanTtd: "",
    jumlahKontainer: 0,
    kodeAsuransi: "LN",
    kodeDokumen: "23",
    kodeIncoterm: "",
    kodeKantor: "",
    kodeKantorBongkar: "",
    kodePelBongkar: "",
    kodePelMuat: "",
    kodePelTransit: "",
    kodeTps: "",
    kodeTujuanTpb: "",
    kodeTutupPu: "11",
    kodeValuta: "",
    kotaTtd: "",
    namaTtd: "",
    ndpbm: 0,
    netto: 0,
    nik: "",
    nilaiBarang: 0,
    nomorAju: "",
    nomorBc11: "",
    posBc11: "",
    seri: 1,
    subposBc11: "",
    tanggalBc11: "",
    tanggalTiba: "",
    tanggalTtd: "",
    biayaTambahan: 0,
    biayaPengurang: 0,
    barang: [],
    entitas: [],
    kemasan: [],
    dokumen: [],
    pengangkut: [],
  };
}

/** Local structural and completion checks only; CEISA remains authoritative. */
export async function reviewBc23Draft(payload: unknown): Promise<Bc23Review> {
  const schemaIssues = await validateDocument("tpb-bc23", payload);
  const schema = await getDocumentSchema("tpb-bc23");
  const readinessIssues: ValidationIssue[] = [];
  if (schema) findIncompleteRequired(schema, payload, "$", readinessIssues);

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    const nomorAju = record.nomorAju;
    if (typeof nomorAju === "string" && nomorAju !== "" && !/^\d{26}$/.test(nomorAju))
      readinessIssues.push({ path: "$.nomorAju", rule: "format", message: "Nomor AJU harus 26 digit" });
    const bruto = record.bruto;
    const netto = record.netto;
    if (typeof bruto === "number" && typeof netto === "number" && netto > bruto)
      readinessIssues.push({ path: "$.netto", rule: "consistency", message: "Netto tidak boleh melebihi bruto" });
  }

  return {
    ready: schemaIssues.length === 0 && readinessIssues.length === 0,
    schemaIssues,
    readinessIssues: uniqueIssues(readinessIssues),
  };
}

type Schema = Record<string, unknown>;

function findIncompleteRequired(schema: Schema, value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const record = value as Record<string, unknown>;
  const properties = isRecord(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required) ? schema.required.filter((item): item is string => typeof item === "string") : [];

  for (const key of required) {
    const child = record[key];
    const childPath = `${path}.${key}`;
    if (typeof child === "string" && child.trim() === "")
      issues.push({ path: childPath, rule: "readiness", message: "Nilai wajib belum diisi" });
    if (Array.isArray(child) && child.length === 0)
      issues.push({ path: childPath, rule: "readiness", message: "Daftar wajib masih kosong" });
  }

  for (const [key, childSchema] of Object.entries(properties)) {
    if (!(key in record) || !isRecord(childSchema)) continue;
    const child = record[key];
    if (Array.isArray(child)) {
      const candidates = Array.isArray(childSchema.items)
        ? childSchema.items.filter(isRecord)
        : isRecord(childSchema.items) ? [childSchema.items] : [];
      for (let index = 0; index < child.length; index++) {
        if (candidates.length === 1) findIncompleteRequired(candidates[0]!, child[index], `${path}.${key}[${index}]`, issues);
      }
    } else {
      findIncompleteRequired(childSchema, child, `${path}.${key}`, issues);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function uniqueIssues(issues: ValidationIssue[]): ValidationIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.path}|${issue.rule}|${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
