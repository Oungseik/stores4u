import { eq, gte, orderItem, product, sql } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const periodValues = ["today", "week", "month", "all"] as const;
type Period = (typeof periodValues)[number];

const input = z.object({
  slug: z.string().min(1).max(100),
  period: z.enum(periodValues).default("week"),
  limit: z.number().int().min(1).max(50).default(10),
});

function getStartDate(period: Period): Date | undefined {
  const now = new Date();
  switch (period) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "week": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      d.setDate(d.getDate() - diff);
      return d;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "all":
      return undefined;
  }
}

export const dashboardTopProductsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);
    const startDate = getStartDate(input.period);

    const conditions = startDate ? gte(orderItem.createdAt, startDate) : undefined;

    const rows = await shopDb
      .select({
        productId: orderItem.productId,
        name: product.name,
        sku: product.sku,
        image: product.image,
        totalRevenueCents: sql<number>`COALESCE(SUM(${orderItem.lineTotalCents}), 0)`,
        totalUnitsSold: sql<number>`COALESCE(SUM(${orderItem.qty}), 0)`,
        totalOrders: sql<number>`COUNT(DISTINCT ${orderItem.orderId})`,
      })
      .from(orderItem)
      .innerJoin(product, eq(orderItem.productId, product.id))
      .where(conditions)
      .groupBy(orderItem.productId, product.name, product.sku, product.image)
      .orderBy(sql`SUM(${orderItem.lineTotalCents}) DESC`)
      .limit(input.limit);

    return {
      items: rows.map((r) => ({
        productId: r.productId,
        name: r.name,
        sku: r.sku,
        image: r.image,
        totalRevenueCents: Number(r.totalRevenueCents),
        totalUnitsSold: Number(r.totalUnitsSold),
        totalOrders: Number(r.totalOrders),
      })),
    };
  });
