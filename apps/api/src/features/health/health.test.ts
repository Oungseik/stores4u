import { assert, describe, it } from "@effect/vitest";
import { Effect, FileSystem, Layer, Path } from "effect";
import { Etag, HttpPlatform } from "effect/unstable/http";
import { HttpApiTest } from "effect/unstable/httpapi";
import { Api } from "../../api";
import { HealthLive } from "./live";

const TestServices = Layer.mergeAll(Path.layer, Etag.layerWeak, HttpPlatform.layer).pipe(
  Layer.provideMerge(FileSystem.layerNoop({})),
);

describe("health", () => {
  it.layer(TestServices)((it) => {
    it.effect("GET /health returns status ok via the in-memory HttpApi client", () =>
      Effect.gen(function* () {
        const client = yield* HttpApiTest.groups(Api, ["Health"]).pipe(Effect.provide(HealthLive));
        const response = yield* client.Health.health({});
        assert.strictEqual(response.status, "ok");
      }),
    );
  });
});
