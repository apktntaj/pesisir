import assert from "node:assert/strict";
import test from "node:test";
import { extractDocumentFacts, verifyTradeDocuments } from "../lib/trade-document-verification.ts";

const cipl = `
COMBINED COMMERCIAL INVOICE AND PACKING LIST
Seller: PT Example Export
Consignee: PT Import Example
Invoice No: INV-2026-001
Invoice Date: 10/03/2026
Currency: USD
Invoice Total: USD 1,000.00
QTY UNIT CIF Value
No. of Packages: 10
Gross Weight: 100.0 KGS
Net Weight: 90.0 KGS
Widget A 10 PCS 100.00 1,000.00
`;

const awb = `
AIR WAYBILL
AWB No: 123-45678901
Consignee: PT Import Example
Airport of Departure: Singapore
Airport of Destination: Jakarta
Flight Date: 12/03/2026
No. of Packages: 10
Gross Weight: 100 KGS
`;

test("extractDocumentFacts recognizes a CIPL and normalizes its core fields", () => {
  const facts = extractDocumentFacts(cipl);
  assert.equal(facts.documentType, "cipl");
  assert.equal(facts.invoiceNumber?.value, "INV-2026-001");
  assert.equal(facts.invoiceDate?.value, "10/03/2026");
  assert.equal(facts.packageCount?.value, 10);
  assert.equal(facts.grossWeightKg?.value, 100);
  assert.equal(facts.invoiceTotal?.value, 1000);
  assert.equal(facts.lineArithmetic.length, 1);
});

test("line arithmetic resolves comma decimal ambiguity from CIPL tables", () => {
  const facts = extractDocumentFacts(`
COMMERCIAL INVOICE
QTY UNIT CIF Value
Sensor 1 SET 850,000 850,00
`);

  assert.deepEqual(facts.lineArithmetic[0], {
    quantity: 1,
    unitPrice: 850,
    lineAmount: 850,
    source: "Sensor 1 SET 850,000 850,00",
    page: 1,
  });
});

test("verifyTradeDocuments passes matching commercial and air transport data", () => {
  const report = verifyTradeDocuments([
    { path: "commercial.pdf", text: cipl },
    { path: "transport.pdf", text: awb },
  ]);

  assert.equal(report.status, "ready");
  assert.equal(report.documents[1].facts.documentType, "air_waybill");
  assert.ok(report.findings.some((item) => item.id === "package-count" && item.status === "pass"));
  assert.ok(report.findings.some((item) => item.id === "gross-weight" && item.status === "pass"));
  assert.ok(report.findings.some((item) => item.id === "date-chronology" && item.status === "pass"));
});

test("verifyTradeDocuments flags a later invoice date and a package mismatch without declaring a legal failure", () => {
  const report = verifyTradeDocuments([
    { path: "commercial.pdf", text: cipl.replace("10/03/2026", "15/03/2026") },
    { path: "transport.pdf", text: awb.replace("No. of Packages: 10", "No. of Packages: 12") },
  ]);

  assert.equal(report.status, "needs_review");
  const chronology = report.findings.find((item) => item.id === "date-chronology" && item.status === "flag");
  assert.match(chronology?.message ?? "", /bukan pelanggaran otomatis/i);
  assert.ok(report.findings.some((item) => item.id === "package-count" && item.status === "flag"));
});
