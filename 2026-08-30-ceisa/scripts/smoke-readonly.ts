import { clientFromEnv } from "../src/env";

const client = clientFromEnv();
const results: Record<string, string> = {};

try {
  await client.auth.login();
  results.login = "ok";
} catch (error) {
  results.login = error instanceof Error ? error.message : "failed";
  console.log(JSON.stringify(results, null, 2));
  process.exit(1);
}

for (const [name, read] of [
  ["kurs", () => client.referensi.kurs("USD")],
  ...(Bun.env.CEISA_SMOKE_HS ? [["lartas", () => client.referensi.lartas(Bun.env.CEISA_SMOKE_HS!)]] as const : []),
] as const) {
  try {
    await read();
    results[name] = "ok";
  } catch (error) {
    results[name] = error instanceof Error ? error.message : "failed";
  }
}
console.log(JSON.stringify(results, null, 2));
if (Object.values(results).some((status) => status !== "ok")) process.exit(1);
