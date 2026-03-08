import "./compression.polyfill";
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.PARENT_DATABASE_URL!,
  },
});
