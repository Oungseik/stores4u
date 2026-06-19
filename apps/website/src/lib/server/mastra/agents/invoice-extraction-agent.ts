import { Agent } from "@mastra/core/agent";
import { type ExtractedInvoiceData, ExtractedInvoiceDataSchema } from "$lib/server/db";
import { prepareImages } from "../_lib/image-utils";

export const invoiceExtractionAgent = new Agent({
  id: "invoice-extraction",
  name: "Invoice Extraction Agent",
  description:
    "Extracts structured data from invoice images or PDFs. Returns supplier details, invoice metadata, line items with quantities and costs, and a confidence score. Only use this agent after the invoice has been verified as a valid invoice.",
  model: "openrouter/google/gemini-3.1-pro-preview",
  instructions: `You are an invoice data extraction assistant. Extract all relevant information from the provided invoice image(s).You MUST respond with ONLY a valid JSON object matching this exact schema (no markdown, no explanation, just JSON):
{
  "supplier": {
    "name": "string (required)",
    "contactName": "string (optional)",
    "phone": "string (optional - primary phone number)",
    "phone2": "string (optional - secondary/additional phone number)",
    "email": "string (optional)",
    "address": "string (optional)"
  },
  "invoice": {
    "invoiceNumber": "string (optional)",
    "invoiceDate": "YYYY-MM-DD",
    "subtotalCents": "number (subtotal in cents, multiply by 100)",
    "vatCents": "number (VAT/tax in cents)",
    "discountCents": "number (discount in cents)",
    "freightCents": "number (freight/shipping in cents)",
    "totalCents": "number (total in cents, required)",
    "paymentTerms": "string",
    "notes": "string"
  },
  "items": [
    {
      "productName": "string (required)",
      "description": "string (optional)",
      "quantity": "number (required)",
      "unitCostCents": "number (required, in cents)",
      "lineTotalCents": "number (required, in cents)",
      "sku": "string (optional)"
    }
  ],
  "confidence": "number (0-1, required)",
  "rawText": "string (raw OCR-like text, optional)"
}

Important rules:
- All monetary amounts must be converted to cents (multiply by 100)
- If a field is not found or unclear, omit it from the response
- Calculate confidence score (0-1) based on how clearly all information was readable
- 1.0 = all fields clearly readable, 0.5 = some fields unclear or missing, 0.0 = completely unreadable
- Invoice date should be in YYYY-MM-DD format
- If there are multiple pages, combine all information into a single response`,
});

export async function processInvoice(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<ExtractedInvoiceData> {
  const images = await prepareImages(fileBuffer, mimeType);

  const imageParts = images.map((img) => ({
    type: "image" as const,
    image: img,
  }));

  const result = await invoiceExtractionAgent.generate([
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Please extract the invoice data from the following image(s).",
        },
        ...imageParts,
      ],
    },
  ]);

  const parsed = JSON.parse(result.text);
  return ExtractedInvoiceDataSchema.parse(parsed);
}
