import manifest from "../schemas/manifest.json";
import ekspor from "../schemas/ekspor-bc30.json";
import impor from "../schemas/impor-bc20.json";
import imporTakBerwujud from "../schemas/impor-tidak-berwujud.json";
import ftz1 from "../schemas/ftz01-1.json";
import ftz2 from "../schemas/ftz01-2.json";
import ftz3 from "../schemas/ftz01-3.json";
import plb16 from "../schemas/plb-bc16.json";
import plb28 from "../schemas/plb-bc28.json";
import plb33 from "../schemas/plb-bc33.json";
import p3bet from "../schemas/plb-p3bet.json";
import tpb23 from "../schemas/tpb-bc23.json";
import tpb25 from "../schemas/tpb-bc25.json";
import tpb261 from "../schemas/tpb-bc261.json";
import tpb262 from "../schemas/tpb-bc262.json";
import tpb27 from "../schemas/tpb-bc27.json";
import tpb40 from "../schemas/tpb-bc40.json";
import tpb41 from "../schemas/tpb-bc41.json";

export type DocumentKind =
  | "ekspor-bc30" | "impor-bc20" | "impor-tidak-berwujud"
  | "ftz01-1" | "ftz01-2" | "ftz01-3"
  | "plb-bc16" | "plb-bc28" | "plb-bc33" | "plb-p3bet"
  | "tpb-bc23" | "tpb-bc25" | "tpb-bc261" | "tpb-bc262" | "tpb-bc27" | "tpb-bc40" | "tpb-bc41";

export type ValidationIssue = { path: string; rule: string; message: string };
type Schema = Record<string, unknown>;
type ManifestEntry = { kind: string; title: string; original?: string; capture?: string; status: "parsed" | "unavailable"; reason?: string };
const schemas: Record<DocumentKind, Schema> = {
  "ekspor-bc30": ekspor, "impor-bc20": impor, "impor-tidak-berwujud": imporTakBerwujud,
  "ftz01-1": ftz1, "ftz01-2": ftz2, "ftz01-3": ftz3,
  "plb-bc16": plb16, "plb-bc28": plb28, "plb-bc33": plb33, "plb-p3bet": p3bet,
  "tpb-bc23": tpb23, "tpb-bc25": tpb25, "tpb-bc261": tpb261,
  "tpb-bc262": tpb262, "tpb-bc27": tpb27, "tpb-bc40": tpb40, "tpb-bc41": tpb41,
};

export function schemaCatalog(): ManifestEntry[] { return manifest as ManifestEntry[]; }

export async function getDocumentSchema(jenis: DocumentKind): Promise<Schema | null> {
  const entry = (manifest as ManifestEntry[]).find((item) => item.kind === jenis);
  if (!entry) throw new Error(`Unknown document kind: ${jenis}`);
  if (entry.status !== "parsed") return null;
  return schemas[jenis];
}

export async function validateDocument(jenis: DocumentKind, payload: unknown): Promise<ValidationIssue[]> {
  const schema = await getDocumentSchema(jenis);
  if (!schema) throw new Error(`No reliable JSON Schema available for ${jenis}; use validate:false only after checking the source capture`);
  const issues: ValidationIssue[] = [];
  validateValue(schema, payload, "$", issues);
  return issues;
}

