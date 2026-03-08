import { randomUUIDv7 } from "bun";
import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const shopSetting = sqliteTable("shop_setting", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  logo: text("logo"),
  heroImage: text("hero_image"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  region: text("region"),
  country: text("country"),
  phone: text("phone").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type ShopSettingSelect = typeof shopSetting.$inferSelect;
export type ShopSettingInsert = typeof shopSetting.$inferInsert;
