import { z } from "zod";
import { getStoreMemory } from "$lib/server/mastra/_lib/memory";
import { os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  page: z.number().int().nonnegative().default(0),
  perPage: z.number().int().positive().default(12),
});

export const listThreadsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const memory = getStoreMemory();
    const result = await memory.listThreads({
      filter: { resourceId: "store" },
      orderBy: { field: "updatedAt", direction: "DESC" },
      page: input.page,
      perPage: input.perPage,
    });

    const items = result.threads.map((thread) => ({
      id: thread.id,
      title: thread.title || "New Chat",
      updatedAt: thread.updatedAt,
    }));

    return { items, hasMore: result.hasMore };
  });
