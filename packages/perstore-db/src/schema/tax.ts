import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const taxSettings = sqliteTable("tax_settings", {
  id: text("id").primaryKey().default("default"),
  enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
  name: text("name").default("VAT").notNull(),
  rate: real("rate").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
    .notNull(),
});

export type TaxSettingsSelect = typeof taxSettings.$inferSelect;
export type TaxSettingsInsert = typeof taxSettings.$inferInsert;
