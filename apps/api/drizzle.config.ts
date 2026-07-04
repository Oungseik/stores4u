import { defineConfig } from "drizzle-kit";

if (!process.env.API_DATABASE_PATH) throw new Error("API_DATABASE_PATH is not set");

export default defineConfig({
  schema: "./src/db/schema",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${process.env.API_DATABASE_PATH}`,
  },
  verbose: true,
  strict: true,
});
