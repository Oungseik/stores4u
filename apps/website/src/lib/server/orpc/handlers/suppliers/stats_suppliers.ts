import { count, purchaseInvoice, sql, supplier } from "@repo/db";
import { z } from "zod";
import {
  authMiddleware,
  os,
  protectedShopMiddleware,
  shopDbMiddleware,
} from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
});

export const statsSuppliersHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ context: { shopDb } }) => {
    const [supplierStats, invoiceStats] = await Promise.all([
      shopDb.select({ total: count() }).from(supplier),
      shopDb
        .select({
          totalInvoices: count(),
          totalPurchases: sql<number>`COALESCE(SUM(${purchaseInvoice.totalCents}), 0)`,
        })
        .from(purchaseInvoice),
    ]);

    const total = supplierStats[0].total;
    const totalInvoices = invoiceStats[0].totalInvoices;
    const totalPurchases = Number(invoiceStats[0].totalPurchases);

    return { total, totalPurchases, totalInvoices };
  });
