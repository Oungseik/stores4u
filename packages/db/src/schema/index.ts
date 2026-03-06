import { randomUUIDv7 } from "bun";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

export const invoiceStatuses = ["PENDING", "VALIDATED", "REJECTED", "AUTO_ACCEPTED"] as const;
export type InvoiceStatus = (typeof invoiceStatuses)[number];

export const ocrStatuses = ["PENDING", "PROCESSED", "FAILED", "LINKED"] as const;
export type OcrStatus = (typeof ocrStatuses)[number];

export const movementTypes = [
  "PURCHASE",
  "SALE",
  "RETURN",
  "WASTAGE",
  "ADJUSTMENT",
  "CORRECTION",
] as const;
export type MovementType = (typeof movementTypes)[number];

export const category = sqliteTable("category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const product = sqliteTable("product", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  barcode: text("barcode").unique(),
  description: text("description"),
  uom: text("uom").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
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

export const supplier = sqliteTable("supplier", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  paymentTerms: text("payment_terms"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
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
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.supplierId] }),
    index("product_supplier_supplier_id_idx").on(t.supplierId),
  ],
);

export const invoiceOcrResult = sqliteTable(
  "invoice_ocr_result",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    photoUrl: text("photo_url").notNull(),
    rawJson: text("raw_json").notNull(),
    extractedText: text("extracted_text"),
    extractedData: text("extracted_data"),
    confidenceScore: real("confidence_score"),
    status: text("status", { enum: ocrStatuses }).default("PENDING").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [
    check(
      "invoice_ocr_result_confidence_score_check",
      sql`${t.confidenceScore} IS NULL OR (${t.confidenceScore} >= 0 AND ${t.confidenceScore} <= 1)`,
    ),
    check(
      "invoice_ocr_result_status_check",
      sql`${t.status} IN ('PENDING', 'PROCESSED', 'FAILED', 'LINKED')`,
    ),
  ],
);

export const invoice = sqliteTable(
  "invoice",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    invoiceNumber: text("invoice_number").notNull(),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => supplier.id),
    ocrResultId: text("ocr_result_id")
      .references(() => invoiceOcrResult.id)
      .unique(),
    invoiceDate: text("invoice_date").notNull(),
    photoUrl: text("photo_url").notNull(),
    subtotalCents: integer("subtotal_cents").default(0).notNull(),
    taxCents: integer("tax_cents").default(0).notNull(),
    discountCents: integer("discount_cents").default(0).notNull(),
    freightCents: integer("freight_cents").default(0).notNull(),
    totalCents: integer("total_cents").default(0).notNull(),
    status: text("status", { enum: invoiceStatuses }).default("PENDING").notNull(),
    validatedBy: text("validated_by"),
    validatedAt: text("validated_at"),
    notes: text("notes"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [
    unique("invoice_supplier_invoice_number_unique").on(t.supplierId, t.invoiceNumber),
    index("invoice_status_created_at_idx").on(t.status, t.createdAt),
    index("invoice_invoice_date_idx").on(t.invoiceDate),
    check(
      "invoice_money_non_negative_check",
      sql`${t.subtotalCents} >= 0 AND ${t.taxCents} >= 0 AND ${t.discountCents} >= 0 AND ${t.freightCents} >= 0 AND ${t.totalCents} >= 0`,
    ),
    check(
      "invoice_total_cents_check",
      sql`${t.totalCents} = ${t.subtotalCents} + ${t.taxCents} + ${t.freightCents} - ${t.discountCents}`,
    ),
    check(
      "invoice_status_check",
      sql`${t.status} IN ('PENDING', 'VALIDATED', 'REJECTED', 'AUTO_ACCEPTED')`,
    ),
    check(
      "invoice_validation_fields_check",
      sql`(
        (${t.status} = 'PENDING' AND ${t.validatedBy} IS NULL AND ${t.validatedAt} IS NULL)
        OR
        (${t.status} <> 'PENDING' AND ${t.validatedBy} IS NOT NULL AND ${t.validatedAt} IS NOT NULL)
      )`,
    ),
  ],
);

