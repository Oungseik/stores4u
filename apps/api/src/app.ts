import { Effect, Layer, Schema } from "effect";
import { HttpServer } from "effect/unstable/http";
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiScalar,
  OpenApi
} from "effect/unstable/httpapi";

const HealthResponse = Schema.Struct({
  status: Schema.Literal("ok")
}).annotate({
  identifier: "HealthResponse",
  description: "API health check response"
});

const Api = HttpApi.make("Stores4uApi")
  .add(
    HttpApiGroup.make("Health").add(
      HttpApiEndpoint.get("health", "/health", {
        success: HealthResponse
      }).annotateMerge(
        OpenApi.annotations({
          summary: "Check API health"
        })
      )
    )
  )
  .annotateMerge(
    OpenApi.annotations({
      title: "Stores4U API",
      version: "0.0.1"
    })
  );

const healthResponse = { status: "ok" } satisfies typeof HealthResponse.Type;

const HealthLive = HttpApiBuilder.group(Api, "Health", (handlers) =>
  handlers.handle("health", () => Effect.succeed(healthResponse))
);

export const ApiLive = HttpApiBuilder.layer(Api, {
  openapiPath: "/openapi.json"
}).pipe(
  Layer.provide(HealthLive),
  Layer.provide(HttpApiScalar.layer(Api, { path: "/docs" })),
  Layer.provide(HttpServer.layerServices)
);
