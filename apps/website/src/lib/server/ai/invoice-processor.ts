/**
 * @deprecated Use agents from $lib/server/mastra/ instead.
 * - verifyInvoice → $lib/server/mastra/invoice-verification-agent
 * - processInvoice → $lib/server/mastra/invoice-extraction-agent
 * - Image utilities → $lib/server/mastra/_lib/image-utils
 */

import { OpenRouter } from "@openrouter/sdk";
import { type ExtractedInvoiceData, ExtractedInvoiceDataSchema } from "@repo/db";
import { z } from "zod";
import { OPENROUTER_API_KEY } from "$env/static/private";
import { logger } from "../logger";

const openRouter = new OpenRouter({ apiKey: OPENROUTER_API_KEY });

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const INVOICE_EXTRACTION_PROMPT = `You are an invoice data extraction assistant. Extract all relevant information from the provided invoice image(s).

Extract the following information:
1. Supplier information: name (required), contact name, phone, email, address
2. Invoice details: invoice number (required), invoice date (YYYY-MM-DD format), subtotal, VAT/tax, discount, freight/shipping, total, payment terms, notes
3. Line items: product name/description, quantity, unit price, line total, SKU if available

Important rules:
- All monetary amounts must be converted to cents (multiply by 100)
- If a field is not found or unclear, omit it from the response
- Calculate confidence score (0-1) based on how clearly all information was readable
- 1.0 = all fields clearly readable, 0.5 = some fields unclear or missing, 0.0 = completely unreadable
- Invoice date should be in YYYY-MM-DD format
- If there are multiple pages, combine all information into a single response`;

const INVOICE_VERIFICATION_PROMPT = `You are an image verification assistant. Your task is to determine whether the provided image is an invoice or not.

An invoice is a commercial document issued by a seller to a buyer, relating to a sale transaction, and indicating the products, quantities, and agreed prices for products or services the seller had provided the buyer.

Return:
- isInvoice: true if the image is clearly an invoice, false otherwise
- rejectionReason: if isInvoice is false, provide a brief explanation (e.g., "Image appears to be a photo of a person, not an invoice", "Image is too blurry to identify", "Image is a receipt, not an invoice")`;

const INVOICE_SCHEMA = {
  type: "object",
  properties: {
    supplier: {
      type: "object",
      properties: {
        name: { type: "string", description: "Supplier/company name" },
        contactName: { type: "string", description: "Contact person name" },
        phone: { type: "string", description: "Phone number" },
        email: { type: "string", description: "Email address" },
        address: { type: "string", description: "Full address" },
      },
      required: ["name"],
    },
    invoice: {
      type: "object",
      properties: {
        invoiceNumber: { type: "string", description: "Invoice number" },
        invoiceDate: { type: "string", description: "Invoice date in YYYY-MM-DD format" },
        subtotalCents: { type: "number", description: "Subtotal in cents" },
        vatCents: { type: "number", description: "VAT/tax amount in cents" },
        discountCents: { type: "number", description: "Discount amount in cents" },
        freightCents: { type: "number", description: "Freight/shipping cost in cents" },
        totalCents: { type: "number", description: "Total amount in cents" },
        paymentTerms: { type: "string", description: "Payment terms (e.g., Net 30)" },
        notes: { type: "string", description: "Any notes or comments on the invoice" },
      },
      required: ["invoiceDate", "totalCents"],
    },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          productName: { type: "string", description: "Product name or description" },
          description: { type: "string", description: "Additional description" },
          quantity: { type: "number", description: "Quantity ordered" },
          unitCostCents: { type: "number", description: "Unit price in cents" },
          lineTotalCents: { type: "number", description: "Line total in cents" },
          sku: { type: "string", description: "Product SKU or code" },
        },
        required: ["productName", "quantity", "unitCostCents", "lineTotalCents"],
      },
    },
    confidence: {
      type: "number",
      description: "Overall confidence score (0-1)",
      minimum: 0,
      maximum: 1,
    },
    rawText: {
      type: "string",
      description: "Raw OCR-like text extracted from the invoice",
    },
  },
  required: ["supplier", "invoice", "items", "confidence"],
};

