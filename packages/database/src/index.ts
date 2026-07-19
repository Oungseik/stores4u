import type { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { relations } from "./schema";

export * from "drizzle-orm";
export * from "./database-path";
export * from "./schema";

/** Build the single Drizzle instance over a `bun:sqlite` client. */
export function createDb(client: Database) {
  // SQLite ships with PRAGMA foreign_keys OFF and bun:sqlite doesn't flip it;
  // drizzle won't either. Set it here so every consumer (app + scripts) gets
  // the schema's declared references() + onDelete rules enforced — without
  // this, cascades silently don't fire and deletes orphan children.
  client.exec("PRAGMA foreign_keys = ON;");
  return drizzle({ client, relations });
}
