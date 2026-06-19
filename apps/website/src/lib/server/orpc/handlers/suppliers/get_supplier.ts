import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, eq, purchaseInvoice, sql } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  supplierId: z.string().min(1),
});

export const getSupplierHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const supplier = await db.query.supplier.findFirst({
      where: { id: input.supplierId },
      extras: {
        purchaseInvoicesCount: (table) =>
          db.$count(purchaseInvoice, eq(purchaseInvoice.supplierId, table.id)),
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
      phone2: supplier.phone2,
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
