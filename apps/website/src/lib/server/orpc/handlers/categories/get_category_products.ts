import { z } from "zod";
import { db, eq, productCategory } from "$lib/server/db";
import { os, shopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  categoryId: z.string().min(1),
});

export const getCategoryProductsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .handler(async ({ input }) => {
    const rows = await db
      .select({ productId: productCategory.productId })
      .from(productCategory)
      .where(eq(productCategory.categoryId, input.categoryId));

    return { productIds: rows.map((r) => r.productId) };
  });
