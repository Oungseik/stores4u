import { ORPCError } from "@orpc/server";
import { eq, purchaseInvoice } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";
import { deleteObject, extractObjectKey } from "$lib/server/storage";

const input = z.object({
  slug: z.string().min(1).max(100),
  id: z.string().min(1),
  deleteFile: z.boolean().optional().default(false),
});

export const deletePurchaseInvoiceHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const invoice = await shopDb.query.purchaseInvoice.findFirst({
      where: { id: input.id },
    });

    if (!invoice) {
      throw new ORPCError("NOT_FOUND", { message: "Purchase invoice not found" });
    }

    if (invoice.status === "VALIDATED") {
      throw new ORPCError("FORBIDDEN", {
        message: "Cannot delete validated invoice.",
      });
    }

    if (invoice.status === "AUTO_ACCEPTED") {
      throw new ORPCError("FORBIDDEN", {
        message: "Cannot delete auto-accepted invoice.",
      });
    }

    if (input.deleteFile) {
      const objectKey = extractObjectKey(invoice.photoUrl);
      if (objectKey) {
        await deleteObject(objectKey);
      }
    }

    await shopDb.delete(purchaseInvoice).where(eq(purchaseInvoice.id, input.id));

    return { success: true };
  });
