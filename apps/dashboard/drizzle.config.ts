import { defineConfig } from "drizzle-kit";
import "dotenv/config";

if (!process.env.DASHBOARD_DB_PATH) throw new Error("DASHBOARD_DB_PATH is not set");

export default defineConfig({
  schema: "./src/lib/server/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DASHBOARD_DB_PATH,
    authToken: process.env.DASHBOARD_DB_TOKEN,
  },
  verbose: true,
  strict: true,
});
