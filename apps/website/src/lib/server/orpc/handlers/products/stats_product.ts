import { and, eq, inventoryMovement, orderItem, sql } from "@repo/db";
import { z } from "zod";
import { os, protectedShopMiddleware, shopDbMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  productId: z.string().min(1),
});

export const statsProductHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const [[salesStats], [purchaseStats], [lastPurchase], [avgSalePrice], movementCounts] =
      await Promise.all([
        shopDb
          .select({
            totalUnitsSold: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovement.movementType} = 'SALE' THEN ABS(${inventoryMovement.qty}) ELSE 0 END), 0)`,
            totalRevenueCents: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovement.movementType} = 'SALE' THEN ABS(${inventoryMovement.qty}) * COALESCE(${inventoryMovement.unitPriceCents}, 0) ELSE 0 END), 0)`,
          })
          .from(inventoryMovement)
          .where(eq(inventoryMovement.productId, input.productId)),
        shopDb
          .select({
            totalUnitsPurchased: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovement.movementType} = 'PURCHASE' THEN ${inventoryMovement.qty} ELSE 0 END), 0)`,
            totalCostCents: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovement.movementType} = 'PURCHASE' THEN ${inventoryMovement.qty} * COALESCE(${inventoryMovement.unitCostCents}, 0) ELSE 0 END), 0)`,
          })
          .from(inventoryMovement)
          .where(eq(inventoryMovement.productId, input.productId)),
        shopDb
          .select({
            occurredAt: inventoryMovement.occurredAt,
            unitCostCents: inventoryMovement.unitCostCents,
          })
          .from(inventoryMovement)
          .where(
            and(
              eq(inventoryMovement.productId, input.productId),
              eq(inventoryMovement.movementType, "PURCHASE"),
            ),
          )
          .orderBy(sql`${inventoryMovement.occurredAt} DESC`)
          .limit(1),
        shopDb
          .select({
            avgPriceCents: sql<number>`COALESCE(AVG(${orderItem.unitPriceCents}), 0)`,
          })
          .from(orderItem)
          .where(eq(orderItem.productId, input.productId)),
        shopDb
          .select({
            movementType: inventoryMovement.movementType,
            count: sql<number>`COUNT(*)`,
          })
          .from(inventoryMovement)
          .where(eq(inventoryMovement.productId, input.productId))
          .groupBy(inventoryMovement.movementType),
      ]);

    const movementCountMap = Object.fromEntries(
      movementCounts.map((m) => [m.movementType, m.count]),
    );

    // Calculate profit margin if we have both revenue and cost data
    const totalRevenue = Number(salesStats.totalRevenueCents);
    const totalCost = Number(purchaseStats.totalCostCents);
    const avgMarginPercent =
      totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 100) : 0;

    return {
      sales: {
        totalUnitsSold: Number(salesStats.totalUnitsSold),
        totalRevenueCents: totalRevenue,
        averagePriceCents: Math.round(Number(avgSalePrice.avgPriceCents)),
      },
      purchases: {
        totalUnitsPurchased: Number(purchaseStats.totalUnitsPurchased),
        totalCostCents: totalCost,
        lastPurchaseAt: lastPurchase?.occurredAt ?? null,
        lastUnitCostCents: lastPurchase?.unitCostCents ?? null,
      },
      profit: {
        averageMarginPercent: avgMarginPercent,
        estimatedProfitCents: Math.max(0, totalRevenue - totalCost),
      },
      movements: {
        total: movementCounts.reduce((sum, m) => sum + m.count, 0),
        byType: movementCountMap,
      },
    };
  });
