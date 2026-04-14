import { and, count, eq, gte, product, sql } from "@repo/db";
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

export const getProductsStatsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ context: { shopDb } }) => {
    const [productStats, outOfStockCount, lowStockCount] = await Promise.all([
      shopDb
        .select({
          total: count(),
          inventoryValueRetailCents: sql<number>`COALESCE(SUM(${product.stock} * ${product.priceCents}), 0)`,
        })
        .from(product),
      shopDb.select({ count: count() }).from(product).where(eq(product.stock, 0)),
      shopDb
        .select({ count: count() })
        .from(product)
        .where(and(gte(product.stock, 1), gte(product.lowStockThreshold, product.stock))),
    ]);

    return {
      total: productStats[0].total,
      outOfStock: outOfStockCount[0].count,
      lowStock: lowStockCount[0].count,
      inventoryValueRetailCents: Number(productStats[0].inventoryValueRetailCents),
    };
  });
