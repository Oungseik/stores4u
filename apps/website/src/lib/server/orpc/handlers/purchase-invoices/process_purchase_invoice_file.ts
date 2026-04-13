import { ORPCError } from "@orpc/server";
import {
  type ExtractedInvoiceData,
  eq,
  purchaseInvoiceFile,
  purchaseInvoiceOcrResult,
} from "@repo/db";
import { z } from "zod";
import { logger } from "$lib/server/logger";
import type { InvoiceVerificationResult } from "$lib/server/mastra/_lib/image-utils";
import { extractPdfText } from "$lib/server/mastra/_lib/pdf-text-utils";
import {
  processInvoice,
  processInvoiceFromText,
} from "$lib/server/mastra/agents/invoice-extraction-agent";
import {
  verifyInvoice,
  verifyInvoiceFromText,
} from "$lib/server/mastra/agents/invoice-verification-agent";
import {
  authMiddleware,
  os,
  protectedShopMiddleware,
  shopDbMiddleware,
} from "$lib/server/orpc/base";
import { extractObjectKey, getObject } from "$lib/server/storage";

const input = z.object({
  slug: z.string().min(1).max(100),
  fileId: z.string().min(1),
});

export const processInvoiceFileHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const file = await shopDb.query.purchaseInvoiceFile.findFirst({
      where: { id: input.fileId },
    });

    if (!file) {
      throw new ORPCError("NOT_FOUND", { message: "Invoice file not found" });
    }

    if (file.status === "REVIEWED" || file.status === "PROCESSING") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Unable to process invoice under processing or already reviewed.",
      });
    }

    if (file.status === "REJECTED") {
      await shopDb
        .delete(purchaseInvoiceOcrResult)
        .where(eq(purchaseInvoiceOcrResult.invoiceFileId, file.id));
    }

    await shopDb
      .update(purchaseInvoiceFile)
      .set({ status: "PROCESSING", updatedAt: new Date() })
      .where(eq(purchaseInvoiceFile.id, file.id));

    const objectKey = extractObjectKey(file.objectPath);
    if (!objectKey) {
      await shopDb
        .update(purchaseInvoiceFile)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(purchaseInvoiceFile.id, file.id));
      logger.error("Could not extract object key from path");
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    let fileBuffer: Buffer;
    try {
      fileBuffer = await getObject(objectKey);
    } catch (error) {
      await shopDb
        .update(purchaseInvoiceFile)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(purchaseInvoiceFile.id, file.id));

      logger.error({ error }, "Failed to retrieve file from storage");
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    const isPdf = file.fileType === "application/pdf";

    let pdfFullText: string | null = null;
    if (isPdf) {
      try {
        const pdfResult = await extractPdfText(fileBuffer);
        pdfFullText = pdfResult.text;
      } catch (error) {
        await shopDb
          .update(purchaseInvoiceFile)
          .set({ status: "FAILED", updatedAt: new Date() })
          .where(eq(purchaseInvoiceFile.id, file.id));

        logger.error({ error }, "PDF text extraction failed");
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Failed to extract text from PDF. The file may be corrupted or contain only images.",
        });
      }
    }

    const verificationPromise =
      isPdf && pdfFullText
        ? verifyInvoiceFromText(pdfFullText)
        : verifyInvoice(fileBuffer, file.fileType);

    const verificationResult: InvoiceVerificationResult = await verificationPromise.catch(
      async (error) => {
        await shopDb
          .update(purchaseInvoiceFile)
          .set({ status: "FAILED", updatedAt: new Date() })
          .where(eq(purchaseInvoiceFile.id, file.id));

        logger.error({ error }, "Invoice verification failed");
        throw new ORPCError("BAD_REQUEST", {
          message: "Failed to verify invoice: Please upload clear and correctly formatted invoice",
        });
      },
    );

    const photoUrl = file.objectPath;
    const now = new Date();

    if (!verificationResult.isInvoice) {
      const rejectionReason = verificationResult.rejectionReason ?? "Document is not an invoice";

      await shopDb.transaction(async (tx) => {
        await tx.insert(purchaseInvoiceOcrResult).values({
          photoUrl,
          invoiceFileId: file.id,
          rawJson: verificationResult,
          rejectionReason,
          createdAt: now,
        });

        await tx
          .update(purchaseInvoiceFile)
          .set({ status: "REJECTED", updatedAt: now })
          .where(eq(purchaseInvoiceFile.id, file.id));
      });

      return {
        success: true,
        status: "REJECTED" as const,
        rejectionReason,
      };
    }

    const extraction =
      isPdf && pdfFullText
        ? processInvoiceFromText(pdfFullText)
        : processInvoice(fileBuffer, file.fileType);

    const extractedData: ExtractedInvoiceData = await extraction.catch(async (error) => {
      await shopDb
        .update(purchaseInvoiceFile)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(purchaseInvoiceFile.id, file.id));

      logger.error({ error }, "Failed to extract data from invoice");
      throw new ORPCError("BAD_REQUEST", {
        message: "Failed to process invoice: Please upload clear and correctly formatted invoice",
      });
    });

    await shopDb.transaction(async (tx) => {
      await tx.insert(purchaseInvoiceOcrResult).values({
        photoUrl,
        invoiceFileId: file.id,
        rawJson: extractedData,
        extractedText: extractedData.rawText ?? (isPdf ? pdfFullText : null),
        extractedData,
        confidenceScore: extractedData.confidence,
        createdAt: now,
      });

      await tx
        .update(purchaseInvoiceFile)
        .set({ status: "PROCESSED", updatedAt: now })
        .where(eq(purchaseInvoiceFile.id, file.id));
    });

    return { success: true, status: "SUCCESS" as const };
  });
