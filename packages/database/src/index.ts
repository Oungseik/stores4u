import type { Client } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql/web";
import { relations } from "./schema";

export * from "drizzle-orm";
export * from "./schema";

/** Build the single Drizzle instance over a Turso/libSQL client. */
export function createDb(client: Client) {
  return drizzle({ client, relations });
}
