import { count, order, sql } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  topLimit: z.number().int().min(1).max(50).default(10),
});

export const dashboardCustomerInsightsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const [uniqueCustomers, avgOrderValue, topCustomers] = await Promise.all([
      shopDb
        .select({
          count: sql<number>`COUNT(DISTINCT CASE
            WHEN ${order.customerName} IS NOT NULL AND ${order.customerPhone} IS NOT NULL
            THEN ${order.customerName} || '||' || ${order.customerPhone}
            WHEN ${order.customerName} IS NOT NULL THEN ${order.customerName}
            WHEN ${order.customerPhone} IS NOT NULL THEN ${order.customerPhone}
            ELSE NULL
          END)`,
        })
        .from(order),
      shopDb
        .select({
          avgCents: sql<number>`COALESCE(AVG(${order.totalCents}), 0)`,
        })
        .from(order),
      shopDb
        .select({
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          orderCount: count(),
          totalSpentCents: sql<number>`COALESCE(SUM(${order.totalCents}), 0)`,
        })
        .from(order)
        .where(sql`${order.customerName} IS NOT NULL OR ${order.customerPhone} IS NOT NULL`)
        .groupBy(order.customerName, order.customerPhone)
        .orderBy(sql`SUM(${order.totalCents}) DESC`)
        .limit(input.topLimit),
    ]);

    const totalCustomers = Number(uniqueCustomers[0].count);

    const returningRows = await shopDb
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(
        sql`(SELECT ${order.customerName}, ${order.customerPhone}, COUNT(*) as order_count
             FROM \`order\`
             WHERE ${order.customerName} IS NOT NULL OR ${order.customerPhone} IS NOT NULL
             GROUP BY ${order.customerName}, ${order.customerPhone}
             HAVING order_count >= 2) as repeat_customers`,
      );

    const returningCustomers = Number(returningRows[0]?.count ?? 0);

    return {
      totalCustomers,
      returningCustomers,
      avgOrderValueCents: Math.round(Number(avgOrderValue[0].avgCents)),
      topCustomers: topCustomers.map((c) => ({
        name: c.customerName,
        phone: c.customerPhone,
        orderCount: Number(c.orderCount),
        totalSpentCents: Number(c.totalSpentCents),
      })),
    };
  });
