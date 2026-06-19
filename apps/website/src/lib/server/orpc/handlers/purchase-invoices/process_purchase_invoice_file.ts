import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  db,
  type ExtractedInvoiceData,
  eq,
  purchaseInvoiceFile,
  purchaseInvoiceOcrResult,
} from "$lib/server/db";
import { logger } from "$lib/server/logger";
import type { InvoiceVerificationResult } from "$lib/server/mastra/_lib/image-utils";
import { processInvoice } from "$lib/server/mastra/agents/invoice-extraction-agent";
import { verifyInvoice } from "$lib/server/mastra/agents/invoice-verification-agent";
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

    if (file.status === "REVIEWED" || file.status === "PROCESSING") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Unable to process invoice under processing or already reviewed.",
      });
    }

    if (file.status === "REJECTED") {
      await db
        .delete(purchaseInvoiceOcrResult)
        .where(eq(purchaseInvoiceOcrResult.invoiceFileId, file.id));
    }

    await db
      .update(purchaseInvoiceFile)
      .set({ status: "PROCESSING", updatedAt: new Date() })
      .where(eq(purchaseInvoiceFile.id, file.id));

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

      logger.error({ error }, "Failed to retrieve file from storage");
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    let verificationResult: InvoiceVerificationResult;
    try {
      verificationResult = await verifyInvoice(fileBuffer, file.fileType);
    } catch (error) {
      await db
        .update(purchaseInvoiceFile)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(purchaseInvoiceFile.id, file.id));

      logger.error({ error }, "Invoice verification failed");
      throw new ORPCError("BAD_REQUEST", {
        message: "Failed to verify invoice: Please upload clear and correctly formatted invoice",
      });
    }

    const photoUrl = file.objectPath;
    const now = new Date();

    if (!verificationResult.isInvoice) {
      const rejectionReason = verificationResult.rejectionReason ?? "Document is not an invoice";
      db.transaction((tx) => {
        tx.insert(purchaseInvoiceOcrResult)
          .values({
            photoUrl,
            invoiceFileId: file.id,
            rawJson: verificationResult,
            rejectionReason,
            createdAt: now,
          })
          .run();

        tx.update(purchaseInvoiceFile)
          .set({ status: "REJECTED", updatedAt: now })
          .where(eq(purchaseInvoiceFile.id, file.id))
          .run();
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
      await db
        .update(purchaseInvoiceFile)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(purchaseInvoiceFile.id, file.id));

      logger.error({ error }, "Failed to extract data from invoice");
      throw new ORPCError("BAD_REQUEST", {
        message: "Failed to process invoice: Please upload clear and correctly formatted invoice",
      });
    }

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

    return { success: true, status: "SUCCESS" as const };
  });
