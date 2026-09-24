type Json = Record<string, unknown>;

export type AjuStatusSummary = {
  statusCount: number;
  responseCount: number;
  statuses: Json[];
  responses: Json[];
  sourceStatus?: unknown;
  sourceMessage?: unknown;
};

/** Summarizes CEISA status data without printing embedded/base64 PDF content. */
export function summarizeAjuStatus(payload: unknown): AjuStatusSummary {
  const root = isRecord(payload) ? payload : {};
  const statuses = rows(root.dataStatus).map((item) => pick(item, [
    "nomorAju", "kodeStatus", "nomorDaftar", "tanggalDaftar", "waktuStatus", "keterangan",
  ]));
  const responses = rows(root.dataRespon).map((item) => ({
    ...pick(item, [
      "nomorAju", "kodeRespon", "nomorDaftar", "tanggalDaftar", "nomorRespon",
      "tanggalRespon", "waktuRespon", "waktuStatus", "keterangan", "pesan",
    ]),
    hasPdf: hasPdf(item),
  }));
  return {
    statusCount: statuses.length,
    responseCount: responses.length,
    statuses,
    responses,
    ...(root.status !== undefined ? { sourceStatus: root.status } : {}),
    ...(root.message !== undefined ? { sourceMessage: root.message } : {}),
  };
}

function rows(value: unknown): Json[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function pick(record: Json, keys: string[]): Json {
  const result: Json = {};
  for (const key of keys) if (record[key] !== undefined) result[key] = record[key];
  return result;
}

function hasPdf(record: Json): boolean {
  const value = record.Pdf ?? record.pdf;
  return typeof value === "string" ? value.length > 0 : value !== undefined && value !== null;
}

function isRecord(value: unknown): value is Json {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
