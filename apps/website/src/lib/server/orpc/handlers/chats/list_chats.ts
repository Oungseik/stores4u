import { z } from "zod";

import { os, protectedShopMiddleware, shopDbMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(12),
});

export const listChatsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const chats = await shopDb.query.chat.findMany({
      where: {
        id: input.cursor ? { lte: input.cursor } : undefined,
      },
      orderBy: { updatedAt: "desc" },
      limit: input.pageSize + 1,
    });

    let nextCursor: string | undefined;
    if (chats.length > input.pageSize) {
      const next = chats.pop();
      nextCursor = next?.id;
    }

    return { items: chats, pageSize: input.pageSize, nextCursor };
  });
