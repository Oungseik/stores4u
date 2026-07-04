import { Context, Effect, Layer } from "effect";

export class PasswordHasher extends Context.Service<
  PasswordHasher,
  {
    readonly hash: (plain: string) => Effect.Effect<string>;
  }
>()("PasswordHasher") {}

// Bun.password defaults to argon2id; hash is a self-describing PHC string.
export const PasswordHasherLive = Layer.succeed(PasswordHasher)({
  hash: Effect.fn("PasswordHasher.hash")((plain: string) =>
    Effect.promise(() => Bun.password.hash(plain)),
  ),
});

// ponytail: deterministic stub for tests/manual layer-swap exploration.
export const PasswordHasherTest = Layer.succeed(PasswordHasher)({
  hash: (plain: string) => Effect.succeed(`hashed:${plain}`),
});
