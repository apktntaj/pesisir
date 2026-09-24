import { expect, test } from "bun:test";
import { CeisaClient, DocumentValidationError } from "./ceisa";
import { getDocumentSchema, schemaCatalog, validateDocument } from "./schemas";

function fixture(authHeader?: "Authorization" | "Authentication", referenceAuthHeader?: "Authorization" | "Authentication") {
  const calls: Array<{ url: URL; init: RequestInit }> = [];
  let loginCount = 0;
  const fetchMock = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(String(input));
    calls.push({ url, init });
    if (url.pathname.endsWith("/login")) {
      loginCount++;
      return Response.json({ item: { access_token: `access-${loginCount}`, refresh_token: "refresh", expires_in: 300, refresh_expires_in: 3600 } });
    }
    if (url.pathname.endsWith("/update-token"))
      return Response.json({ item: { access_token: "updated", expires_in: 300 } });
    if (url.pathname.endsWith("/download-respon"))
      return new Response(new Uint8Array([37, 80, 68, 70]), { headers: { "Content-Type": "application/pdf" } });
    return Response.json({ status: "OK" });
  }) as typeof fetch;
  const client = new CeisaClient({ baseUrl: "https://example.invalid/", username: "user", password: "secret",
    apiKey: "key", origin: "https://company.invalid", authHeader, referenceAuthHeader, fetch: fetchMock });
  return { client, calls };
}

test("reference routes encode path/query and use documented default bearer headers", async () => {
  const { client, calls } = fixture();
  await client.referensi.kurs("USD", "2026-09-16");
  await client.referensi.lartas("12345678");
  await client.referensi.pelabuhanCari("A/B");
  expect(calls[1]!.url.pathname).toBe("/openapi/kurs/USD");
  expect(calls[1]!.url.searchParams.get("tanggal")).toBe("2026-09-16");
  expect(calls[2]!.url.pathname).toBe("/openapi/hs-lartas");
  expect(calls[2]!.url.searchParams.get("kodeHs")).toBe("12345678");
  expect(calls[3]!.url.pathname).toBe("/openapi/pelabuhan/kata/A%2FB");
  const headers = new Headers(calls[1]!.init.headers);
  expect(headers.get("Authorization")).toBe("Bearer access-1");
  expect(headers.get("Beacukai-Api-Key")).toBe("key");
});

test("alternate authentication header and refresh token are applied", async () => {
  const { client, calls } = fixture("Authentication");
  await client.referensi.lartas("12345678");
  await client.auth.refresh();
  await client.respon.statusAju("01234567890123456789012345");
  expect(new Headers(calls[1]!.init.headers).get("Authentication")).toBe("access-1");
  expect(new Headers(calls[2]!.init.headers).get("Authorization")).toBe("refresh");
  expect(new Headers(calls[3]!.init.headers).get("Authentication")).toBe("updated");
});

test("reference-only header override leaves status on bearer authentication", async () => {
  const { client, calls } = fixture(undefined, "Authentication");
  await client.referensi.kurs("USD");
  await client.respon.statusAju("01234567890123456789012345");
  expect(new Headers(calls[1]!.init.headers).get("Authentication")).toBe("access-1");
  expect(new Headers(calls[2]!.init.headers).get("Authorization")).toBe("Bearer access-1");
});

test("binary response keeps PDF bytes and content type", async () => {
  const { client, calls } = fixture();
  const result = await client.respon.download("reports/file.pdf");
  expect(result.bytes).toEqual(new Uint8Array([37, 80, 68, 70]));
  expect(result.contentType).toBe("application/pdf");
  expect(calls[1]!.url.searchParams.get("path")).toBe("reports/file.pdf");
});

test("document validation blocks incomplete JSON; explicit bypass sends a draft", async () => {
  const { client, calls } = fixture();
  expect(schemaCatalog().length).toBe(17);
  expect((await getDocumentSchema("impor-bc20"))?.type).toBe("object");
  expect((await validateDocument("impor-bc20", {})).some((issue) => issue.rule === "required")).toBe(true);
  await expect(client.dokumen.kirim("impor-bc20", {})).rejects.toBeInstanceOf(DocumentValidationError);
  await expect(client.dokumen.kirim("impor-bc20", {}, { validate: false, isRevision: true })).rejects.toThrow("isRevision");
  await client.dokumen.kirim("ekspor-bc30", { nomorAju: "test" }, { validate: false, isRevision: true });
  const send = calls.at(-1)!;
  expect(send.url.pathname).toBe("/openapi/document");
  expect(send.url.searchParams.get("isFinal")).toBe("false");
  expect(send.url.searchParams.get("isRevision")).toBe("true");
  expect(send.init.method).toBe("POST");
  expect(JSON.parse(String(send.init.body))).toEqual({ nomorAju: "test" });
});

test("schema validator checks nested goods and conditional fields", async () => {
  const goods = await validateDocument("impor-bc20", { barang: [{}] });
  expect(goods.some((issue) => issue.path.startsWith("$.barang[0].") && issue.rule === "required")).toBe(true);
  const exportIssues = await validateDocument("ekspor-bc30", { kodeCaraBayar: "9" });
  expect(exportIssues.some((issue) => issue.path === "$.kodePembayar" && issue.rule === "required")).toBe(true);
});
