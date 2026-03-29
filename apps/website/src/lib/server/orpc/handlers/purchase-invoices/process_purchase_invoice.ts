import { ORPCError } from "@orpc/server";
import {
  eq,
  type InvoiceExtractionResult,
  purchaseInvoiceFile,
  purchaseInvoiceOcrResult,
} from "@repo/db";
import { z } from "zod";
import { processInvoice } from "$lib/server/ai/invoice-processor";
import { logger } from "$lib/server/logger";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";
import { extractObjectKey, getObject } from "$lib/server/storage";

const input = z.object({
  slug: z.string().min(1).max(100),
  fileId: z.string().min(1),
});

export const processInvoiceFileHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const file = await shopDb.query.purchaseInvoiceFile.findFirst({
      where: { id: input.fileId },
    });

    if (!file) {
      throw new ORPCError("NOT_FOUND", { message: "Invoice file not found" });
    }

    if (file.status !== "UPLOADED") {
      throw new ORPCError("BAD_REQUEST", {
        message: `File status must be UPLOADED, current status: ${file.status}`,
      });
    }

    await shopDb
      .update(purchaseInvoiceFile)
      .set({ status: "PROCESSING", updatedAt: new Date() })
      .where(eq(purchaseInvoiceFile.id, file.id));

    let result: InvoiceExtractionResult;
    try {
      const objectKey = extractObjectKey(file.objectPath);
      if (!objectKey) {
        logger.error("Could not extract object key from path");
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }

      const fileBuffer = await getObject(objectKey);
      result = await processInvoice(fileBuffer, file.fileType);
    } catch (error) {
      await shopDb
        .update(purchaseInvoiceFile)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(purchaseInvoiceFile.id, file.id));

      throw new ORPCError("BAD_REQUEST", {
        message: "Failed to process invoice: Please upload clear and correctly formatted invoice",
      });
    }

    const photoUrl = file.objectPath;
    const now = new Date();

    if (result.status === "rejected") {
      const ocrResultData = {
        photoUrl,
        invoiceFileId: file.id,
        rawJson: result,
        rejectionReason: result.rejectionReason,
        status: "REJECTED" as const,
        createdAt: now,
      };

      await shopDb.transaction(async (tx) => {
        const ocrResult = await tx.insert(purchaseInvoiceOcrResult).values(ocrResultData);

        if (!ocrResult.rowsAffected) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to save OCR result",
          });
        }

        await tx
          .update(purchaseInvoiceFile)
          .set({ status: "REJECTED", updatedAt: now })
          .where(eq(purchaseInvoiceFile.id, file.id));
      });

      return {
        success: true,
        status: "REJECTED" as const,
        rejectionReason: result.rejectionReason,
      };
    }

    const ocrResultData = {
      photoUrl,
      invoiceFileId: file.id,
      rawJson: result,
      extractedText: result.rawText ?? null,
      extractedData: result,
      confidenceScore: result.confidence,
      status: "PROCESSED" as const,
      createdAt: now,
    };

    await shopDb.transaction(async (tx) => {
      const ocrResult = await tx.insert(purchaseInvoiceOcrResult).values(ocrResultData);

      if (!ocrResult.rowsAffected) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to save OCR result",
        });
      }

      await tx
        .update(purchaseInvoiceFile)
        .set({ status: "PROCESSED", updatedAt: now })
        .where(eq(purchaseInvoiceFile.id, file.id));
    });

    return { success: true, status: "SUCCESS" as const };
  });
