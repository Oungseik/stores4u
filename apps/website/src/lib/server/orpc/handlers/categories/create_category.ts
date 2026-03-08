import { ORPCError } from "@orpc/server";
import { category, connectShopDb } from "@repo/db";
import { z } from "zod";
import { SHOP_DATA_DIR } from "$env/static/private";
import { authMiddleware, os } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
});

export const createCategoryHandler = os
  .use(authMiddleware)
  .input(input)
  .handler(async ({ input }) => {
    const shopDb = connectShopDb(input.slug, SHOP_DATA_DIR);

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
