import { defineConfig } from "drizzle-kit";
import "dotenv/config";

if (!process.env.AUTH_DB_PATH) throw new Error("AUTH_DB_PATH is not set");

export default defineConfig({
  schema: "./src/lib/server/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${process.env.AUTH_DB_PATH}`,
  },
  verbose: true,
  strict: true,
});
