import { Layer } from "effect";
import { HttpServer } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { Api } from "./api";
import { HealthLive } from "./features/health/live";

export const ApiLive = HttpApiBuilder.layer(Api, {
  openapiPath: "/openapi.json"
}).pipe(
  Layer.provide(HealthLive),
  Layer.provide(HttpApiScalar.layer(Api, { path: "/docs" })),
  Layer.provide(HttpServer.layerServices)
);
