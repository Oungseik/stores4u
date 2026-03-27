import { ORPCError } from "@orpc/server";
import { eq, purchaseInvoiceFile, purchaseInvoiceOcrResult } from "@repo/db";
import { z } from "zod";
import { type ExtractedInvoiceData, processInvoice } from "$lib/server/ai/invoice-processor";
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

    let extractedData: ExtractedInvoiceData;
    try {
      const objectKey = extractObjectKey(file.objectPath);
      if (!objectKey) {
        logger.error("Could not extract object key from path");
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }

      const fileBuffer = await getObject(objectKey);
      extractedData = await processInvoice(fileBuffer, file.fileType);
    } catch (error) {
      await shopDb
        .update(purchaseInvoiceFile)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(purchaseInvoiceFile.id, file.id));

      throw new ORPCError("BAD_REQUEST", {
        message: "Failed to process invoice: Please upload clear and correctly formatted invoice",
      });
    }

    const extractedSupplierName = extractedData.supplier.name.toLowerCase().trim();
    const existingSuppliers = await shopDb.query.supplier.findMany({
      where: { name: { like: `%${extractedSupplierName}%` } },
    });

    const matchedSupplierId = existingSuppliers.at(0)?.id ?? null;

    const photoUrl = file.objectPath;
    const rawJson = JSON.stringify(extractedData);
    const extractedJson = JSON.stringify({
      ...extractedData,
      matchedSupplierId,
    });
    const now = new Date();

    const ocrResultData = {
      photoUrl,
      invoiceFileId: file.id,
      rawJson,
      extractedText: extractedData.rawText ?? null,
      extractedData: extractedJson,
      confidenceScore: extractedData.confidence,
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

    return { success: true };
  });
