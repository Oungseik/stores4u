import type { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { relations } from "./schema";

export * from "drizzle-orm";
export * from "./schema";

/** Build the single Drizzle instance over a `bun:sqlite` client. */
export function createDb(client: Database) {
  return drizzle({ client, relations });
}
