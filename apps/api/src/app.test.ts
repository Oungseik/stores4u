import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { ApiLive } from "./app";

describe("GET /health", () => {
  it.effect("returns the health response", () =>
    Effect.scoped(
      Effect.gen(function* () {
        const { handler } = yield* Effect.acquireRelease(
          Effect.sync(() =>
            HttpRouter.toWebHandler(ApiLive, { disableLogger: true })
          ),
          ({ dispose }) => Effect.promise(() => dispose())
        );

        const response = yield* Effect.promise(() =>
          handler(new Request("http://api.test/health"))
        );
        const body = yield* Effect.promise(() => response.text());

        assert.strictEqual(response.status, 200);
        assert.strictEqual(body, "{\"status\":\"ok\"}");
      })
    )
  );
});
