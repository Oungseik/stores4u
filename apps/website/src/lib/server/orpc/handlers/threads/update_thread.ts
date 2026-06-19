import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { getStoreMemory } from "$lib/server/mastra/_lib/memory";
import { os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  threadId: z.string().min(1),
  title: z.string().min(1).max(200),
});

export const updateThreadHandler = os
  .input(input)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const memory = getStoreMemory();
    const thread = await memory.getThreadById({ threadId: input.threadId });
    if (!thread || thread.resourceId !== "store") {
      throw new ORPCError("NOT_FOUND", { message: "Thread not found" });
    }

    const updated = await memory.updateThread({
      id: input.threadId,
      title: input.title,
      metadata: thread.metadata ?? {},
    });

    return {
      id: updated.id,
      title: updated.title ?? "New Chat",
      updatedAt: updated.updatedAt,
    };
  });
