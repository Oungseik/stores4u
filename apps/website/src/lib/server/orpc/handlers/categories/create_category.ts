import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { category, db } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
});

export const createCategoryHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const inserted = await db
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
