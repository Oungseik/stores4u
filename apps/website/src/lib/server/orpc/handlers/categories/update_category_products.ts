import { eq, productCategory } from "@repo/db";
import { z } from "zod";
import { os, protectedShopMiddleware, shopDbMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  categoryId: z.string().min(1),
  productIds: z.array(z.string().min(1)),
});

export const updateCategoryProductsHandler = os
  .input(input)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
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
