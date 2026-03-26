import { eq, orderItem } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(20),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const listOrdersHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const orders = await shopDb.query.order.findMany({
      where: {
        id: input.cursor ? { lte: input.cursor } : undefined,
        OR: input.search
          ? [
              { id: { like: `%${input.search}%` } },
              { customerName: { like: `%${input.search}%` } },
              { customerPhone: { like: `%${input.search}%` } },
            ]
          : undefined,
        createdAt: input.dateFrom
          ? {
              gte: new Date(input.dateFrom),
              ...(input.dateTo ? { lte: new Date(`${input.dateTo}T23:59:59`) } : {}),
            }
          : input.dateTo
            ? { lte: new Date(`${input.dateTo}T23:59:59`) }
            : undefined,
      },
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
