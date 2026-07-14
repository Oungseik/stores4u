import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";
import { env } from "$env/dynamic/private";
import {
  type ExtractedInvoiceData,
  ExtractedInvoiceDataSchema,
} from "$lib/server/db";
import { logger } from "$lib/server/logger";

const OCR_MODEL = "mistral-ocr-latest";

export class InvoiceOcrUnavailableError extends Error {}

/**
 * JSON schema sent to Mistral for structured document annotation.
 * Built from the canonical Zod schema so the two cannot drift.
 * z.toJSONSchema emits a $schema key that Mistral rejects, so strip it.
 */
const invoiceJsonSchema = (() => {
  const { $schema: _omit, ...schema } = z.toJSONSchema(ExtractedInvoiceDataSchema);
  return schema;
})();

const documentAnnotationPrompt = `Extract structured purchase-invoice data from this document.
Rules:
- All monetary amounts are integers in cents (multiply currency value by 100).
- invoice.invoiceDate must be YYYY-MM-DD.
- Omit any field that is not present on the document rather than guessing.
- items is the full line-item list; every item needs productName, quantity, unitCostCents, lineTotalCents.
- confidence is a 0..1 number reflecting how clearly the fields were readable across the whole invoice.`;

function getClient(): Mistral {
  if (!env.MISTRAL_API_KEY) {
    throw new InvoiceOcrUnavailableError("MISTRAL_API_KEY is not configured");
  }
  return new Mistral({ apiKey: env.MISTRAL_API_KEY });
}

function errorMetadata(error: unknown) {
  return {
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    statusCode:
      error && typeof error === "object" && "statusCode" in error
        ? error.statusCode
        : undefined,
  };
}

/**
 * Run a single Mistral OCR call that returns structured invoice JSON.
 * PDFs and images are sent inline as base64 data URLs. No local preprocessing
 * — the file is passed to Mistral as-is.
 */
export async function processInvoice(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<ExtractedInvoiceData> {
  const client = getClient();
  const document = buildDocument(fileBuffer, mimeType);

  let response;
  try {
    response = await client.ocr.process({
      model: OCR_MODEL,
      document,
      documentAnnotationFormat: {
        type: "json_schema",
        jsonSchema: {
          name: "extracted_invoice_data",
          schemaDefinition: invoiceJsonSchema,
          strict: false,
        },
      },
      documentAnnotationPrompt,
    });
  } catch (error) {
    logger.error({ ...errorMetadata(error), mimeType }, "Mistral OCR call failed");
    throw new InvoiceOcrUnavailableError("Mistral OCR request failed", { cause: error });
  }

  const rawText = response.pages.map((p) => p.markdown).join("\n\n");

  if (!response.documentAnnotation) {
    logger.error({ mimeType }, "Mistral OCR returned no document annotation");
    throw new Error("Mistral OCR returned no structured data");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.documentAnnotation);
  } catch (error) {
    logger.error({ err: error }, "Mistral annotation was not valid JSON");
    throw new Error("Mistral OCR returned malformed structured data");
  }

  const result = ExtractedInvoiceDataSchema.safeParse(parsed);
  if (!result.success) {
    logger.error({ error: result.error }, "Mistral annotation failed schema validation");
    throw new Error("Mistral OCR data did not match the invoice schema");
  }

  return { ...result.data, rawText: result.data.rawText ?? rawText };
}

/**
 * Build an inline OCR document input. Mistral accepts data URLs for both PDFs
 * and images, so no remote file lifecycle is needed.
 */
function buildDocument(fileBuffer: Buffer, mimeType: string) {
  const dataUrl = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

  if (mimeType === "application/pdf") {
    return { type: "document_url" as const, documentUrl: dataUrl };
  }

  if (mimeType.startsWith("image/")) {
    return { type: "image_url" as const, imageUrl: dataUrl };
  }

  throw new Error(`Unsupported invoice file type: ${mimeType}`);
}
