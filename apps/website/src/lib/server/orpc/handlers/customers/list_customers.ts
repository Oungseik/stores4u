import { z } from "zod";
import { db, eq, order, sql } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(12),
  search: z.string().optional(),
});

export const listCustomersHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const customers = await db.query.customer.findMany({
      where: {
        id: input.cursor ? { lte: input.cursor } : undefined,
        OR: input.search
          ? [
              { name: { like: `%${input.search}%` } },
              { contactName: { like: `%${input.search}%` } },
              { phone: { like: `%${input.search}%` } },
              { email: { like: `%${input.search}%` } },
            ]
          : undefined,
      },
      limit: input.pageSize + 1,
      orderBy: { id: "desc" },
      extras: {
        ordersCount: (table) => db.$count(order, eq(order.customerId, table.id)),
        totalSpent: (table) =>
          sql`(select coalesce(sum(${order.totalCents}), 0) from ${order} where ${order.customerId} = ${table.id})`.mapWith(
            Number,
          ),
        lastOrder: (table) =>
          sql`(select max(${order.createdAt}) from ${order} where ${order.customerId} = ${table.id})`.mapWith(
            (v) => (v == null ? null : new Date(v as string)),
          ),
      },
    });

    let nextCursor: string | undefined;
    if (customers.length > input.pageSize) {
      const next = customers.pop();
      nextCursor = next?.id;
    }

    return { items: customers, pageSize: input.pageSize, nextCursor };
  });
