import { expect, test } from "bun:test";
import { createBc23Draft, reviewBc23Draft } from "./bc23-draft";
import { summarizeAjuStatus } from "./status";

test("BC 2.3 scaffold is local and explicitly incomplete", async () => {
  const draft = createBc23Draft();
  const review = await reviewBc23Draft(draft);
  expect(draft.kodeDokumen).toBe("23");
  expect(review.schemaIssues.some((issue) => issue.path === "$.nomorAju")).toBe(true);
  expect(review.schemaIssues.some((issue) => issue.path === "$.tanggalTtd")).toBe(true);
  expect(review.ready).toBe(false);
  expect(review.readinessIssues.some((issue) => issue.path === "$.barang")).toBe(true);
  expect(review.readinessIssues.some((issue) => issue.path === "$.nomorAju")).toBe(true);
});

test("BC 2.3 review checks AJU format and weight consistency", async () => {
  const draft = { ...createBc23Draft(), nomorAju: "123", bruto: 10, netto: 11 };
  const review = await reviewBc23Draft(draft);
  expect(review.readinessIssues.some((issue) => issue.path === "$.nomorAju" && issue.rule === "format")).toBe(true);
  expect(review.readinessIssues.some((issue) => issue.path === "$.netto" && issue.rule === "consistency")).toBe(true);
});

test("status summary omits embedded PDF but reports its presence", () => {
  const summary = summarizeAjuStatus({
    status: "Success",
    dataStatus: [{ nomorAju: "1", kodeStatus: "100", ignored: "x" }],
    dataRespon: [{ nomorAju: "1", kodeRespon: "200", Pdf: "very-large-base64", pesan: ["ok"] }],
  });
  expect(summary.statusCount).toBe(1);
  expect(summary.responseCount).toBe(1);
  expect(summary.responses[0]).toEqual({ nomorAju: "1", kodeRespon: "200", pesan: ["ok"], hasPdf: true });
  expect(summary.responses[0]!.Pdf).toBeUndefined();
});
