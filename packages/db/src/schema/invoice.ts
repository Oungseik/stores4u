import { randomUUIDv7 } from "bun";
import { sql } from "drizzle-orm";
import { check, index, integer, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { product } from "./product";
import { supplier } from "./supplier";

/**
 * This invoice is only related to the invoices when we refill stock and got the invoices
 * from the supplier. Not for the order invoice we create when customer buy from the shop.
 */
export const invoiceStatuses = ["PENDING", "VALIDATED", "REJECTED", "AUTO_ACCEPTED"] as const;
export type InvoiceStatus = (typeof invoiceStatuses)[number];

export const ocrStatuses = ["PENDING", "PROCESSED", "FAILED", "LINKED"] as const;
export type OcrStatus = (typeof ocrStatuses)[number];

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
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
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
    vatCents: integer("vat_cents").default(0).notNull(),
    discountCents: integer("discount_cents").default(0).notNull(),
    freightCents: integer("freight_cents").default(0).notNull(),
    totalCents: integer("total_cents").default(0).notNull(),
    status: text("status", { enum: invoiceStatuses }).default("PENDING").notNull(),
    validatedBy: text("validated_by"),
    validatedAt: integer("validated_at", { mode: "timestamp" }),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("invoice_supplier_invoice_number_unique").on(t.supplierId, t.invoiceNumber),
    index("invoice_status_created_at_idx").on(t.status, t.createdAt),
    index("invoice_invoice_date_idx").on(t.invoiceDate),
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
    vatCents: integer("vat_cents").default(0).notNull(),
    discountCents: integer("discount_cents").default(0).notNull(),
    freightCents: integer("freight_cents").default(0).notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
    expiryDate: text("expiry_date"),
    batchNumber: text("batch_number"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("invoice_item_invoice_id_idx").on(t.invoiceId),
    index("invoice_item_product_id_idx").on(t.productId),
  ],
);

export type InvoiceOcrResultSelect = typeof invoiceOcrResult.$inferSelect;
export type InvoiceOcrResultInsert = typeof invoiceOcrResult.$inferInsert;

export type InvoiceSelect = typeof invoice.$inferSelect;
export type InvoiceInsert = typeof invoice.$inferInsert;

export type InvoiceItemSelect = typeof invoiceItem.$inferSelect;
export type InvoiceItemInsert = typeof invoiceItem.$inferInsert;
