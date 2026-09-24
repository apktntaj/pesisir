import { clientFromEnv } from "./src/env";

const kodeHs = Bun.argv[2]?.replaceAll(/\D/g, "");
if (!kodeHs) throw new Error("Usage: bun run lartas <kode-HS>");
console.log(JSON.stringify(await clientFromEnv().referensi.lartas(kodeHs), null, 2));
