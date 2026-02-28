import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const shop = sqliteTable("shop", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  name: text("name").notNull(),
  image: text("image").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
