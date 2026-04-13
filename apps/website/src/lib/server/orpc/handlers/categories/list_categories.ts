import { eq, productCategory } from "@repo/db";
import { z } from "zod";
import { os, shopDbMiddleware, shopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(12),
});

export const listCategoriesHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const categories = await shopDb.query.category.findMany({
      where: input.cursor ? { id: { gte: input.cursor } } : undefined,
      limit: input.pageSize + 1,
      extras: {
        productCount: (table) =>
          shopDb.$count(productCategory, eq(productCategory.categoryId, table.id)),
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
