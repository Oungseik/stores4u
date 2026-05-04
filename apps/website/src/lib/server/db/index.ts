import { connect } from "@tursodatabase/sync";
import { drizzle } from "drizzle-orm/tursodatabase/database";
import { AUTH_DB_PATH, AUTH_DATABASE_URL, AUTH_DB_TOKEN } from "$env/static/private";
import * as schema from "./schema";

export * from "./schema";

export const client = await connect({
  path: AUTH_DB_PATH,
  url: AUTH_DATABASE_URL,
  authToken: AUTH_DB_TOKEN,
  partialSyncExperimental: {
    bootstrapStrategy: { kind: "prefix", length: 128 * 1024 },
    prefetch: true,
  },
});

export const db = drizzle({ client: client, schema, relations: schema.relations });
