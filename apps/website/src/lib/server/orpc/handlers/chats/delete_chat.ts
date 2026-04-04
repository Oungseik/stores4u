import { ORPCError } from "@orpc/server";
import { chat, eq } from "@repo/db";
import { z } from "zod";

import { os, protectedShopMiddleware, shopDbMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  chatId: z.string().min(1),
});

export const deleteChatHandler = os
  .input(input)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const result = await shopDb.delete(chat).where(eq(chat.id, input.chatId));

    if (!result.rowsAffected) {
      throw new ORPCError("NOT_FOUND", { message: "Chat not found" });
    }

    return { success: true };
  });
