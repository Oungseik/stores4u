import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { product } from "./product";

export const supplier = sqliteTable("supplier", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"),
  phone2: text("phone2"),
  email: text("email"),
  address: text("address"),
  paymentTerms: text("payment_terms"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
    .notNull(),
});

export const productSupplier = sqliteTable(
  "product_supplier",
  {
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => supplier.id, { onDelete: "cascade" }),
    isPreferred: text("is_preferred", { enum: ["0", "1"] })
      .default("0")
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.supplierId] }),
    index("product_supplier_supplier_id_idx").on(t.supplierId),
  ],
);

export type SupplierSelect = typeof supplier.$inferSelect;
export type SupplierInsert = typeof supplier.$inferInsert;

export type ProductSupplierSelect = typeof productSupplier.$inferSelect;
export type ProductSupplierInsert = typeof productSupplier.$inferInsert;
