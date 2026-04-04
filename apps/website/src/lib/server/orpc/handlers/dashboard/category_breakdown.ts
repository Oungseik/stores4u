import { category, eq, orderItem, product, productCategory, sql } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
});

export const dashboardCategoryBreakdownHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ context }) => {
    const shopDb = getShopDb(context.shop);

    const rows = await shopDb
      .select({
        categoryId: category.id,
        categoryName: category.name,
        productCount: sql<number>`COUNT(DISTINCT ${productCategory.productId})`,
        revenueCents: sql<number>`COALESCE(SUM(${orderItem.lineTotalCents}), 0)`,
        orderCount: sql<number>`COUNT(DISTINCT ${orderItem.orderId})`,
      })
      .from(category)
      .leftJoin(productCategory, eq(productCategory.categoryId, category.id))
      .leftJoin(product, eq(product.id, productCategory.productId))
      .leftJoin(orderItem, eq(orderItem.productId, product.id))
      .groupBy(category.id, category.name)
      .orderBy(sql`SUM(${orderItem.lineTotalCents}) DESC`);

    return {
      categories: rows.map((r) => ({
        categoryId: r.categoryId,
        name: r.categoryName,
        productCount: Number(r.productCount),
        revenueCents: Number(r.revenueCents),
        orderCount: Number(r.orderCount),
      })),
    };
  });
