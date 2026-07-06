import { Database } from "bun:sqlite";
import { createDb } from "@repo/database";
import { DATABASE_PATH } from "$env/static/private";

export * from "@repo/database";

export const client = new Database(DATABASE_PATH);

export const db = createDb(client);
