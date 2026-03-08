import { randomUUIDv7 } from "bun";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const category = sqliteTable("category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const product = sqliteTable("product", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
  barcode: text("barcode").unique(),
  description: text("description"),
  uom: text("uom").notNull(),
  priceCents: integer("price_cents").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const productCategory = sqliteTable(
  "product_category",
  {
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.categoryId] }),
    index("product_category_category_id_idx").on(t.categoryId),
  ],
);

export type CategorySelect = typeof category.$inferSelect;
export type CategoryInsert = typeof category.$inferInsert;

export type ProductSelect = typeof product.$inferSelect;
export type ProductInsert = typeof product.$inferInsert;

export type ProductCategorySelect = typeof productCategory.$inferSelect;
export type ProductCategoryInsert = typeof productCategory.$inferInsert;
