import { Database } from "bun:sqlite";
import { DATABASE_PATH } from "$env/static/private";
import { createDb } from "@repo/database";

export * from "@repo/database";

export const client = new Database(DATABASE_PATH);

export const db = createDb(client);
