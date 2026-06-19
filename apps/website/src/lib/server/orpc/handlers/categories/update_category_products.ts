import { z } from "zod";
import { db, eq, productCategory } from "$lib/server/db";
import { os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  categoryId: z.string().min(1),
  productIds: z.array(z.string().min(1)),
});

export const updateCategoryProductsHandler = os
  .input(input)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    await db.delete(productCategory).where(eq(productCategory.categoryId, input.categoryId));

    if (input.productIds.length > 0) {
      await db.insert(productCategory).values(
        input.productIds.map((productId) => ({
          productId,
          categoryId: input.categoryId,
        })),
      );
    }

    return { success: true };
  });
