import { category, connectShopDb, eq, productCategory } from "@repo/db";
import { z } from "zod";
import { SHOP_DATA_DIR } from "$env/static/private";
import { os } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(20),
});

export const listCategoriesHandler = os
  .route({ method: "GET" })
  .input(input)
  .handler(async ({ input }) => {
    const shopDb = connectShopDb(input.slug, SHOP_DATA_DIR);

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

    const items = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      productCount: category.productCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    return { items, pageSize: input.pageSize, nextCursor };
  });
