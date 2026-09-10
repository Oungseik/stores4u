import { COMMON_ERROR_STATUS_MAP, ORPCError, onError, ValidationError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { BatchHandlerPlugin } from "@orpc/server/plugins";
import { router } from "$lib/server/orpc/router";
import type { RequestHandler } from "./$types";

const handler = new RPCHandler(router, {
  plugins: [new BatchHandlerPlugin()],
  errorStatusMap: {
    ...COMMON_ERROR_STATUS_MAP,
    INPUT_VALIDATION_FAILED: 422,
  },
  clientInterceptors: [
    onError((error) => {
      console.error(error);
      if (
        error instanceof ORPCError &&
        error.code === "BAD_REQUEST" &&
        error.cause instanceof ValidationError
      ) {
        throw new ORPCError("INPUT_VALIDATION_FAILED", {
          data: { key: "error_input_validation" },
          cause: error.cause,
        });
      }

      if (
        error instanceof ORPCError &&
        error.code === "INTERNAL_SERVER_ERROR" &&
        error.cause instanceof ValidationError
      ) {
        throw new ORPCError("OUTPUT_VALIDATION_FAILED", {
          data: { key: "something_went_wrong" },
          cause: error.cause,
        });
      }
    }),
  ],
});

const handle: RequestHandler = async ({ request, locals }) => {
  const { response } = await handler.handle(request, {
    prefix: "/rpc",
    context: { session: locals.session },
  });

  return response ?? new Response("Not Found", { status: 404 });
};

export const POST = handle;
