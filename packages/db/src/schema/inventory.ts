import { randomUUIDv7 } from "bun";
import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { invoiceItem } from "./invoice";
import { product } from "./product";

export const movementTypes = [
  "PURCHASE",
  "SALE",
  "RETURN",
  "WASTAGE",
  "ADJUSTMENT",
  "CORRECTION",
] as const;
export type MovementType = (typeof movementTypes)[number];

export const inventoryBatch = sqliteTable(
  "inventory_batch",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    productId: text("product_id")
      .notNull()
      .references(() => product.id),
    invoiceItemId: text("invoice_item_id").references(() => invoiceItem.id),
    qty: real("qty").notNull(),
    remainingQty: real("remaining_qty").notNull(),
    expiryDate: text("expiry_date"),
    batchNumber: text("batch_number"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [
    index("inventory_batch_product_expiry_created_available_idx")
      .on(t.productId, t.expiryDate, t.createdAt)
      .where(sql`${t.remainingQty} > 0`),
    index("inventory_batch_product_remaining_qty_idx").on(t.productId, t.remainingQty),
    index("inventory_batch_invoice_item_id_idx").on(t.invoiceItemId),
  ],
);

export const inventoryMovement = sqliteTable(
  "inventory_movement",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    productId: text("product_id")
      .notNull()
      .references(() => product.id),
    batchId: text("batch_id").references(() => inventoryBatch.id),
    invoiceItemId: text("invoice_item_id").references(() => invoiceItem.id),
    movementType: text("movement_type", { enum: movementTypes }).notNull(),
    qty: real("qty").notNull(),
    unitCostCents: integer("unit_cost_cents"),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    reason: text("reason"),
    occurredAt: text("occurred_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [
    index("inventory_movement_product_occurred_at_idx").on(t.productId, t.occurredAt),
    index("inventory_movement_reference_idx").on(t.referenceType, t.referenceId),
    index("inventory_movement_batch_id_idx").on(t.batchId),
    index("inventory_movement_invoice_item_id_idx").on(t.invoiceItemId),
  ],
);

export type InventoryBatchSelect = typeof inventoryBatch.$inferSelect;
export type InventoryBatchInsert = typeof inventoryBatch.$inferInsert;

export type InventoryMovementSelect = typeof inventoryMovement.$inferSelect;
export type InventoryMovementInsert = typeof inventoryMovement.$inferInsert;
