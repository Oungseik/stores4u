import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { category, db, eq } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).nullable(),
});

export const updateCategoryHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const updated = await db
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
