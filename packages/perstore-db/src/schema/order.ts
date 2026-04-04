import { randomUUIDv7 } from "bun";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { product } from "./product";

/**
 * This order is only related to the orders when customer buy the stock.
 * Not for the order we make to the suppliers when refill the stock.
 */
export const order = sqliteTable(
  "order",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    customerName: text("customer_name"),
    customerPhone: text("customer_phone"),
    subtotalCents: integer("subtotal_cents").default(0).notNull(),
    discountCents: integer("discount_cents").default(0).notNull(),
    vatCents: integer("vat_cents").default(0).notNull(),
    totalCents: integer("total_cents").notNull(),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index("order_created_at_idx").on(t.createdAt)],
);

export const orderItem = sqliteTable(
  "order_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id),
    qty: real("qty").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("order_item_order_id_idx").on(t.orderId),
    index("order_item_product_id_idx").on(t.productId),
  ],
);

export type OrderSelect = typeof order.$inferSelect;
export type OrderInsert = typeof order.$inferInsert;

export type OrderItemSelect = typeof orderItem.$inferSelect;
export type OrderItemInsert = typeof orderItem.$inferInsert;
