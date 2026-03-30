import { purchaseInvoiceFile, purchaseInvoiceFileStatus, sql } from "@repo/db";
import type { PurchaseInvoiceFileStatus } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
});

export const getInvoiceFilesStatsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const counts = await shopDb
      .select({
        status: purchaseInvoiceFile.status,
        count: sql<number>`count(*)`,
      })
      .from(purchaseInvoiceFile)
      .groupBy(purchaseInvoiceFile.status);

    const result = {} as Record<PurchaseInvoiceFileStatus, number>;
    for (const status of purchaseInvoiceFileStatus) {
      result[status] = 0;
    }
    for (const row of counts) {
      result[row.status as PurchaseInvoiceFileStatus] = Number(row.count);
    }

    return result;
  });
