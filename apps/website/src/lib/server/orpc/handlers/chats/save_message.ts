import { ORPCError } from "@orpc/server";
import { chat, eq, message } from "@repo/db";
import { z } from "zod";

import { os, protectedShopMiddleware, shopDbMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  chatId: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const saveMessageHandler = os
  .input(input)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const inserted = await shopDb
      .insert(message)
      .values({
        chatId: input.chatId,
        role: input.role,
        content: input.content,
      })
      .returning();

    const created = inserted.at(0);
    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    await shopDb.update(chat).set({ updatedAt: new Date() }).where(eq(chat.id, input.chatId));

    return created;
  });
