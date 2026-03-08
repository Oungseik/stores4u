import { ORPCError } from "@orpc/server";
import { category, connectShopDb, eq } from "@repo/db";
import { z } from "zod";
import { SHOP_DATA_DIR } from "$env/static/private";
import { authMiddleware, os } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).nullable(),
});

export const updateCategoryHandler = os
  .use(authMiddleware)
  .input(input)
  .handler(async ({ input }) => {
    const shopDb = connectShopDb(input.slug, SHOP_DATA_DIR);

    const updated = await shopDb
      .update(category)
      .set({
        name: input.name,
        description: input.description,
      })
      .where(eq(category.id, input.id))
      .returning();

    const result = updated.at(0);
    if (!result) {
      throw new ORPCError("NOT_FOUND");
    }

    return result;
  });
