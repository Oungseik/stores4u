import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { AUTH_DB_PATH } from "$env/static/private";
import * as schema from "./schema";

export * from "./schema";

export const client = new Database(AUTH_DB_PATH);

export const db = drizzle({ client, schema, relations: schema.relations });
