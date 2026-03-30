import { ORPCError } from "@orpc/server";
import {
  type ExtractedInvoiceData,
  eq,
  purchaseInvoiceFile,
  purchaseInvoiceOcrResult,
} from "@repo/db";
import { z } from "zod";
import {
  type InvoiceVerificationResult,
  processInvoice,
  verifyInvoice,
} from "$lib/server/ai/invoice-processor";
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

      throw new ORPCError("BAD_REQUEST", {
        message: "Failed to retrieve file from storage",
      });
    }

    let verificationResult: InvoiceVerificationResult;
    try {
      verificationResult = await verifyInvoice(fileBuffer, file.fileType);
    } catch (error) {
      await shopDb
        .update(purchaseInvoiceFile)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(purchaseInvoiceFile.id, file.id));

      throw new ORPCError("BAD_REQUEST", {
        message: "Failed to verify invoice: Please upload clear and correctly formatted invoice",
      });
    }

    const photoUrl = file.objectPath;
    const now = new Date();

    if (!verificationResult.isInvoice) {
      const rejectionReason = verificationResult.rejectionReason ?? "Image is not an invoice";

      await shopDb.transaction(async (tx) => {
        await tx.insert(purchaseInvoiceOcrResult).values({
          photoUrl,
          invoiceFileId: file.id,
          rawJson: verificationResult,
          rejectionReason,
          status: "REJECTED",
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

    let extractedData: ExtractedInvoiceData;
    try {
      extractedData = await processInvoice(fileBuffer, file.fileType);
    } catch (error) {
      await shopDb
        .update(purchaseInvoiceFile)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(purchaseInvoiceFile.id, file.id));

      logger.error({ error }, "Failed to process invoice");
      throw new ORPCError("BAD_REQUEST", {
        message: "Failed to process invoice: Please upload clear and correctly formatted invoice",
      });
    }

    await shopDb.transaction(async (tx) => {
      await tx.insert(purchaseInvoiceOcrResult).values({
        photoUrl,
        invoiceFileId: file.id,
        rawJson: extractedData,
        extractedText: extractedData.rawText ?? null,
        extractedData,
        confidenceScore: extractedData.confidence,
        status: "PROCESSED",
        createdAt: now,
      });

      await tx
        .update(purchaseInvoiceFile)
        .set({ status: "PROCESSED", updatedAt: now })
        .where(eq(purchaseInvoiceFile.id, file.id));
    });

    return { success: true, status: "SUCCESS" as const };
  });
