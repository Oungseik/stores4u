import { createClient } from "@libsql/client/web";
import { createDb } from "@repo/database";
import { building } from "$app/environment";
import { env } from "$env/dynamic/private";

export * from "@repo/database";

if (!env.TURSO_DATABASE_URL && !building) throw new Error("TURSO_DATABASE_URL is not set");
if (!env.TURSO_AUTH_TOKEN && !building) throw new Error("TURSO_AUTH_TOKEN is not set");

export const client = createClient({
  url: env.TURSO_DATABASE_URL || "http://localhost",
  authToken: env.TURSO_AUTH_TOKEN,
});

export const db = createDb(client);
