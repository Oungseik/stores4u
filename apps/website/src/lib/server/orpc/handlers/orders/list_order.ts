import { eq, orderItem } from "@repo/db";
import { z } from "zod";
import { os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(20),
});

export const listOrdersHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const orders = await shopDb.query.order.findMany({
      where: input.cursor ? { id: { lte: input.cursor } } : undefined,
      limit: input.pageSize + 1,
      orderBy: { id: "desc" },
      extras: {
        itemsCount: (table) => shopDb.$count(orderItem, eq(orderItem.orderId, table.id)),
      },
    });

    let nextCursor: string | undefined;
    if (orders.length > input.pageSize) {
      const next = orders.pop();
      nextCursor = next?.id;
    }

    const items = orders.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      subtotalCents: o.subtotalCents,
      discountCents: o.discountCents,
      totalCents: o.totalCents,
      itemsCount: o.itemsCount,
      notes: o.notes,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    return { items, pageSize: input.pageSize, nextCursor };
  });
