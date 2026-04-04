import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { os, protectedShopMiddleware, shopDbMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  chatId: z.string().min(1),
});

export const getChatHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const chat = await shopDb.query.chat.findFirst({
      where: { id: input.chatId },
      with: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!chat) {
      throw new ORPCError("NOT_FOUND", { message: "Chat not found" });
    }

    return chat;
  });