const VERIFICATION_SCHEMA = {
  type: "object",
  properties: {
    isInvoice: {
      type: "boolean",
      description: "Whether the image is an invoice or not",
    },
    rejectionReason: {
      type: "string",
      description: "Reason for rejection if the image is not an invoice",
    },
  },
  required: ["isInvoice"],
};

export const InvoiceVerificationResultSchema = z.object({
  isInvoice: z.boolean(),
  rejectionReason: z.string().optional(),
});
export type InvoiceVerificationResult = z.infer<typeof InvoiceVerificationResultSchema>;

function imageToBase64(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

async function pdfToImages(pdfBuffer: Buffer): Promise<string[]> {
  try {
    const { default: sharp } = await import("sharp");

    const pages: string[] = [];
    const pdfInfo = await sharp(pdfBuffer, { pages: -1 }).metadata();

    const totalPages = pdfInfo.pages ?? 1;

    for (let i = 0; i < totalPages; i++) {
      const pngBuffer = await sharp(pdfBuffer, { page: i }).png().toBuffer();

      const base64 = pngBuffer.toString("base64");
      pages.push(`data:image/png;base64,${base64}`);
    }

    return pages;
  } catch (error) {
    logger.error({ error }, "Failed to convert PDF to images");
    throw error;
  }
}

async function callOpenRouter(
  images: string[],
  systemPrompt: string,
  userMessage: string,
  schema: Record<string, unknown>,
  schemaName: string,
): Promise<unknown> {
  const imageParts = images.map((img) => ({
    type: "image_url" as const,
    imageUrl: { url: img },
  }));

  const response = await openRouter.chat.send({
    chatRequest: {
      model: "moonshotai/kimi-k2.5",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text" as const,
              text: userMessage,
            },
            ...imageParts,
          ],
        },
      ],
      responseFormat: {
        type: "json_schema",
        jsonSchema: {
          name: schemaName,
          strict: true,
          schema,
        },
      },
    },
  });

  if ("choices" in response) {
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response content from OpenRouter");
    }

    return JSON.parse(content);
  }

  throw new Error("Unexpected response type from OpenRouter");
}

async function prepareImages(fileBuffer: Buffer, mimeType: string): Promise<string[]> {
  if (fileBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
    const error = new Error(
      `File size exceeds maximum allowed size of ${MAX_FILE_SIZE_BYTES} bytes`,
    );
    logger.error({ fileSize: fileBuffer.byteLength, maxSize: MAX_FILE_SIZE_BYTES }, error.message);
    throw error;
  }

  let images: string[];

  if (mimeType === "application/pdf") {
    images = await pdfToImages(fileBuffer);
  } else if (mimeType.startsWith("image/")) {
    images = [imageToBase64(fileBuffer, mimeType)];
  } else {
    const error = new Error(`Unsupported file type: ${mimeType}`);
    logger.error({ mimeType }, error.message);
    throw error;
  }

  if (images.length === 0) {
    throw new Error("No images could be extracted from the file");
  }

  return images;
}

export async function verifyInvoice(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<InvoiceVerificationResult> {
  const images = await prepareImages(fileBuffer, mimeType);

  const raw = await callOpenRouter(
    images,
    INVOICE_VERIFICATION_PROMPT,
    "Please verify if the following image(s) contain an invoice.",
    VERIFICATION_SCHEMA,
    "invoice_verification",
  );
  return InvoiceVerificationResultSchema.parse(raw);
}

export async function processInvoice(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<ExtractedInvoiceData> {
  const images = await prepareImages(fileBuffer, mimeType);

  const raw = await callOpenRouter(
    images,
    INVOICE_EXTRACTION_PROMPT,
    "Please extract the invoice data from the following image(s).",
    INVOICE_SCHEMA,
    "invoice_extraction",
  );
  return ExtractedInvoiceDataSchema.parse(raw);
}
