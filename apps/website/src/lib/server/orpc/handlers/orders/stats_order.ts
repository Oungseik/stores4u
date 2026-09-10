import { z } from "zod";
import { count, db, gte, order, sql } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({});

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek(date: Date): Date {
  const d = getStartOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export const statsOrdersHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async () => {
    const now = new Date();

    const todayStart = getStartOfDay(now);
    const weekStart = getStartOfWeek(now);
    const monthStart = getStartOfMonth(now);

    const [todayStats, weekStats, monthStats] = await Promise.all([
      db
        .select({
          count: count(),
          totalCents: sql<number>`COALESCE(SUM(${order.totalCents}), 0)`,
        })
        .from(order)
        .where(gte(order.createdAt, todayStart)),
      db
        .select({
          count: count(),
          totalCents: sql<number>`COALESCE(SUM(${order.totalCents}), 0)`,
        })
        .from(order)
        .where(gte(order.createdAt, weekStart)),
      db
        .select({
          count: count(),
          totalCents: sql<number>`COALESCE(SUM(${order.totalCents}), 0)`,
        })
        .from(order)
        .where(gte(order.createdAt, monthStart)),
    ]);

    return {
      today: {
        count: todayStats[0].count,
        totalCents: Number(todayStats[0].totalCents),
      },
      thisWeek: {
        count: weekStats[0].count,
        totalCents: Number(weekStats[0].totalCents),
      },
      thisMonth: {
        count: monthStats[0].count,
        totalCents: Number(monthStats[0].totalCents),
      },
    };
  });
