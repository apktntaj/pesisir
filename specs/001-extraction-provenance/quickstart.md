# Quickstart: Structured Extraction Provenance

## Prerequisites

1. Start local PostgreSQL and migrate `apps/api/`.
2. Start the API on its configured local address.
3. Create one source message and one source document using the existing source-lineage API.

## Scenario A — Persist and retrieve an extraction

1. Submit an extraction for the stored document with:
   - one `SOURCE_BACKED` invoice number and a PDF-page locator;
   - one `INFERRED` currency with confidence;
   - one `UNKNOWN` consignee field; and
   - one `CONFLICTING` gross-weight field with an explanation and evidence locators.
2. Retrieve the extraction.
3. Confirm that all fact states, values where permitted, confidence, conflict explanation, and evidence locators are returned.
4. Confirm that document bytes do not appear in the response.

## Scenario B — Append a human correction

1. Submit a correction for the inferred currency, with a reason and evidence locator.
2. Retrieve the extraction again.
3. Confirm that the original inferred fact remains unchanged and the correction is listed with actor and time.

## Scenario C — Reject invalid writes atomically

1. Attempt an extraction for a nonexistent source document.
2. Attempt a `UNKNOWN` fact with an asserted value.
3. Attempt a correction without a reason.
4. Confirm each response is a validation or not-found error and no new extraction or review is retrievable.

## Scenario D — Verify idempotent retries

1. Submit an extraction with a new idempotency key.
2. Repeat the exact request and key; verify the returned extraction identity is unchanged.
3. Reuse the key with a different payload; verify an idempotency-conflict response.
