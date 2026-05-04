import { purchaseInvoiceFile, purchaseInvoiceFileStatus, sql } from "@repo/perstore-db";
import type { PurchaseInvoiceFileStatus } from "@repo/perstore-db";
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

export const getInvoiceFilesStatsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
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
