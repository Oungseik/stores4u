import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Api } from "../../api";
import type { HealthResponse } from "./api";

const healthResponse = { status: "ok" } satisfies typeof HealthResponse.Type;

export const HealthLive = HttpApiBuilder.group(Api, "Health", (handlers) =>
  handlers.handle("health", () => Effect.succeed(healthResponse)),
);
