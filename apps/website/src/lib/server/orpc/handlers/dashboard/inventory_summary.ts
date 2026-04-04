import { and, eq, gte, inventoryMovement, product, sql } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const periodValues = ["today", "week", "month"] as const;

const input = z.object({
  slug: z.string().min(1).max(100),
  period: z.enum(periodValues).default("week"),
});

function getStartDate(period: string): Date {
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
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

export const dashboardInventorySummaryHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);
    const startDate = getStartDate(input.period);

    const [wastage, adjustments, recentMovements] = await Promise.all([
      shopDb
        .select({
          totalCents: sql<number>`COALESCE(SUM(ABS(${inventoryMovement.qty}) * ${inventoryMovement.unitCostCents}), 0)`,
          totalUnits: sql<number>`COALESCE(SUM(ABS(${inventoryMovement.qty})), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(inventoryMovement)
        .where(
          and(
            eq(inventoryMovement.movementType, "WASTAGE"),
            gte(inventoryMovement.occurredAt, startDate),
          ),
        ),
      shopDb
        .select({
          totalCents: sql<number>`COALESCE(SUM(ABS(${inventoryMovement.qty}) * ${inventoryMovement.unitCostCents}), 0)`,
          totalUnits: sql<number>`COALESCE(SUM(ABS(${inventoryMovement.qty})), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(inventoryMovement)
        .where(
          and(
            eq(inventoryMovement.movementType, "ADJUSTMENT"),
            gte(inventoryMovement.occurredAt, startDate),
          ),
        ),
      shopDb
        .select({
          id: inventoryMovement.id,
          productId: inventoryMovement.productId,
          productName: product.name,
          movementType: inventoryMovement.movementType,
          qty: inventoryMovement.qty,
          occurredAt: inventoryMovement.occurredAt,
        })
        .from(inventoryMovement)
        .innerJoin(product, eq(inventoryMovement.productId, product.id))
        .where(gte(inventoryMovement.occurredAt, startDate))
        .orderBy(sql`${inventoryMovement.occurredAt} DESC`)
        .limit(10),
    ]);

    return {
      wastage: {
        totalCents: Number(wastage[0].totalCents),
        totalUnits: Number(wastage[0].totalUnits),
        count: Number(wastage[0].count),
      },
      adjustments: {
        totalCents: Number(adjustments[0].totalCents),
        totalUnits: Number(adjustments[0].totalUnits),
        count: Number(adjustments[0].count),
      },
      recentMovements: recentMovements.map((m) => ({
        id: m.id,
        productId: m.productId,
        productName: m.productName,
        movementType: m.movementType,
        qty: m.qty,
        occurredAt: m.occurredAt,
      })),
    };
  });
