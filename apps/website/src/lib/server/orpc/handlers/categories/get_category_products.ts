import { eq, productCategory } from "@repo/db";
import { z } from "zod";
import { os, shopDbMiddleware, shopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  categoryId: z.string().min(1),
});

export const getCategoryProductsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const rows = await shopDb
      .select({ productId: productCategory.productId })
      .from(productCategory)
      .where(eq(productCategory.categoryId, input.categoryId));

    return { productIds: rows.map((r) => r.productId) };
  });
