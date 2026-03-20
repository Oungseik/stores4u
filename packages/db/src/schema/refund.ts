import { randomUUIDv7 } from "bun";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { order, orderItem } from "./order";

export const refundReasons = [
  "DEFECTIVE",
  "WRONG_ITEM",
  "CUSTOMER_CHANGE_OF_MIND",
  "DAMAGED",
  "OTHER",
] as const;
export type RefundReason = (typeof refundReasons)[number];

export const refund = sqliteTable(
  "refund",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id),
    refundTotalCents: integer("refund_total_cents").notNull(),
    reason: text("reason", { enum: refundReasons }).notNull(),
    notes: text("notes"),
    refundedBy: text("refunded_by"),
    refundedAt: integer("refunded_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("refund_order_id_idx").on(t.orderId),
    index("refund_refunded_at_idx").on(t.refundedAt),
  ],
);

export const refundItem = sqliteTable(
  "refund_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    refundId: text("refund_id")
      .notNull()
      .references(() => refund.id, { onDelete: "cascade" }),
    orderItemId: text("order_item_id")
      .notNull()
      .references(() => orderItem.id),
  },
  (t) => [
    index("refund_item_refund_id_idx").on(t.refundId),
    index("refund_item_order_item_id_idx").on(t.orderItemId),
  ],
);

export type RefundSelect = typeof refund.$inferSelect;
export type RefundInsert = typeof refund.$inferInsert;

export type RefundItemSelect = typeof refundItem.$inferSelect;
export type RefundItemInsert = typeof refundItem.$inferInsert;
