import { and, eq, gte, inventoryMovement, order, sql } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  days: z.number().int().min(1).max(90).default(7),
});

export const dashboardRevenueTrendHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - input.days);
    startDate.setHours(0, 0, 0, 0);

    const [revenueRows, costRows] = await Promise.all([
      shopDb
        .select({
          date: sql<string>`date(${order.createdAt})`,
          orderCount: sql<number>`COUNT(*)`,
          revenueCents: sql<number>`COALESCE(SUM(${order.totalCents}), 0)`,
        })
        .from(order)
        .where(gte(order.createdAt, startDate))
        .groupBy(sql`date(${order.createdAt})`)
        .orderBy(sql`date(${order.createdAt})`),
      shopDb
        .select({
          date: sql<string>`date(${inventoryMovement.occurredAt})`,
          costCents: sql<number>`COALESCE(SUM(ABS(${inventoryMovement.qty}) * ${inventoryMovement.unitCostCents}), 0)`,
        })
        .from(inventoryMovement)
        .where(
          and(
            eq(inventoryMovement.movementType, "SALE"),
            gte(inventoryMovement.occurredAt, startDate),
          ),
        )
        .groupBy(sql`date(${inventoryMovement.occurredAt})`),
    ]);

    const costByDate = new Map<string, number>();
    for (const row of costRows) {
      costByDate.set(row.date, Number(row.costCents));
    }

    const days: Array<{
      date: string;
      orderCount: number;
      revenueCents: number;
      costCents: number;
    }> = [];

    for (let i = input.days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const revenueRow = revenueRows.find((r) => r.date === dateStr);

      days.push({
        date: dateStr,
        orderCount: revenueRow ? Number(revenueRow.orderCount) : 0,
        revenueCents: revenueRow ? Number(revenueRow.revenueCents) : 0,
        costCents: costByDate.get(dateStr) ?? 0,
      });
    }

    return { days };
  });
