import { randomUUIDv7 } from "bun";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export const image = sqliteTable("image", {
  objectPath: text("object_path").primaryKey(),
  filename: text("filename").notNull(),
  type: text("type").notNull().default("image/webp"),
  size: integer("size").notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type ImageSelect = typeof image.$inferSelect;
export type ImageInsert = typeof image.$inferInsert;
