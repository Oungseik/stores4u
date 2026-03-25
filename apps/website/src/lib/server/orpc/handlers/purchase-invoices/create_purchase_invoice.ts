import { ORPCError } from "@orpc/server";
import { eq, purchaseInvoice, purchaseInvoiceItem, supplier } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";
import { invoiceAmountFields, purchaseInvoiceItemInput } from "./schemas";

const input = z.object({
  slug: z.string().min(1).max(100),
  invoiceNumber: z.string().min(1).max(100),
  supplierId: z.string().min(1),
  invoiceDate: z.string().min(1),
  photoUrl: z.string().min(1).max(500),
  ...invoiceAmountFields,
  status: z.enum(["PENDING", "VALIDATED", "REJECTED", "AUTO_ACCEPTED"]).default("PENDING"),
  items: z.array(purchaseInvoiceItemInput).min(1),
});

export const createPurchaseInvoiceHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);
    const now = new Date();

    const existingSupplier = await shopDb
      .select({ id: supplier.id })
      .from(supplier)
      .where(eq(supplier.id, input.supplierId))
      .limit(1);

    if (!existingSupplier.at(0)) {
      throw new ORPCError("NOT_FOUND", { message: "Supplier not found" });
    }

    const result = await shopDb.transaction(async (tx) => {
      const inserted = await tx
        .insert(purchaseInvoice)
        .values({
          invoiceNumber: input.invoiceNumber,
          supplierId: input.supplierId,
          invoiceDate: input.invoiceDate,
          photoUrl: input.photoUrl,
          subtotalCents: input.subtotalCents,
          vatCents: input.vatCents,
          discountCents: input.discountCents,
          freightCents: input.freightCents,
          totalCents: input.totalCents,
          notes: input.notes,
          status: input.status,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const created = inserted.at(0);
      if (!created) {
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }

      await tx.insert(purchaseInvoiceItem).values(
        input.items.map((item) => ({
          purchaseInvoiceId: created.id,
          productId: item.productId,
          qty: item.qty,
          unitCostCents: item.unitCostCents,
          lineSubtotalCents: item.lineSubtotalCents,
          vatCents: item.vatCents,
          discountCents: item.discountCents,
          freightCents: item.freightCents,
          lineTotalCents: item.lineTotalCents,
          expiryDate: item.expiryDate,
          batchNumber: item.batchNumber,
          createdAt: now,
        })),
      );

      return created;
    });

    return result;
  });
