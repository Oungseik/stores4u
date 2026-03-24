import { ORPCError } from "@orpc/server";
import { category } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
});

export const createCategoryHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const inserted = await shopDb
      .insert(category)
      .values({
        name: input.name,
        description: input.description,
      })
      .returning();

    const created = inserted.at(0);
    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return created;
  });
