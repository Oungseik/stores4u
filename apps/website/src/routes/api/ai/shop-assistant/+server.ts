import { handleChatStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { mastra } from "$lib/server/mastra";

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
      mastra,
      agentId: "shopAssistantAgent",
      params,
      version: "v6",
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("Shop assistant chat error:", error);
    return new Response(JSON.stringify({ error: "Failed to process chat message" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
