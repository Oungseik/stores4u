import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { Api } from "../../api";
import { DatabaseLive } from "../../db/database";
import { PasswordHasher, PasswordHasherLive } from "./password-hasher";
import { Users, UsersLive } from "./users";

export const AuthGroupLive = HttpApiBuilder.group(Api, "Auth", (handlers) =>
  handlers.handle("signup", ({ payload }) =>
    Effect.gen(function* () {
      const users = yield* Users;
      const existing = yield* users.findByEmail(payload.email);
      if (existing) {
        return yield* Effect.fail(new HttpApiError.Conflict({}));
      }
      const hasher = yield* PasswordHasher;
      const passwordHash = yield* hasher.hash(payload.password);
      const created = yield* users.create({ email: payload.email, passwordHash });
      return { id: created.id, email: created.email };
    }),
  ),
);

const AuthServices = Layer.mergeAll(
  Layer.provideMerge(UsersLive, DatabaseLive),
  PasswordHasherLive,
);

// Layer.provide captures deps in the group's build context (runtime).
// provideRequest subtracts the Request<"Requires"> markers v4 puts on handler deps (type);
// toWebHandler rejects layers that still carry them.
// ponytail: services built twice (once per operator); unify if Effect adds marker-aware provision.
export const AuthHandler = HttpRouter.provideRequest(AuthServices)(
  Layer.provide(AuthGroupLive, AuthServices),
);
