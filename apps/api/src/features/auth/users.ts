import { Context, Effect, Layer } from "effect";
import { Database } from "../../db/database";
import { type UserInsert, type UserSelect, users } from "../../db/schema";

export class Users extends Context.Service<
  Users,
  {
    readonly findByEmail: (email: string) => Effect.Effect<UserSelect | undefined>;
    readonly create: (input: UserInsert) => Effect.Effect<UserSelect>;
  }
>()("Users") {}

// drizzle bun-sqlite builders are thenable QueryPromises; wrap in Effect.promise.
export const UsersLive = Layer.effect(Users)(
  Effect.gen(function* () {
    const db = yield* Database;
    return {
      findByEmail: Effect.fn("Users.findByEmail")((email: string) =>
        Effect.promise(() => db.query.users.findFirst({ where: { email } })),
      ),
      create: Effect.fn("Users.create")((input: UserInsert) =>
        Effect.promise(() => db.insert(users).values(input).returning()).pipe(
          Effect.flatMap((res) => {
            const user = res.at(0);
            return user ? Effect.succeed(user) : Effect.die(new Error("Users.create returned no row"));
          }),
        ),
      ),
    };
  }),
);
