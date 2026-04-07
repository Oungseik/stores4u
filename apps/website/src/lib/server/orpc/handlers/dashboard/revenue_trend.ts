import { and, eq, gte, inventoryMovement, order, sql } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z
  .object({
    slug: z.string().min(1).max(100),
    days: z.number().int().min(1).max(90).optional(),
    months: z.number().int().min(1).max(24).optional(),
  })
  .refine((d) => d.days !== undefined || d.months !== undefined, {
    message: "Either 'days' or 'months' must be provided",
  });

type TrendPoint = {
  date: string;
  orderCount: number;
  revenueCents: number;
  costCents: number;
};

function getMonthRange(count: number): string[] {
  const months: string[] = [];
  for (let i = count; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    d.setHours(0, 0, 0, 0);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

export const dashboardRevenueTrendHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    if (input.months !== undefined) {
      const monthKeys = getMonthRange(input.months);
      const startMonth = monthKeys[0];
      const startDate = new Date(startMonth + "-01T00:00:00");

      const [revenueRows, costRows] = await Promise.all([
        shopDb
          .select({
            month: sql<string>`strftime('%Y-%m', ${order.createdAt}, 'unixepoch')`,
            orderCount: sql<number>`COUNT(*)`,
            revenueCents: sql<number>`COALESCE(SUM(${order.totalCents}), 0)`,
          })
          .from(order)
          .where(gte(order.createdAt, startDate))
          .groupBy(sql`strftime('%Y-%m', ${order.createdAt}, 'unixepoch')`)
          .orderBy(sql`strftime('%Y-%m', ${order.createdAt}, 'unixepoch')`),
        shopDb
          .select({
            month: sql<string>`strftime('%Y-%m', ${inventoryMovement.occurredAt}, 'unixepoch')`,
            costCents: sql<number>`COALESCE(SUM(ABS(${inventoryMovement.qty}) * ${inventoryMovement.unitCostCents}), 0)`,
          })
          .from(inventoryMovement)
          .where(
            and(
              eq(inventoryMovement.movementType, "SALE"),
              gte(inventoryMovement.occurredAt, startDate),
            ),
          )
          .groupBy(sql`strftime('%Y-%m', ${inventoryMovement.occurredAt}, 'unixepoch')`),
      ]);

      const costByMonth = new Map<string, number>();
      for (const row of costRows) {
        costByMonth.set(row.month, Number(row.costCents));
      }

      const days: TrendPoint[] = monthKeys.map((mk) => {
        const rev = revenueRows.find((r) => r.month === mk);
        return {
          date: mk,
          orderCount: rev ? Number(rev.orderCount) : 0,
          revenueCents: rev ? Number(rev.revenueCents) : 0,
          costCents: costByMonth.get(mk) ?? 0,
        };
      });

      return { days };
    }

    const dayCount = input.days ?? 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dayCount);
    startDate.setHours(0, 0, 0, 0);

    const [revenueRows, costRows] = await Promise.all([
      shopDb
        .select({
          date: sql<string>`date(${order.createdAt}, 'unixepoch')`,
          orderCount: sql<number>`COUNT(*)`,
          revenueCents: sql<number>`COALESCE(SUM(${order.totalCents}), 0)`,
        })
        .from(order)
        .where(gte(order.createdAt, startDate))
        .groupBy(sql`date(${order.createdAt}, 'unixepoch')`)
        .orderBy(sql`date(${order.createdAt}, 'unixepoch')`),
      shopDb
        .select({
          date: sql<string>`date(${inventoryMovement.occurredAt}, 'unixepoch')`,
          costCents: sql<number>`COALESCE(SUM(ABS(${inventoryMovement.qty}) * ${inventoryMovement.unitCostCents}), 0)`,
        })
        .from(inventoryMovement)
        .where(
          and(
            eq(inventoryMovement.movementType, "SALE"),
            gte(inventoryMovement.occurredAt, startDate),
          ),
        )
        .groupBy(sql`date(${inventoryMovement.occurredAt}, 'unixepoch')`),
    ]);

    const costByDate = new Map<string, number>();
    for (const row of costRows) {
      costByDate.set(row.date, Number(row.costCents));
    }

    const days: TrendPoint[] = [];

    for (let i = dayCount; i >= 0; i--) {
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
