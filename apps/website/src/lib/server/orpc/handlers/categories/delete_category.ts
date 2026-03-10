import { ORPCError } from "@orpc/server";
import { category, eq, productCategory } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  id: z.string().min(1),
});

export const deleteCategoryHandler = os
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const existingProducts = await shopDb
      .select()
      .from(productCategory)
      .where(eq(productCategory.categoryId, input.id))
      .limit(1);

    if (existingProducts.length > 0) {
      throw new ORPCError("FORBIDDEN", {
        message: "Cannot delete category with associated products.",
      });
    }

    await shopDb.delete(category).where(eq(category.id, input.id));
  });
