import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const image = sqliteTable("image", {
  objectPath: text("object_path").primaryKey(),
  filename: text("filename").notNull(),
  type: text("type").notNull().default("image/webp"),
  size: integer("size").notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type ImageSelect = typeof image.$inferSelect;
export type ImageInsert = typeof image.$inferInsert;
