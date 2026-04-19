import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { createShopMemory } from "$lib/server/mastra/_lib/memory";

const input = z.object({
  slug: z.string().min(1).max(100),
  threadId: z.string().min(1),
});

export const getThreadMessagesHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const memory = createShopMemory(input.slug);

    const thread = await memory.getThreadById({ threadId: input.threadId });
    if (!thread || thread.resourceId !== input.slug) {
      return { messages: [] };
    }

    const result = await memory.recall({
      threadId: input.threadId,
      resourceId: input.slug,
      perPage: false,
    });

    const messages = result.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        parts: m.content.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => ({ type: "text" as const, text: p.text })),
      }));

    return { messages };
  });
