import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const invoiceSettings = sqliteTable("invoice_settings", {
  id: text("id").primaryKey().default("default"),
  paperWidth: text("paper_width").default("80").notNull(),
  showLogo: integer("show_logo", { mode: "boolean" }).default(true).notNull(),
  showAddress: integer("show_address", { mode: "boolean" }).default(true).notNull(),
  showPhone: integer("show_phone", { mode: "boolean" }).default(true).notNull(),
  showEmail: integer("show_email", { mode: "boolean" }).default(false).notNull(),
  footerText: text("footer_text").default("Thank you for your business!").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
    .notNull(),
});

export type InvoiceSettingsSelect = typeof invoiceSettings.$inferSelect;
export type InvoiceSettingsInsert = typeof invoiceSettings.$inferInsert;
