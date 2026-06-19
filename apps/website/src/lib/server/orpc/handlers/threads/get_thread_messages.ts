import { toAISdkV5Messages } from "@mastra/ai-sdk/ui";
import { z } from "zod";
import { getStoreMemory } from "$lib/server/mastra/_lib/memory";
import { os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  threadId: z.string().min(1),
});

export const getThreadMessagesHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const memory = getStoreMemory();

    const thread = await memory.getThreadById({ threadId: input.threadId });
    if (!thread || thread.resourceId !== "store") {
      return { messages: [] };
    }

    const result = await memory.recall({
      threadId: input.threadId,
      resourceId: "store",
      perPage: false,
    });

    const messages = toAISdkV5Messages(result.messages.filter((m) => m.role !== "system"));

    return { messages };
  });
