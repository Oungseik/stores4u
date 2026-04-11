import { eq, productCategory } from "@repo/db";
import { z } from "zod";
import { os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  categoryId: z.string().min(1),
  productIds: z.array(z.string().min(1)),
});

export const updateCategoryProductsHandler = os
  .input(input)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    await shopDb.delete(productCategory).where(eq(productCategory.categoryId, input.categoryId));

    if (input.productIds.length > 0) {
      await shopDb.insert(productCategory).values(
        input.productIds.map((productId) => ({
          productId,
          categoryId: input.categoryId,
        })),
      );
    }

    return { success: true };
  });
