import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { getStoreMemory } from "$lib/server/mastra/_lib/memory";
import { os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  threadId: z.string().min(1),
});

export const deleteThreadHandler = os
  .input(input)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const memory = getStoreMemory();
    const thread = await memory.getThreadById({ threadId: input.threadId });
    if (!thread || thread.resourceId !== "store") {
      throw new ORPCError("NOT_FOUND", { message: "Thread not found" });
    }

    await memory.deleteThread(input.threadId);
    return { success: true };
  });
