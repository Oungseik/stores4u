import { handleChatStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { mastra } from "$lib/server/mastra";

/** Stable resource id for the single store's chat memory. */
const STORE_RESOURCE_ID = "store";

export async function POST({
  request,
  locals,
}: {
  request: Request;
  locals: App.Locals;
}) {
  if (!locals.session) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: Awaited<ReturnType<Request["json"]>>;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  try {
    const stream = await handleChatStream({
      mastra,
      agentId: "shopAssistantSupervisor",
      params: body,
      defaultOptions: {
        memory: {
          thread: body.threadId ?? crypto.randomUUID(),
          resource: STORE_RESOURCE_ID,
        },
        maxSteps: 10,
      },
      version: "v6",
      sendReasoning: true,
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
