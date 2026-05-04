import { COUNTRIES } from "@repo/config";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { shop } from "./auth.schema";

export const shopInfo = sqliteTable("shopInfo", {
  shopId: text("shop_id")
    .primaryKey()
    .references(() => shop.id, { onDelete: "cascade" }),
  logo: text("logo"),
  title: text("title").notNull(),
  description: text("description"),
  heroImage: text("hero_image"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country", { enum: COUNTRIES }).notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  taxId: text("tax_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type ShopInfoSelect = typeof shopInfo.$inferSelect;
export type ShopInfoInsert = typeof shopInfo.$inferInsert;
