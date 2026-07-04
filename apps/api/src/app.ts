import { Layer } from "effect";
import { HttpServer } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { Api } from "./api";
import { AuthHandler } from "./features/auth/live";
import { HealthLive } from "./features/health/live";

export const ApiLive = HttpApiBuilder.layer(Api, {
  openapiPath: "/openapi.json",
}).pipe(
  Layer.provide(HealthLive),
  Layer.provide(AuthHandler),
  Layer.provide(HttpApiScalar.layer(Api, { path: "/docs" })),
  Layer.provide(HttpServer.layerServices),
);
