import { execFile as execFileCb } from "child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import { z } from "zod";
import { logger } from "$lib/server/logger";

const execFile = promisify(execFileCb);

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_PDF_PAGES = 5;

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
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "pdf-"));
  const pdfPath = path.join(tmpDir, "input.pdf");
  const outputPrefix = path.join(tmpDir, "page");

  try {
    await writeFile(pdfPath, pdfBuffer);

    await execFile("pdftoppm", [
      "-png",
      "-r",
      "200",
      "-l",
      String(MAX_PDF_PAGES),
      pdfPath,
      outputPrefix,
    ]);

    const files = (await readdir(tmpDir)).filter((f) => f.endsWith(".png")).sort();

    const images = await Promise.all(
      files.map(async (f) => {
        const buf = await readFile(path.join(tmpDir, f));
        return `data:image/png;base64,${buf.toString("base64")}`;
      }),
    );

    return images;
  } catch (error) {
    logger.error({ error }, "Failed to convert PDF to images");
    throw error;
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
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
