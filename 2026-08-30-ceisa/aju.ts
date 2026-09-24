import { clientFromEnv } from "./src/env";

const idPerusahaan = Bun.env.CEISA_NPWP ?? Bun.env.NPWP;
if (!idPerusahaan) throw new Error("Missing CEISA_NPWP or NPWP");
const payload = await clientFromEnv().respon.statusPerusahaan(idPerusahaan);
const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
const byAju = new Map<string, {
  nomorAju: string; statusCount: number; responseCount: number;
  latestStatus: unknown; latestResponse: unknown;
}>();

for (const [field, count] of [["dataStatus", "statusCount"], ["dataRespon", "responseCount"]] as const) {
  const rows = Array.isArray(record[field]) ? record[field] : [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const nomorAju = item.nomorAju;
    if (typeof nomorAju !== "string" || !nomorAju) continue;
    const summary = byAju.get(nomorAju) ?? {
      nomorAju, statusCount: 0, responseCount: 0, latestStatus: null, latestResponse: null,
    };
    summary[count]++;
    if (field === "dataStatus") summary.latestStatus = item.keterangan ?? null;
    else summary.latestResponse = item.keterangan ?? null;
    byAju.set(nomorAju, summary);
  }
}
console.log(JSON.stringify({ count: byAju.size, aju: [...byAju.values()] }, null, 2));
