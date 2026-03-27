import { orderItem, sql } from "@repo/db";
import { z } from "zod";
import { os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  productId: z.string().min(1),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(20),
});

export const getOrderHistoryHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const orderItemsResult = await shopDb.query.orderItem.findMany({
      where: {
        id: input.cursor ? { lte: input.cursor } : undefined,
        productId: input.productId,
      },
      limit: input.pageSize + 1,
      orderBy: { createdAt: "desc" },
      with: {
        order: {
          columns: {
            id: true,
            customerName: true,
            customerPhone: true,
          },
        },
      },
    });

    let nextCursor: string | undefined;
    if (orderItemsResult.length > input.pageSize) {
      const next = orderItemsResult.pop();
      nextCursor = next?.id;
    }

    const stats = await shopDb
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${orderItem.lineTotalCents}), 0)`,
        totalUnitsSold: sql<number>`COALESCE(SUM(${orderItem.qty}), 0)`,
      })
      .from(orderItem)
      .where(sql`${orderItem.productId} = ${input.productId}`);

    const totalRevenue = Number(stats[0]?.totalRevenue ?? 0);
    const totalUnitsSold = Number(stats[0]?.totalUnitsSold ?? 0);

    const items = orderItemsResult.map((item) => ({
      id: item.id,
      orderId: item.order?.id ?? null,
      customerName: item.order?.customerName ?? null,
      customerPhone: item.order?.customerPhone ?? null,
      qty: item.qty,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
      createdAt: item.createdAt,
    }));

    return { items, pageSize: input.pageSize, nextCursor, totalRevenue, totalUnitsSold };
  });
