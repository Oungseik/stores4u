import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_PATH) throw new Error("DATABASE_PATH is not set");

export default defineConfig({
  schema: "./src/schema",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${process.env.DATABASE_PATH}`,
  },
  verbose: true,
  strict: true,
});
