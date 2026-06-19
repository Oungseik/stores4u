import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, eq, productSupplier, purchaseInvoice, sql, supplier } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  id: z.string().min(1),
});

export const deleteSupplierHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const linkedProducts = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(productSupplier)
      .where(eq(productSupplier.supplierId, input.id))
      .limit(1);

    if (linkedProducts.length > 0 && linkedProducts[0].count > 0) {
      throw new ORPCError("FORBIDDEN", {
        message: `Cannot delete supplier. This supplier is linked to ${linkedProducts[0].count} product(s).`,
      });
    }

    const invoices = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(purchaseInvoice)
      .where(eq(purchaseInvoice.supplierId, input.id))
      .limit(1);

    if (invoices.length > 0 && invoices[0].count > 0) {
      throw new ORPCError("FORBIDDEN", {
        message: `Cannot delete supplier. This supplier has ${invoices[0].count} purchase invoice(s).`,
      });
    }

    await db.delete(supplier).where(eq(supplier.id, input.id));
  });
