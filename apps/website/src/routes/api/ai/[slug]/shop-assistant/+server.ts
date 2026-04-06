import { handleChatStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { RequestContext } from "@mastra/core/request-context";
import { mastra } from "$lib/server/mastra";

export async function POST({
  request,
  params,
  locals,
}: {
  request: Request;
  params: Promise<{ slug: string }>;
  locals: App.Locals;
}) {
  if (!locals.session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { slug } = await params;

  let body: Awaited<ReturnType<Request["json"]>>;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  try {
    const requestContext = new RequestContext<{ slug: string }>();
    requestContext.set("slug", slug);

    const memory = {
      thread: body.threadId ?? crypto.randomUUID(),
      resource: slug,
    };

    const stream = await handleChatStream({
      mastra,
      agentId: "shopAssistantSupervisor",
      params: {
        ...body,
        requestContext,
      },
      defaultOptions: {
        memory,
        maxSteps: 10,
      },
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
