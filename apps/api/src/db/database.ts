import { Database as SqliteClient } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { Context, Effect, Layer } from "effect";
import { relations } from "./schema";

const makeDb = (path: string) => {
  const client = new SqliteClient(path);
  const db = drizzle({ client, relations });
  migrate(db, { migrationsFolder: "./drizzle" });
  return db;
};

// ponytail: migrations folded into the layer (live + in-memory test paths both start
// schema'd). No acquireRelease: the DB stays open for the layer's lifetime — the
// double-build in app/test wiring would close a scoped DB before the handler runs.
// Add acquireRelease + a single marker-aware provision path when this becomes real.
export class Database extends Context.Service<Database, ReturnType<typeof makeDb>>()("Database") {}

export const DatabaseLive = Layer.effect(Database)(
  Effect.sync(() => makeDb(Bun.env.API_DATABASE_PATH ?? "")),
);

export const DatabaseTest = Layer.effect(Database)(Effect.sync(() => makeDb(":memory:")));
