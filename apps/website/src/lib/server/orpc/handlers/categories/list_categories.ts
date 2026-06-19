import { z } from "zod";
import { db, eq, productCategory } from "$lib/server/db";
import { os, shopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(12),
});

export const listCategoriesHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .handler(async ({ input }) => {
    const categories = await db.query.category.findMany({
      where: input.cursor ? { id: { gte: input.cursor } } : undefined,
      limit: input.pageSize + 1,
      extras: {
        productCount: (table) =>
          db.$count(productCategory, eq(productCategory.categoryId, table.id)),
      },
      orderBy: { id: "asc" },
    });

    let nextCursor: string | undefined;
    if (categories.length > input.pageSize) {
      const next = categories.pop();
      nextCursor = next?.id;
    }

    const items = categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      productCount: c.productCount,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return { items, pageSize: input.pageSize, nextCursor };
  });
