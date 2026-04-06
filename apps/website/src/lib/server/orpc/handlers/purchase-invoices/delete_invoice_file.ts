import { ORPCError } from "@orpc/server";
import {
  eq,
  inArray,
  purchaseInvoice,
  purchaseInvoiceFile,
  purchaseInvoiceOcrResult,
} from "@repo/db";
import { z } from "zod";
import { logger } from "$lib/server/logger";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";
import { deleteObject, extractObjectKey } from "$lib/server/storage";

const input = z.object({
  slug: z.string().min(1).max(100),
  fileId: z.string().min(1),
});

export const deleteInvoiceFileHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const file = await shopDb.query.purchaseInvoiceFile.findFirst({
      where: { id: input.fileId },
    });

    if (!file) {
      throw new ORPCError("NOT_FOUND", {
        message: "Invoice file not found",
      });
    }

    if (file.status === "PROCESSING") {
      throw new ORPCError("FORBIDDEN", {
        message: "Cannot delete file while processing",
      });
    }

    const ocrResults = await shopDb.query.purchaseInvoiceOcrResult.findMany({
      where: { invoiceFileId: input.fileId },
    });

    if (ocrResults.length > 0) {
      const ocrResultIds = ocrResults.map((r) => r.id);

      const existingInvoice = await shopDb
        .select()
        .from(purchaseInvoice)
        .where(inArray(purchaseInvoice.ocrResultId, ocrResultIds))
        .limit(1);

      if (existingInvoice.length > 0) {
        throw new ORPCError("FORBIDDEN", {
          message: "Cannot delete invoice file with confirmed purchase invoices",
        });
      }
    }

    await shopDb.transaction(async (tx) => {
      if (ocrResults.length > 0) {
        await tx
          .delete(purchaseInvoiceOcrResult)
          .where(eq(purchaseInvoiceOcrResult.invoiceFileId, input.fileId));
      }

      await tx.delete(purchaseInvoiceFile).where(eq(purchaseInvoiceFile.id, input.fileId));
    });

    const objectKey = extractObjectKey(file.objectPath);
    if (objectKey) {
      try {
        await deleteObject(objectKey);
      } catch (error) {
        // Best effort - orphan files are acceptable
        logger.error({ error }, "Failed to delete invoice file on cloud storage");
      }
    }

    return { success: true };
  });
