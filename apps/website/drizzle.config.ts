import { defineConfig } from "drizzle-kit";
import "dotenv/config";

if (!process.env.AUTH_DATABASE_URL) throw new Error("AUTH_DATABASE_URL is not set");

export default defineConfig({
  schema: "./src/lib/server/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: process.env.AUTH_DATABASE_URL,
    authToken: process.env.TURSO_GROUP_AUTH_TOKEN,
  },
  verbose: true,
  strict: true,
});
