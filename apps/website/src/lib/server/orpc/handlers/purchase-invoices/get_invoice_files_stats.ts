import type { PurchaseInvoiceFileStatus } from "$lib/server/db";
import { db, purchaseInvoiceFile, purchaseInvoiceFileStatus, sql } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

export const getInvoiceFilesStatsHandler = os
  .route({ method: "GET" })
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async () => {
    const counts = await db
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
