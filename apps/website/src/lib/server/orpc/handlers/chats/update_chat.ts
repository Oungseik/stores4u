import { chat, eq } from "@repo/db";
import { z } from "zod";

import { os, protectedShopMiddleware, shopDbMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  chatId: z.string().min(1),
  title: z.string().min(1).max(200),
});

export const updateChatHandler = os
  .input(input)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    await shopDb
      .update(chat)
      .set({ title: input.title, updatedAt: new Date() })
      .where(eq(chat.id, input.chatId));

    return { success: true };
  });
