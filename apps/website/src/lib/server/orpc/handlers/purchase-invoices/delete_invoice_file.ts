import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  db,
  eq,
  inArray,
  purchaseInvoice,
  purchaseInvoiceFile,
  purchaseInvoiceOcrResult,
} from "$lib/server/db";
import { logger } from "$lib/server/logger";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { deleteObject, extractObjectKey } from "$lib/server/storage";

const input = z.object({
  fileId: z.string().min(1),
});

export const deleteInvoiceFileHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const file = await db.query.purchaseInvoiceFile.findFirst({
      where: { id: input.fileId },
    });

    if (!file) {
      throw new ORPCError("NOT_FOUND", {
        data: { key: "error_invoice_file_not_found" },
      });
    }

    if (file.status === "PROCESSING") {
      throw new ORPCError("FORBIDDEN", {
        data: { key: "error_cannot_delete_file_while_processing" },
      });
    }

    const ocrResults = await db.query.purchaseInvoiceOcrResult.findMany({
      where: { invoiceFileId: input.fileId },
    });

    if (ocrResults.length > 0) {
      const ocrResultIds = ocrResults.map((r) => r.id);

      const existingInvoice = await db
        .select()
        .from(purchaseInvoice)
        .where(inArray(purchaseInvoice.ocrResultId, ocrResultIds))
        .limit(1);

      if (existingInvoice.length > 0) {
        throw new ORPCError("FORBIDDEN", {
          data: { key: "error_cannot_delete_invoice_file_with_confirmed_purchase_invo" },
        });
      }
    }

    db.transaction((tx) => {
      if (ocrResults.length > 0) {
        tx.delete(purchaseInvoiceOcrResult)
          .where(eq(purchaseInvoiceOcrResult.invoiceFileId, input.fileId))
          .run();
      }

      tx.delete(purchaseInvoiceFile).where(eq(purchaseInvoiceFile.id, input.fileId)).run();
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
