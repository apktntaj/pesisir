// Mechanical extraction from the local GitBook snapshot. Run with: bun run schemas:extract
import { mkdir } from "node:fs/promises";

const archive = await Bun.file(new URL("../CEISA40_ARCHIVE.md", import.meta.url)).text();
const pages = archive.split(/\n---\n\n## Source page\n/);
const mapping: Record<string, string> = {
  "ekspor-bc30": "Kirim Dokumen Ekspor",
  "impor-bc20": "Kirim Dokumen Impor",
  "impor-tidak-berwujud": "Kirim Dokumen Impor Barang Tidak Berwujud*",
  "ftz01-1": "Kirim Dokumen FTZ01-1",
  "ftz01-2": "Kirim Dokumen FTZ01-2",
  "ftz01-3": "Kirim Dokumen FTZ01-3",
  "plb-bc16": "Kirim Dokumen PLB BC 1.6",
  "plb-bc28": "Kirim Dokumen PLB BC 2.8",
  "plb-bc33": "Kirim Dokumen PLB BC 3.3",
  "plb-p3bet": "Kirim Dokumen PLB P3BET",
  "tpb-bc23": "Kirim Dokumen TPB - BC 2.3",
  "tpb-bc25": "Kirim Dokumen TPB - BC 2.5",
  "tpb-bc261": "Kirim Dokumen TPB - BC 2.6.1",
  "tpb-bc262": "Kirim Dokumen TPB - BC 2.6.2",
  "tpb-bc27": "Kirim Dokumen TPB - BC 2.7",
  "tpb-bc40": "Kirim Dokumen TPB - BC 4.0",
  "tpb-bc41": "Kirim Dokumen TPB - BC 4.1",
};

type Entry = { kind: string; title: string; original?: string; capture?: string; status: "parsed" | "unavailable"; reason?: string };
const manifest: Entry[] = [];
const output = new URL("../schemas/", import.meta.url);
await mkdir(output, { recursive: true });

for (const [kind, title] of Object.entries(mapping)) {
  const page = pages.find((candidate) => candidate.includes(`\n# ${title}\n`));
  if (!page) throw new Error(`Missing page: ${title}`);
  const original = page.match(/- Original: (\S+)/)?.[1];
  const capture = page.match(/- Archive capture: (\S+)/)?.[1];
  const entry: Entry = { kind, title, original, capture, status: "unavailable" };
  const fences = [...page.matchAll(/```[^\n]*\n([\s\S]*?)\n```/g)].map((match) => match[1]!);
  const block = fences.find((fence) => fence.includes('"$schema"'));
  if (!block) {
    entry.reason = "No JSON Schema fence in rendered capture";
    manifest.push(entry);
    continue;
  }
  const start = block.indexOf("{");
  const end = block.lastIndexOf("}");
  if (start < 0 || end <= start) {
    entry.reason = "Schema fence has no JSON object";
    manifest.push(entry);
    continue;
  }
  try {
    const schema = JSON.parse(block.slice(start, end + 1));
    if (!schema || typeof schema !== "object") throw new Error("Not an object");
    // FTZ/TPB fences sometimes wrap the actual schema in Declaration.
    const actual = schema.Declaration && typeof schema.Declaration === "object" ? schema.Declaration : schema;
    if (actual.type !== "object" || !actual.properties) throw new Error("No object schema/properties");
    await Bun.write(new URL(`${kind}.json`, output), `${JSON.stringify(actual, null, 2)}\n`);
    entry.status = "parsed";
  } catch (error) {
    entry.reason = error instanceof Error ? error.message : "Invalid JSON";
  }
  manifest.push(entry);
}

await Bun.write(new URL("manifest.json", output), `${JSON.stringify(manifest, null, 2)}\n`);
for (const entry of manifest) console.log(`${entry.kind}: ${entry.status}${entry.reason ? ` (${entry.reason})` : ""}`);
