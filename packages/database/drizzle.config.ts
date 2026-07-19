import { defineConfig } from "drizzle-kit";
import { resolveDatabasePath } from "./src/database-path";

if (!process.env.DATABASE_PATH) throw new Error("DATABASE_PATH is not set");
const databasePath = resolveDatabasePath(process.env.DATABASE_PATH);

export default defineConfig({
  schema: "./src/schema",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${databasePath}`,
  },
  verbose: true,
  strict: true,
});
