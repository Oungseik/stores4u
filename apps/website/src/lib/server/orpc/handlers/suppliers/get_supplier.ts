import { ORPCError } from "@orpc/server";
import { eq, purchaseInvoice, sql } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  supplierId: z.string().min(1),
});

export const getSupplierHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const supplier = await shopDb.query.supplier.findFirst({
      where: { id: input.supplierId },
      extras: {
        purchaseInvoicesCount: (table) =>
          shopDb.$count(purchaseInvoice, eq(purchaseInvoice.supplierId, table.id)),
        totalPurchases: (table) =>
          sql`(select coalesce(sum(${purchaseInvoice.totalCents}), 0) from ${purchaseInvoice} where ${purchaseInvoice.supplierId} = ${table.id})`.mapWith(
            Number,
          ),
        lastPurchase: (table) =>
          sql`(select max(${purchaseInvoice.invoiceDate}) from ${purchaseInvoice} where ${purchaseInvoice.supplierId} = ${table.id})`.mapWith(
            (v) => (v == null ? null : new Date(v as string)),
          ),
      },
    });

    if (!supplier) {
      throw new ORPCError("NOT_FOUND", { message: "Supplier not found" });
    }

    return {
      id: supplier.id,
      name: supplier.name,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      paymentTerms: supplier.paymentTerms,
      purchaseInvoicesCount: supplier.purchaseInvoicesCount,
      totalPurchases: supplier.totalPurchases,
      lastPurchase: supplier.lastPurchase,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    };
  });
