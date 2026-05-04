import { and, eq, gte, inventoryMovement, order, sql } from "@repo/perstore-db";
import { z } from "zod";
import { getRequestEvent, query } from "$app/server";
import { assertShopAccess } from "$lib/remote/auth";
import { getShopDb } from "$lib/server/shop_db";

const getRevenueTrendSchema = z.object({
  slug: z.string().min(1).max(100),
  days: z.number().int().min(1).max(90),
});

type TrendPoint = {
  date: string;
  orderCount: number;
  revenueCents: number;
  costCents: number;
};

export const getRevenueTrend = query(getRevenueTrendSchema, async (input) => {
  const { locals } = getRequestEvent();
  await assertShopAccess(locals, input.slug);
  const shopDb = getShopDb({ slug: input.slug });

  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - input.days);
  startDate.setUTCHours(0, 0, 0, 0);

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

  for (let i = input.days; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
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
