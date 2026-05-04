import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const url = process.env.SHOP_DB_URL;
const authToken = process.env.SHOP_DB_TOKEN;

if (!url) throw new Error("SHOP_DB_URL is not set");
if (!authToken) throw new Error("SHOP_DB_TOKEN is not set");

export default defineConfig({
  schema: "../../packages/perstore-db/src/schema",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken,
  },
  verbose: true,
  strict: true,
});
