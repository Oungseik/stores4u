import { ORPCError } from "@orpc/server";
import { chat } from "@repo/db";
import { z } from "zod";

import { os, protectedShopMiddleware, shopDbMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200).optional(),
});

export const createChatHandler = os
  .input(input)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const inserted = await shopDb
      .insert(chat)
      .values({ title: input.title ?? "New Chat" })
      .returning();

    const created = inserted.at(0);
    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return created;
  });
