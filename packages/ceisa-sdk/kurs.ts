import { clientFromEnv } from "./src/env";

const kodeValuta = Bun.argv[2]?.trim().toUpperCase();
const tanggal = Bun.argv[3];
if (!kodeValuta) throw new Error("Usage: bun run kurs <kode-valuta> [yyyy-mm-dd]");
if (tanggal && !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) throw new Error("Tanggal harus berformat yyyy-mm-dd");

console.log(JSON.stringify(await clientFromEnv().referensi.kurs(kodeValuta, tanggal), null, 2));
