import { connect } from "@tursodatabase/sync";
import { drizzle } from "drizzle-orm/tursodatabase/database";
import { AUTH_DB_PATH } from "$env/static/private";
import * as schema from "./schema";

export * from "./schema";

export const client = await connect({
  path: AUTH_DB_PATH,
});

export const db = drizzle({ client, schema, relations: schema.relations });