export const invoiceItem = sqliteTable(
  "invoice_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id),
    qty: real("qty").notNull(),
    unitCostCents: integer("unit_cost_cents").notNull(),
    lineSubtotalCents: integer("line_subtotal_cents").notNull(),
    taxCents: integer("tax_cents").default(0).notNull(),
    discountCents: integer("discount_cents").default(0).notNull(),
    freightCents: integer("freight_cents").default(0).notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
    expiryDate: text("expiry_date"),
    batchNumber: text("batch_number"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [
    index("invoice_item_invoice_id_idx").on(t.invoiceId),
    index("invoice_item_product_id_idx").on(t.productId),
    check("invoice_item_qty_positive_check", sql`${t.qty} > 0`),
    check(
      "invoice_item_money_non_negative_check",
      sql`${t.unitCostCents} >= 0 AND ${t.lineSubtotalCents} >= 0 AND ${t.taxCents} >= 0 AND ${t.discountCents} >= 0 AND ${t.freightCents} >= 0 AND ${t.lineTotalCents} >= 0`,
    ),
    check(
      "invoice_item_total_cents_check",
      sql`${t.lineTotalCents} = ${t.lineSubtotalCents} + ${t.taxCents} + ${t.freightCents} - ${t.discountCents}`,
    ),
  ],
);

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
    check("inventory_batch_qty_positive_check", sql`${t.qty} > 0`),
    check(
      "inventory_batch_remaining_qty_check",
      sql`${t.remainingQty} >= 0 AND ${t.remainingQty} <= ${t.qty}`,
    ),
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
    check("inventory_movement_qty_non_zero_check", sql`${t.qty} != 0`),
    check(
      "inventory_movement_type_check",
      sql`${t.movementType} IN ('PURCHASE', 'SALE', 'RETURN', 'WASTAGE', 'ADJUSTMENT', 'CORRECTION')`,
    ),
    check(
      "inventory_movement_sign_rule_check",
      sql`(
        (${t.movementType} IN ('PURCHASE', 'RETURN') AND ${t.qty} > 0)
        OR
        (${t.movementType} IN ('SALE', 'WASTAGE') AND ${t.qty} < 0)
        OR
        (${t.movementType} IN ('ADJUSTMENT', 'CORRECTION') AND ${t.qty} != 0)
      )`,
    ),
    check(
      "inventory_movement_unit_cost_non_negative_check",
      sql`${t.unitCostCents} IS NULL OR ${t.unitCostCents} >= 0`,
    ),
  ],
);

export type CategorySelect = typeof category.$inferSelect;
export type CategoryInsert = typeof category.$inferInsert;

export type ProductSelect = typeof product.$inferSelect;
export type ProductInsert = typeof product.$inferInsert;

export type ProductCategorySelect = typeof productCategory.$inferSelect;
export type ProductCategoryInsert = typeof productCategory.$inferInsert;

export type SupplierSelect = typeof supplier.$inferSelect;
export type SupplierInsert = typeof supplier.$inferInsert;

export type ProductSupplierSelect = typeof productSupplier.$inferSelect;
export type ProductSupplierInsert = typeof productSupplier.$inferInsert;

export type InvoiceOcrResultSelect = typeof invoiceOcrResult.$inferSelect;
export type InvoiceOcrResultInsert = typeof invoiceOcrResult.$inferInsert;

export type InvoiceSelect = typeof invoice.$inferSelect;
export type InvoiceInsert = typeof invoice.$inferInsert;

export type InvoiceItemSelect = typeof invoiceItem.$inferSelect;
export type InvoiceItemInsert = typeof invoiceItem.$inferInsert;

export type InventoryBatchSelect = typeof inventoryBatch.$inferSelect;
export type InventoryBatchInsert = typeof inventoryBatch.$inferInsert;

export type InventoryMovementSelect = typeof inventoryMovement.$inferSelect;
export type InventoryMovementInsert = typeof inventoryMovement.$inferInsert;
