import { z } from "zod";
import { and, db, eq, gte, inventoryMovement, order } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { storeDate } from "$lib/server/timezone";

const input = z.object({
  days: z.number().int().min(1).max(90),
});

type TrendPoint = {
  date: string;
  orderCount: number;
  revenueCents: number;
  costCents: number;
};

// en-CA formats dates as YYYY-MM-DD — the grouping key we want, in the store tz.
function tzDateKey(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export const dashboardRevenueTrendHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const dayCount = input.days;
    const tz = context.shop.timezone;

    // Generous UTC lower bound: covers the earliest store-tz day we care about
    // (store-tz midnight is within ~14h of UTC midnight) plus slack. Keeps the
    // query cheap without needing tz-midnight → UTC conversion.
    const fetchSince = new Date(Date.now() - (dayCount + 2) * 86400000);

    const [revenueRows, costRows] = await Promise.all([
      db
        .select({
          createdAt: order.createdAt,
          totalCents: order.totalCents,
        })
        .from(order)
        .where(gte(order.createdAt, fetchSince)),
      db
        .select({
          occurredAt: inventoryMovement.occurredAt,
          qty: inventoryMovement.qty,
          unitCostCents: inventoryMovement.unitCostCents,
        })
        .from(inventoryMovement)
        .where(
          and(
            eq(inventoryMovement.movementType, "SALE"),
            gte(inventoryMovement.occurredAt, fetchSince),
          ),
        ),
    ]);

    // Bucket per-row in the store tz (DST-safe), then emit the trailing window.
    const revenueByDay = new Map<string, { count: number; cents: number }>();
    for (const row of revenueRows) {
      const key = tzDateKey(row.createdAt, tz);
      const bucket = revenueByDay.get(key) ?? { count: 0, cents: 0 };
      bucket.count += 1;
      bucket.cents += Number(row.totalCents);
      revenueByDay.set(key, bucket);
    }

    const costByDay = new Map<string, number>();
    for (const row of costRows) {
      const key = tzDateKey(row.occurredAt, tz);
      costByDay.set(key, (costByDay.get(key) ?? 0) + Math.abs(row.qty) * Number(row.unitCostCents));
    }

    const days: TrendPoint[] = [];
    const today = storeDate(new Date(), tz);
    for (let i = dayCount; i >= 0; i--) {
      const key = today.subtract({ days: i }).toString();
      const revenue = revenueByDay.get(key);
      days.push({
        date: key,
        orderCount: revenue?.count ?? 0,
        revenueCents: revenue?.cents ?? 0,
        costCents: costByDay.get(key) ?? 0,
      });
    }

    return { days };
  });
