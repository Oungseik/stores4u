import { z } from "zod";
import {
  and,
  count,
  db,
  eq,
  gte,
  inventoryMovement,
  lt,
  order,
  product,
  purchaseInvoiceFile,
  sql,
} from "$lib/server/db";
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

export const dashboardStatsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async () => {
    const now = new Date();
    const todayStart = getStartOfDay(now);
    const weekStart = getStartOfWeek(now);
    const monthStart = getStartOfMonth(now);

    const [
      todayRevenue,
      weekRevenue,
      monthRevenue,
      lastWeekRevenue,
      productStats,
      outOfStockCount,
      lowStockCount,
      pendingInvoiceFiles,
      todayCogs,
      monthCogs,
    ] = await Promise.all([
      db
        .select({
          orderCount: count(),
          totalCents: sql<number>`COALESCE(SUM(${order.totalCents}), 0)`,
        })
        .from(order)
        .where(gte(order.createdAt, todayStart)),
      db
        .select({
          orderCount: count(),
          totalCents: sql<number>`COALESCE(SUM(${order.totalCents}), 0)`,
        })
        .from(order)
        .where(gte(order.createdAt, weekStart)),
      db
        .select({
          orderCount: count(),
          totalCents: sql<number>`COALESCE(SUM(${order.totalCents}), 0)`,
        })
        .from(order)
        .where(gte(order.createdAt, monthStart)),
      db
        .select({
          totalCents: sql<number>`COALESCE(SUM(${order.totalCents}), 0)`,
        })
        .from(order)
        .where(
          and(
            gte(order.createdAt, new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)),
            lt(order.createdAt, weekStart),
          ),
        ),
      db
        .select({
          total: count(),
          inventoryValueRetailCents: sql<number>`COALESCE(SUM(${product.stock} * ${product.priceCents}), 0)`,
        })
        .from(product),
      db.select({ count: count() }).from(product).where(eq(product.stock, 0)),
      db
        .select({ count: count() })
        .from(product)
        .where(and(gte(product.stock, 1), gte(product.lowStockThreshold, product.stock))),
      db
        .select({ count: count() })
        .from(purchaseInvoiceFile)
        .where(eq(purchaseInvoiceFile.status, "PROCESSED")),
      db
        .select({
          totalCostCents: sql<number>`COALESCE(SUM(ABS(${inventoryMovement.qty}) * ${inventoryMovement.unitCostCents}), 0)`,
        })
        .from(inventoryMovement)
        .where(
          and(
            eq(inventoryMovement.movementType, "SALE"),
            gte(inventoryMovement.occurredAt, todayStart),
          ),
        ),
      db
        .select({
          totalCostCents: sql<number>`COALESCE(SUM(ABS(${inventoryMovement.qty}) * ${inventoryMovement.unitCostCents}), 0)`,
        })
        .from(inventoryMovement)
        .where(
          and(
            eq(inventoryMovement.movementType, "SALE"),
            gte(inventoryMovement.occurredAt, monthStart),
          ),
        ),
    ]);

    const lastWeekTotal = Number(lastWeekRevenue[0]?.totalCents ?? 0);
    const thisWeekTotal = Number(weekRevenue[0]?.totalCents ?? 0);
    const vsLastWeek =
      lastWeekTotal === 0 ? 0 : Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100);

    return {
      revenue: {
        today: {
          count: todayRevenue[0].orderCount,
          totalCents: Number(todayRevenue[0].totalCents),
        },
        thisWeek: {
          count: weekRevenue[0].orderCount,
          totalCents: thisWeekTotal,
        },
        thisMonth: {
          count: monthRevenue[0].orderCount,
          totalCents: Number(monthRevenue[0].totalCents),
        },
        vsLastWeek,
      },
      products: {
        total: productStats[0].total,
        outOfStock: outOfStockCount[0].count,
        lowStock: lowStockCount[0].count,
        inventoryValueRetailCents: Number(productStats[0].inventoryValueRetailCents),
      },
      purchaseInvoices: {
        pendingReviewCount: pendingInvoiceFiles[0].count,
      },
      grossProfit: {
        todayCents: Number(todayRevenue[0].totalCents) - Number(todayCogs[0]?.totalCostCents ?? 0),
        thisMonthCents:
          Number(monthRevenue[0].totalCents) - Number(monthCogs[0]?.totalCostCents ?? 0),
      },
    };
  });
