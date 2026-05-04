import { ORPCError } from "@orpc/server";
import { category, eq } from "@repo/perstore-db";
import { z } from "zod";
import {
  authMiddleware,
  os,
  protectedShopMiddleware,
  shopDbMiddleware,
} from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).nullable(),
});

export const updateCategoryHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
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
