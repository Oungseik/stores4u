import { COUNTRIES, CURRENCIES } from "@repo/config";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { organization } from "./auth.schema";

export const shopInfo = sqliteTable("shopInfo", {
  organizationId: text("organization_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  logo: text("logo"),
  title: text("title").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country", { enum: COUNTRIES }).notNull(),
  currency: text("currency", { enum: CURRENCIES }).notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  taxId: text("tax_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(cast(unixepoch() as int))`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(cast(unixepoch() as int))`),
});
