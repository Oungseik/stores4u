import { randomUUIDv7 } from "bun";
import { sql } from "drizzle-orm";
import { check, index, integer, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { product } from "./product";
import { supplier } from "./supplier";

export const ExtractedSupplierSchema = z.object({
  name: z.string(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

export const ExtractedInvoiceSchema = z.object({
  invoiceNumber: z.string(),
  invoiceDate: z.string().optional(),
  subtotalCents: z.number().optional(),
  vatCents: z.number().optional(),
  discountCents: z.number().optional(),
  freightCents: z.number().optional(),
  totalCents: z.number(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export const ExtractedItemSchema = z.object({
  productName: z.string(),
  description: z.string().optional(),
  quantity: z.number(),
  unitCostCents: z.number(),
  lineTotalCents: z.number(),
  sku: z.string().optional(),
});

export const ExtractedInvoiceDataSchema = z.object({
  supplier: ExtractedSupplierSchema,
  invoice: ExtractedInvoiceSchema,
  items: z.array(ExtractedItemSchema),
  confidence: z.number(),
  rawText: z.string().optional(),
});

export type ExtractedSupplier = z.infer<typeof ExtractedSupplierSchema>;
export type ExtractedInvoice = z.infer<typeof ExtractedInvoiceSchema>;
export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;
export type ExtractedInvoiceData = z.infer<typeof ExtractedInvoiceDataSchema>;

/**
 * This purchaseInvoice is only related to the invoices when we refill stock and got the invoices
 * from the supplier. Not for the order invoice we create when customer buy from the shop.
 */

export const purchaseInvoiceFileStatus = [
  "UPLOADED",
  "PROCESSING",
  "PROCESSED",
  "FAILED",
  "REJECTED",
  "REVIEWED",
] as const;
export type PurchaseInvoiceFileStatus = (typeof purchaseInvoiceFileStatus)[number];

export const purchaseInvoiceFile = sqliteTable(
  "purchase_invoice_file",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    objectPath: text("object_path").notNull(),
    filename: text("filename").notNull(),
    fileType: text("file_type").notNull(),
    size: integer("size").notNull(),
    status: text("status", { enum: purchaseInvoiceFileStatus }).default("UPLOADED").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    check(
      "invoice_file_status_check",
      sql`${t.status} IN ('UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED', 'REJECTED', 'REVIEWED')`,
    ),
    index("invoice_file_status_created_at_idx").on(t.status, t.createdAt),
  ],
);

export const purchaseInvoiceStatuses = [
  "PENDING",
  "VALIDATED",
  "REJECTED",
  "AUTO_ACCEPTED",
] as const;
export type PurchaseInvoiceStatus = (typeof purchaseInvoiceStatuses)[number];

export const ocrStatuses = ["PENDING", "PROCESSED", "FAILED", "REJECTED", "LINKED"] as const;
export type OcrStatus = (typeof ocrStatuses)[number];

export const purchaseInvoiceOcrResult = sqliteTable(
  "purchase_invoice_ocr_result",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    photoUrl: text("photo_url").notNull(),
    invoiceFileId: text("invoice_file_id").references(() => purchaseInvoiceFile.id),
    rawJson: text("raw_json", { mode: "json" }).$type<unknown>().notNull(),
    extractedText: text("extracted_text"),
    extractedData: text("extracted_data", { mode: "json" }).$type<ExtractedInvoiceData>(),
    confidenceScore: real("confidence_score"),
    rejectionReason: text("rejection_reason"),
    status: text("status", { enum: ocrStatuses }).default("PENDING").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    check(
      "purchase_invoice_ocr_result_confidence_score_check",
      sql`${t.confidenceScore} IS NULL OR (${t.confidenceScore} >= 0 AND ${t.confidenceScore} <= 1)`,
    ),
    check(
      "purchase_invoice_ocr_result_status_check",
      sql`${t.status} IN ('PENDING', 'PROCESSED', 'FAILED', 'REJECTED', 'LINKED')`,
    ),
  ],
);

export const purchaseInvoice = sqliteTable(
  "purchase_invoice",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    invoiceNumber: text("invoice_number").notNull(),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => supplier.id),
    ocrResultId: text("ocr_result_id")
      .references(() => purchaseInvoiceOcrResult.id)
      .unique(),
    invoiceDate: text("invoice_date").notNull(),
    photoUrl: text("photo_url").notNull(),
    subtotalCents: integer("subtotal_cents").default(0).notNull(),
    vatCents: integer("vat_cents").default(0).notNull(),
    discountCents: integer("discount_cents").default(0).notNull(),
    freightCents: integer("freight_cents").default(0).notNull(),
    totalCents: integer("total_cents").default(0).notNull(),
    status: text("status", { enum: purchaseInvoiceStatuses }).default("PENDING").notNull(),
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
    unique("purchase_invoice_supplier_invoice_number_unique").on(t.supplierId, t.invoiceNumber),
    index("purchase_invoice_status_created_at_idx").on(t.status, t.createdAt),
    index("purchase_invoice_invoice_date_idx").on(t.invoiceDate),
  ],
);

export const purchaseInvoiceItem = sqliteTable(
  "purchase_invoice_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    purchaseInvoiceId: text("purchase_invoice_id")
      .notNull()
      .references(() => purchaseInvoice.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => product.id),
    invoiceItemName: text("invoice_item_name"),
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
    index("purchase_invoice_item_purchase_invoice_id_idx").on(t.purchaseInvoiceId),
    index("purchase_invoice_item_product_id_idx").on(t.productId),
  ],
);

export type PurchaseInvoiceFileSelect = typeof purchaseInvoiceFile.$inferSelect;
export type PurchaseInvoiceFileInsert = typeof purchaseInvoiceFile.$inferInsert;

export type PurchaseInvoiceOcrResultSelect = typeof purchaseInvoiceOcrResult.$inferSelect;
export type PurchaseInvoiceOcrResultInsert = typeof purchaseInvoiceOcrResult.$inferInsert;

export type PurchaseInvoiceSelect = typeof purchaseInvoice.$inferSelect;
export type PurchaseInvoiceInsert = typeof purchaseInvoice.$inferInsert;

export type PurchaseInvoiceItemSelect = typeof purchaseInvoiceItem.$inferSelect;
export type PurchaseInvoiceItemInsert = typeof purchaseInvoiceItem.$inferInsert;
