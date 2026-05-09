import { randomUUIDv7 } from "bun";
import { index, integer, primaryKey, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

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
    .$onUpdateFn(() => new Date())
    .notNull(),
});

export const product = sqliteTable(
  "product",
  {
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
    stock: integer("stock").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(10),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (t) => [index("product_sku_idx").on(t.sku), index("product_name_idx").on(t.name)],
);

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

export const productAlias = sqliteTable(
  "product_alias",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    alias: text("alias").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("product_alias_product_id_idx").on(t.productId),
    unique("product_alias_product_id_alias_unique").on(t.productId, t.alias),
  ],
);

export const productImage = sqliteTable(
  "product_image",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    objectPath: text("object_path").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("product_image_product_id_idx").on(t.productId),
    unique("product_image_product_id_object_path_unique").on(t.productId, t.objectPath),
  ],
);

export type CategorySelect = typeof category.$inferSelect;
export type CategoryInsert = typeof category.$inferInsert;

export type ProductSelect = typeof product.$inferSelect;
export type ProductInsert = typeof product.$inferInsert;

export type ProductCategorySelect = typeof productCategory.$inferSelect;
export type ProductCategoryInsert = typeof productCategory.$inferInsert;

export type ProductAliasSelect = typeof productAlias.$inferSelect;
export type ProductAliasInsert = typeof productAlias.$inferInsert;

export type ProductImageSelect = typeof productImage.$inferSelect;
export type ProductImageInsert = typeof productImage.$inferInsert;
