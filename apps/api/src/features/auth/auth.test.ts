import { assert, describe, it } from "@effect/vitest";
import { Effect, FileSystem, Layer, Path } from "effect";
import { Etag, HttpPlatform, HttpRouter } from "effect/unstable/http";
import { HttpApiTest } from "effect/unstable/httpapi";
import { Api } from "../../api";
import { DatabaseTest } from "../../db/database";
import { AuthGroupLive } from "./live";
import { PasswordHasherTest } from "./password-hasher";
import { UsersLive } from "./users";

const TestServices = Layer.mergeAll(Path.layer, Etag.layerWeak, HttpPlatform.layer).pipe(
  Layer.provideMerge(FileSystem.layerNoop({})),
);

const AuthServices = Layer.mergeAll(
  Layer.provideMerge(UsersLive, DatabaseTest),
  PasswordHasherTest,
);

// Layer.provide captures deps in the group build context (runtime);
// provideRequest subtracts the v4 Request<"Requires"> markers (type).
// ponytail: services built twice; unify if Effect adds marker-aware provision.
const AuthHandler = HttpRouter.provideRequest(AuthServices)(
  Layer.provide(AuthGroupLive, AuthServices),
);

describe("auth", () => {
  it.layer(TestServices)((it) => {
    it.effect("POST /signup creates a user and returns id + email without passwordHash", () =>
      Effect.gen(function* () {
        const client = yield* HttpApiTest.groups(Api, ["Auth"]).pipe(Effect.provide(AuthHandler));
        const res = yield* client.Auth.signup({
          payload: {
            email: "a@b.com",
            password: "password123",
          },
        });
        assert.strictEqual(typeof res.id, "string");
        assert.ok(res.id.length > 0);
        assert.strictEqual(res.email, "a@b.com");
        assert.ok(!("passwordHash" in res));
      }),
    );
  });
});
