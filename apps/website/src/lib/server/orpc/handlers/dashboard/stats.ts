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
import { storePeriodStarts } from "$lib/server/timezone";

const input = z.object({});

export const dashboardStatsHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ context }) => {
    const tz = context.shop.timezone;
    const {
      today: todayStart,
      week: weekStart,
      lastWeek: lastWeekStart,
      month: monthStart,
    } = storePeriodStarts(new Date(), tz);

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
        .where(and(gte(order.createdAt, lastWeekStart), lt(order.createdAt, weekStart))),
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
