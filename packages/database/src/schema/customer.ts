import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const customerTypes = ["WHOLESALE", "RETAIL"] as const;
export type CustomerType = (typeof customerTypes)[number];

export const customer = sqliteTable("customer", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"),
  phone2: text("phone2"),
  email: text("email"),
  address: text("address"),
  taxId: text("tax_id"),
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  customerType: text("customer_type", { enum: customerTypes }).notNull().default("RETAIL"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
    .notNull(),
});

export type CustomerSelect = typeof customer.$inferSelect;
export type CustomerInsert = typeof customer.$inferInsert;
