import "./compression.polyfill";
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? process.env.PARENT_DATABASE_URL!,
    authToken: process.env.TURSO_GROUP_AUTH_TOKEN,
  },
});
