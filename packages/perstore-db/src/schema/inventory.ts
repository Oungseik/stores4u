import { randomUUIDv7 } from "bun";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { product } from "./product";
import { purchaseInvoiceItem } from "./purchaseInvoice";

export const movementTypes = [
  "PURCHASE",
  "SALE",
  "RETURN",
  "WASTAGE",
  "ADJUSTMENT",
  "CORRECTION",
] as const;
export type MovementType = (typeof movementTypes)[number];

export const referenceTypes = ["ORDER", "PURCHASE_INVOICE", "MANUAL"] as const;
export type ReferenceType = (typeof referenceTypes)[number];

export const inventoryMovement = sqliteTable(
  "inventory_movement",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    productId: text("product_id")
      .notNull()
      .references(() => product.id),
    purchaseInvoiceItemId: text("purchase_invoice_item_id").references(
      () => purchaseInvoiceItem.id,
    ),
    movementType: text("movement_type", { enum: movementTypes }).notNull(),
    qty: real("qty").notNull(),
    unitCostCents: integer("unit_cost_cents"),
    referenceType: text("reference_type", { enum: referenceTypes }).notNull(),
    referenceId: text("reference_id"),
    reason: text("reason"),
    occurredAt: integer("occurred_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("inventory_movement_product_occurred_at_idx").on(t.productId, t.occurredAt),
    index("inventory_movement_reference_idx").on(t.referenceType, t.referenceId),
    index("inventory_movement_purchase_invoice_item_id_idx").on(t.purchaseInvoiceItemId),
  ],
);

export type InventoryMovementSelect = typeof inventoryMovement.$inferSelect;
export type InventoryMovementInsert = typeof inventoryMovement.$inferInsert;
