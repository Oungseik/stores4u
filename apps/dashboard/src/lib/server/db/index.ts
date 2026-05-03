import { connect } from "@tursodatabase/sync";
import { drizzle } from "drizzle-orm/tursodatabase/database";
import { DASHBOARD_DB_PATH, DASHBOARD_DB_TOKEN, DASHBOARD_DB_URL } from "$env/static/private";
import * as schema from "./schema";

export const client = await connect({
  path: DASHBOARD_DB_PATH,
  url: DASHBOARD_DB_URL,
  authToken: DASHBOARD_DB_TOKEN,
  partialSyncExperimental: {
    bootstrapStrategy: { kind: "prefix", length: 128 * 1024 },
    prefetch: true,
  },
});

export const db = drizzle({ client: client, schema, relations: schema.relations });
