import { PDFParse } from "pdf-parse";
import { logger } from "$lib/server/logger";

export const MAX_PDF_PAGES = 10;
export const MAX_PDF_TEXT_CHARS = 100_000;

export interface PdfTextResult {
  text: string;
  pageCount: number;
}

export async function extractPdfText(pdfBuffer: Buffer): Promise<PdfTextResult> {
  const parser = new PDFParse({ data: pdfBuffer });
  const textResult = await parser.getText();

  const pageCount = textResult.total;

  if (pageCount > MAX_PDF_PAGES) {
    await parser.destroy();
    throw new Error(`PDF has ${pageCount} pages, maximum is ${MAX_PDF_PAGES}`);
  }

  let text = textResult.text;

  await parser.destroy();

  if (text.length > MAX_PDF_TEXT_CHARS) {
    text = text.slice(0, MAX_PDF_TEXT_CHARS);
    logger.warn({ textLength: text.length }, "PDF text truncated to max chars");
  }

  if (text.trim().length === 0) {
    throw new Error("PDF contains no extractable text. It may be a scanned image-only PDF.");
  }

  return { text, pageCount };
}

export function sampleTextForVerification(text: string, sampleSize = 1000): string {
  if (text.length <= sampleSize * 3) return text;

  const start = text.slice(0, sampleSize);
  const mid = text.slice(
    Math.floor(text.length / 2) - Math.floor(sampleSize / 2),
    Math.floor(text.length / 2) + Math.floor(sampleSize / 2),
  );
  const end = text.slice(-sampleSize);

  return `[BEGINNING OF DOCUMENT]\n${start}\n\n[MIDDLE OF DOCUMENT]\n${mid}\n\n[END OF DOCUMENT]\n${end}`;
}
