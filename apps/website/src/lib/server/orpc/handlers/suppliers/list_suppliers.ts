import { eq, purchaseInvoice, sql } from "@repo/perstore-db";
import { z } from "zod";
import {
  authMiddleware,
  os,
  protectedShopMiddleware,
  shopDbMiddleware,
} from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(12),
  search: z.string().optional(),
});

export const listSuppliersHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const suppliers = await shopDb.query.supplier.findMany({
      where: {
        id: input.cursor ? { lte: input.cursor } : undefined,
        OR: input.search
          ? [
              { name: { like: `%${input.search}%` } },
              { contactName: { like: `%${input.search}%` } },
              { email: { like: `%${input.search}%` } },
            ]
          : undefined,
      },
      limit: input.pageSize + 1,
      orderBy: { id: "desc" },
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

    let nextCursor: string | undefined;
    if (suppliers.length > input.pageSize) {
      const next = suppliers.pop();
      nextCursor = next?.id;
    }

    const items = suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      contactName: s.contactName,
      phone: s.phone,
      phone2: s.phone2,
      email: s.email,
      address: s.address,
      paymentTerms: s.paymentTerms,
      purchaseInvoicesCount: s.purchaseInvoicesCount,
      totalPurchases: s.totalPurchases,
      lastPurchase: s.lastPurchase,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return { items, pageSize: input.pageSize, nextCursor };
  });
