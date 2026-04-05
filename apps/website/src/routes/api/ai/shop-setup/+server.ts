import { handleChatStream } from "@mastra/ai-sdk";
import { Mastra } from "@mastra/core";
import { createUIMessageStreamResponse } from "ai";

import { shopSetupAgent } from "$lib/server/mastra/shop-setup-agent";

const setupMastra = new Mastra({
  agents: { shopSetupAgent },
});

export async function POST({ request, locals }: { request: Request; locals: App.Locals }) {
  if (!locals.session) {
    return new Response("Unauthorized", { status: 401 });
  }

  let params: Awaited<ReturnType<Request["json"]>>;
  try {
    params = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  try {
    const stream = await handleChatStream({
      mastra: setupMastra,
      agentId: "shopSetupAgent",
      params,
      version: "v6",
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("Shop setup chat error:", error);
    return new Response(JSON.stringify({ error: "Failed to process chat message" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
