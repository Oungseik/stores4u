import { z } from "zod";
import { and, count, db, eq, gte, product, sql } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({});

export const statsProductsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async () => {
    const [productStats, outOfStockCount, lowStockCount] = await Promise.all([
      db
        .select({
          total: count(),
          inventoryValueRetailCents: sql<number>`COALESCE(SUM(${product.stock} * ${product.priceCents}), 0)`,
        })
        .from(product)
        .where(eq(product.isArchived, false)),
      db
        .select({ count: count() })
        .from(product)
        .where(and(eq(product.isArchived, false), eq(product.stock, 0))),
      db
        .select({ count: count() })
        .from(product)
        .where(
          and(
            eq(product.isArchived, false),
            gte(product.stock, 1),
            gte(product.lowStockThreshold, product.stock),
          ),
        ),
    ]);

    return {
      total: productStats[0].total,
      outOfStock: outOfStockCount[0].count,
      lowStock: lowStockCount[0].count,
      inventoryValueRetailCents: Number(productStats[0].inventoryValueRetailCents),
    };
  });
