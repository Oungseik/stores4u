import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { category, db, eq, productCategory } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  id: z.string().min(1),
});

export const deleteCategoryHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const existingProducts = await db
      .select()
      .from(productCategory)
      .where(eq(productCategory.categoryId, input.id))
      .limit(1);

    if (existingProducts.length > 0) {
      throw new ORPCError("FORBIDDEN", {
        message: "Cannot delete category with associated products.",
      });
    }

    await db.delete(category).where(eq(category.id, input.id));
  });
