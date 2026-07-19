import { Database } from "bun:sqlite";
import { createDb, resolveDatabasePath } from "@repo/database";
import { DATABASE_PATH } from "$env/static/private";

export * from "@repo/database";

export const client = new Database(resolveDatabasePath(DATABASE_PATH));

export const db = createDb(client);
