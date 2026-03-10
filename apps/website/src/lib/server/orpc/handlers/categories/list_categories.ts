import { category, eq, productCategory } from "@repo/db";
import { z } from "zod";
import { os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(20),
});

export const listCategoriesHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const categories = await shopDb.query.category.findMany({
      where: input.cursor ? { id: { gte: input.cursor } } : undefined,
      limit: input.pageSize + 1,
      extras: {
        productCount: shopDb.$count(productCategory, eq(productCategory.categoryId, category.id)),
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