// Deliberately limited to the draft-07 keywords present in the extracted object schemas.
// Unknown keywords are ignored; CEISA remains the authoritative validator.
function validateValue(schema: Schema, value: unknown, path: string, issues: ValidationIssue[]): void {
  if (schema.const !== undefined && value !== schema.const) issue("const", "Must equal documented constant");
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) issue("enum", "Value is not in documented choices");
  const type = schema.type;
  if (typeof type === "string" && !matches(type, value)) {
    issue("type", `Expected ${type}`);
    return;
  }
  if (typeof value === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength) issue("minLength", "Too short");
    if (typeof schema.maxLength === "number" && value.length > schema.maxLength) issue("maxLength", "Too long");
    if (typeof schema.pattern === "string") {
      try { if (!new RegExp(schema.pattern).test(value)) issue("pattern", "Does not match pattern"); }
      catch { /* Broken snapshot pattern: do not reject a valid CEISA document. */ }
    }
    if (schema.format === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) issue("format", "Expected yyyy-mm-dd date");
  }
  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum) issue("minimum", "Below minimum");
    if (typeof schema.maximum === "number" && value > schema.maximum) issue("maximum", "Above maximum");
    if (typeof schema.multipleOf === "number" && schema.multipleOf > 0 &&
      Math.abs(value / schema.multipleOf - Math.round(value / schema.multipleOf)) > 1e-7) issue("multipleOf", "Invalid decimal increment");
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) issue("minItems", "Too few items");
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) issue("maxItems", "Too many items");
    if (schema.items && typeof schema.items === "object" && !Array.isArray(schema.items))
      value.forEach((item, index) => validateValue(schema.items as Schema, item, `${path}[${index}]`, issues));
    if (Array.isArray(schema.items)) {
      const candidates = (schema.items as unknown[]).filter((candidate): candidate is Schema =>
        !!candidate && typeof candidate === "object" && !Array.isArray(candidate));
      value.forEach((item, index) => {
      if (candidates.length === 1) validateValue(candidates[0]!, item, `${path}[${index}]`, issues);
      // CEISA lists several entity/document roles under items. Accept any matching role,
      // since their order is not guaranteed by the archive.
      else if (candidates.length > 1) {
        const attempts = candidates.map((candidate) => {
          const candidateIssues: ValidationIssue[] = [];
          validateValue(candidate, item, `${path}[${index}]`, candidateIssues);
          return candidateIssues;
        });
        const best = attempts.sort((a, b) => a.length - b.length)[0];
        if (best?.length) issues.push(...best);
      }
      });
    }
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (Array.isArray(schema.required)) for (const key of schema.required) {
      if (typeof key === "string" && !(key in record)) issues.push({ path: `${path}.${key}`, rule: "required", message: "Required field missing" });
    }
    if (schema.properties && typeof schema.properties === "object") for (const [key, child] of Object.entries(schema.properties)) {
      if (key in record && child && typeof child === "object") validateValue(child as Schema, record[key], `${path}.${key}`, issues);
    }
    if (schema.additionalProperties === false && schema.properties && typeof schema.properties === "object")
      for (const key of Object.keys(record)) if (!(key in schema.properties))
        issues.push({ path: `${path}.${key}`, rule: "additionalProperties", message: "Undocumented field" });
    if (schema.dependencies && typeof schema.dependencies === "object" && !Array.isArray(schema.dependencies)) {
      for (const [key, dependency] of Object.entries(schema.dependencies)) if (key in record) {
        if (Array.isArray(dependency)) {
          for (const required of dependency) if (typeof required === "string" && !(required in record))
            issues.push({ path: `${path}.${required}`, rule: "dependencies", message: `Required when ${key} is present` });
        } else if (dependency && typeof dependency === "object") {
          validateValue(dependency as Schema, value, path, issues);
        }
      }
    }
  }
  if (Array.isArray(schema.allOf)) for (const child of schema.allOf)
    if (child && typeof child === "object") validateValue(child as Schema, value, path, issues);
  if (schema.if && typeof schema.if === "object") {
    const conditionIssues: ValidationIssue[] = [];
    validateValue(schema.if as Schema, value, path, conditionIssues);
    const branch = conditionIssues.length === 0 ? schema.then : schema.else;
    if (branch && typeof branch === "object") validateValue(branch as Schema, value, path, issues);
  }

  function issue(rule: string, message: string) { issues.push({ path, rule, message }); }
}

function matches(type: string, value: unknown): boolean {
  switch (type) {
    case "object": return !!value && typeof value === "object" && !Array.isArray(value);
    case "array": return Array.isArray(value);
    case "string": return typeof value === "string";
    case "number": return typeof value === "number" && Number.isFinite(value);
    case "integer": return typeof value === "number" && Number.isInteger(value);
    case "boolean": return typeof value === "boolean";
    case "null": return value === null;
    default: return true;
  }
}
