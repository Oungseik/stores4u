import { z } from "zod";
import { logger } from "$lib/server/logger";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const InvoiceVerificationResultSchema = z.object({
  isInvoice: z.boolean(),
  rejectionReason: z.string().optional(),
});
export type InvoiceVerificationResult = z.infer<typeof InvoiceVerificationResultSchema>;

export function imageToBase64(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

export async function pdfToImages(pdfBuffer: Buffer): Promise<string[]> {
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

export async function prepareImages(fileBuffer: Buffer, mimeType: string): Promise<string[]> {
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
