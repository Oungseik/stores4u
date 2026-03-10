import { randomUUIDv7 } from "bun";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const setting = sqliteTable("setting", {
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
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type SettingSelect = typeof setting.$inferSelect;
export type SettingInsert = typeof setting.$inferInsert;

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
