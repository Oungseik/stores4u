import { eq, purchaseInvoiceFile } from "@repo/db";
import { z } from "zod";
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
      throw new Error("Invoice file not found");
    }

    const ocrResults = await shopDb.query.purchaseInvoiceOcrResult.findMany({
      where: { invoiceFileId: input.fileId },
    });

    if (ocrResults.length > 0) {
      throw new Error(
        "Cannot delete invoice file with processed data. Delete the associated invoices first.",
      );
    }

    const objectKey = extractObjectKey(file.objectPath);
    if (objectKey) {
      await deleteObject(objectKey);
    }

    await shopDb.delete(purchaseInvoiceFile).where(eq(purchaseInvoiceFile.id, input.fileId));

    return { success: true };
  });
