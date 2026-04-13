import { Agent } from "@mastra/core/agent";
import {
  type InvoiceVerificationResult,
  InvoiceVerificationResultSchema,
  prepareImages,
} from "../_lib/image-utils";

export const invoiceVerificationAgent = new Agent({
  id: "invoice-verification",
  name: "Invoice Verification Agent",
  description:
    "Verifies whether an uploaded image or document is a valid invoice. Returns { isInvoice: boolean, rejectionReason?: string }. Use this agent first before extracting invoice data to avoid processing non-invoice images.",
  model: "openrouter/moonshotai/kimi-k2.5",
  instructions: `You are an image verification assistant. Your task is to determine whether the provided image is an invoice or not.

An invoice is a commercial document issued by a seller to a buyer, relating to a sale transaction, and indicating the products, quantities, and agreed prices for products or services the seller had provided the buyer.

You MUST respond with ONLY a valid JSON object matching this exact schema (no markdown, no explanation, just JSON):
{
  "isInvoice": boolean,
  "rejectionReason": string (optional, only when isInvoice is false)
}

Examples:
- If the image is an invoice: {"isInvoice": true}
- If the image is a photo of a person: {"isInvoice": false, "rejectionReason": "Image appears to be a photo of a person, not an invoice"}
- If the image is too blurry: {"isInvoice": false, "rejectionReason": "Image is too blurry to identify"}`,
});

export async function verifyInvoice(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<InvoiceVerificationResult> {
  const images = await prepareImages(fileBuffer, mimeType);

  const imageParts = images.map((img) => ({
    type: "image" as const,
    image: img,
  }));

  const result = await invoiceVerificationAgent.generate([
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Please verify if the following image(s) contain an invoice.",
        },
        ...imageParts,
      ],
    },
  ]);

  const parsed = JSON.parse(result.text);
  return InvoiceVerificationResultSchema.parse(parsed);
}
