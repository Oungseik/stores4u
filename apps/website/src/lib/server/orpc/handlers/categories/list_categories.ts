import { connectShopDb } from "@repo/db";
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

    const items = await shopDb.query.category.findMany({
      where: input.cursor ? { id: { gte: input.cursor } } : undefined,
      limit: input.pageSize + 1,
      orderBy: { id: "asc" },
    });

    let nextCursor: string | undefined;
    if (items.length > input.pageSize) {
      const next = items.pop();
      nextCursor = next?.id;
    }

    return { items, pageSize: input.pageSize, nextCursor };
  });
