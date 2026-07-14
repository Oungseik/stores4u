# src/lib/server/ocr

## Purpose

Purchase-invoice OCR via the Mistral AI API. One `client.ocr.process` call returns structured `ExtractedInvoiceData` (the `@repo/database` schema) using `documentAnnotationFormat: json_schema` + `documentAnnotationPrompt`.

## Ownership

Owns: `mistral-invoice.ts` (`processInvoice(fileBuffer, mimeType)`).
Consumed by: `orpc.purchaseInvoices.processFile` (`src/lib/server/orpc/handlers/purchase-invoices/process_purchase_invoice_file.ts`).

## Local Contracts

- **Single OCR call, structured output**: `processInvoice` sends the file to Mistral and parses `response.documentAnnotation` against `ExtractedInvoiceDataSchema`. No separate verification/chat call and no local "is-it-an-invoice" gate — the user is responsible for uploading a correct invoice.
- **No preprocessing**: the buffer is passed to Mistral as-is. No `pdftoppm`, no PDF-to-image rendering.
- **PDF input**: sent inline as a `data:application/pdf;base64,...` document URL.
- **Image input**: sent inline as a `data:${mimeType};base64,...` image URL.
- **Schema source of truth**: the JSON schema handed to Mistral is generated from `ExtractedInvoiceDataSchema` via `z.toJSONSchema` (zod v4 built-in) with the `$schema` key stripped, so the wire schema cannot drift from the DB schema.
- **Strict mode off**: `jsonSchema.strict = false` because the schema has optional fields. Tighten to `true` only if the schema stabilizes into all-required.
- **Env**: `MISTRAL_API_KEY` is read from SvelteKit's `$env/dynamic/private` and listed in root `turbo.json` `globalEnv`; Turbo strict mode otherwise removes it from the website process. A missing key never blocks build/dev and fails only at `processInvoice` time.
- **Failure surface**: missing configuration and provider/network failures throw `InvoiceOcrUnavailableError`; malformed document output throws a plain `Error`. The handler marks the file `FAILED` and reports service failures separately from bad document output.

## Work Guidance

- Reuse `ExtractedInvoiceDataSchema` from `@repo/database`; do not redefine invoice fields here.
- Keep the JSON schema derived, not hand-written.

## Verification

- `bun run typecheck`.
- `bun src/lib/server/ocr/mistral-invoice.check.ts` checks the structured-output constraints that must agree with database checks.
- Smoke a PDF and image with `MISTRAL_API_KEY` set when changing the provider request.

## Child DOX Index

None.
