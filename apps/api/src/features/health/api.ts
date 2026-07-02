import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi";

export const HealthResponse = Schema.Struct({
  status: Schema.Literal("ok"),
}).annotate({
  identifier: "HealthResponse",
  description: "API health check response",
});

export const HealthGroup = HttpApiGroup.make("Health").add(
  HttpApiEndpoint.get("health", "/health", {
    success: HealthResponse,
  }).annotateMerge(
    OpenApi.annotations({
      summary: "Check API health",
    }),
  ),
);
