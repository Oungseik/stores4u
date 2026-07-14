import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  db,
  type ExtractedInvoiceData,
  and,
  eq,
  inArray,
  purchaseInvoiceFile,
  purchaseInvoiceOcrResult,
} from "$lib/server/db";
import { logger } from "$lib/server/logger";
import {
  InvoiceOcrUnavailableError,
  processInvoice,
} from "$lib/server/ocr/mistral-invoice";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { extractObjectKey, getObject } from "$lib/server/storage";

const input = z.object({
  fileId: z.string().min(1),
});

export const processInvoiceFileHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const file = await db.query.purchaseInvoiceFile.findFirst({
      where: { id: input.fileId },
    });

    if (!file) {
      throw new ORPCError("NOT_FOUND", { message: "Invoice file not found" });
    }

    const claimed = db.transaction((tx) => {
      const row = tx
        .update(purchaseInvoiceFile)
        .set({ status: "PROCESSING", updatedAt: new Date() })
        .where(
          and(
            eq(purchaseInvoiceFile.id, file.id),
            inArray(purchaseInvoiceFile.status, ["UPLOADED", "FAILED", "REJECTED"]),
          ),
        )
        .returning({ id: purchaseInvoiceFile.id })
        .get();

      if (row) {
        tx.delete(purchaseInvoiceOcrResult)
          .where(eq(purchaseInvoiceOcrResult.invoiceFileId, file.id))
          .run();
      }

      return row;
    });

    if (!claimed) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invoice is already processed, processing, or reviewed.",
      });
    }

    const objectKey = extractObjectKey(file.objectPath);
    if (!objectKey) {
      await db
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
      await db
        .update(purchaseInvoiceFile)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(purchaseInvoiceFile.id, file.id));

      logger.error({ err: error }, "Failed to retrieve file from storage");
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    const photoUrl = file.objectPath;
    const now = new Date();

    let extractedData: ExtractedInvoiceData;
    try {
      extractedData = await processInvoice(fileBuffer, file.fileType);
    } catch (error) {
      await db
        .update(purchaseInvoiceFile)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(purchaseInvoiceFile.id, file.id));

      logger.error(
        { errorType: error instanceof Error ? error.constructor.name : typeof error },
        "Failed to extract data from invoice",
      );
      if (error instanceof InvoiceOcrUnavailableError) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Invoice OCR is unavailable. Check the server configuration and connection.",
        });
      }
      throw new ORPCError("BAD_REQUEST", {
        message: "Failed to process invoice: Please upload clear and correctly formatted invoice",
      });
    }

    try {
      db.transaction((tx) => {
        tx.insert(purchaseInvoiceOcrResult)
          .values({
            photoUrl,
            invoiceFileId: file.id,
            rawJson: extractedData,
            extractedText: extractedData.rawText ?? null,
            extractedData,
            confidenceScore: extractedData.confidence,
            createdAt: now,
          })
          .run();

        tx.update(purchaseInvoiceFile)
          .set({ status: "PROCESSED", updatedAt: now })
          .where(eq(purchaseInvoiceFile.id, file.id))
          .run();
      });
    } catch (error) {
      await db
        .update(purchaseInvoiceFile)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(purchaseInvoiceFile.id, file.id));
      logger.error({ err: error }, "Failed to save extracted invoice data");
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to save extracted invoice data",
      });
    }

    return { success: true, status: "SUCCESS" as const };
  });
