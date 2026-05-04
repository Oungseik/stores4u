import { ORPCError } from "@orpc/server";
import { category } from "@repo/perstore-db";
import { z } from "zod";
import {
  authMiddleware,
  os,
  protectedShopMiddleware,
  shopDbMiddleware,
} from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
});

export const createCategoryHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const inserted = await shopDb
      .insert(category)
      .values({
        name: input.name,
        description: input.description,
      })
      .returning();

    const created = inserted.at(0);
    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return created;
  });
