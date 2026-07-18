import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  db,
  eq,
  inArray,
  inventoryMovement,
  product,
  productAlias,
  productSupplier,
  purchaseInvoice,
  purchaseInvoiceItem,
  sql,
} from "$lib/server/db";
import { logger } from "$lib/server/logger";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { invoiceAmountFields, purchaseInvoiceItemInput } from "./schemas";

const input = z.object({
  invoiceId: z.string().min(1),
  invoiceNumber: z.string().min(1).max(100),
  invoiceDate: z.string().min(1),
  supplierId: z.string().min(1),
  ...invoiceAmountFields,
  items: z.array(purchaseInvoiceItemInput).min(1),
});

const BLOCKED_STATUSES = new Set(["REJECTED", "INVENTORY_FAILED"]);

export const updateInvoiceHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const occurredAt = new Date(input.invoiceDate);

    if (Number.isNaN(occurredAt.getTime())) {
      throw new ORPCError("BAD_REQUEST", {
        data: { key: "error_invalid_invoice_date", values: { date: input.invoiceDate } },
      });
    }

    const productIds = new Set(input.items.map((item) => item.productId));
    const products = await db.query.product.findMany({
      where: { id: { in: [...productIds] } },
      columns: { id: true },
    });

    if (products.length !== productIds.size) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.difference(foundIds);
      throw new ORPCError("NOT_FOUND", {
        data: { key: "error_products_not_found", values: { products: [...missingIds].join(", ") } },
      });
    }

    try {
      db.transaction((tx) => {
        // 1. FETCH existing invoice by ID
        const existingInvoice = tx.query.purchaseInvoice
          .findFirst({
            where: { id: input.invoiceId },
          })
          .sync();

        if (!existingInvoice) {
          throw new ORPCError("NOT_FOUND", { data: { key: "error_invoice_not_found" } });
        }

        if (BLOCKED_STATUSES.has(existingInvoice.status)) {
          throw new ORPCError("BAD_REQUEST", {
            data: {
              key: "error_invoice_status_not_editable",
              values: { status: existingInvoice.status },
            },
          });
        }

        // 2. FETCH existing items
        const existingItems = tx.query.purchaseInvoiceItem
          .findMany({
            where: { purchaseInvoiceId: input.invoiceId },
            columns: { id: true, productId: true, qty: true },
          })
          .sync();

        // 3. REVERSE OLD STOCK
        if (existingItems.length > 0) {
          const oldQtyByProduct = existingItems.reduce<Record<string, number>>((acc, item) => {
            acc[item.productId] = (acc[item.productId] ?? 0) + item.qty;
            return acc;
          }, {});

          const reverseCases = sql.join(
            Object.entries(oldQtyByProduct).map(
              ([productId, qty]) => sql`when ${productId} then ${product.stock} - ${qty}`,
            ),
            sql.raw(" "),
          );

          tx.update(product)
            .set({ stock: sql`case ${product.id} ${reverseCases} else ${product.stock} end` })
            .where(inArray(product.id, Object.keys(oldQtyByProduct)))
            .run();
        }

        // 4. DELETE OLD DATA (movements first for FK constraint)
        tx.delete(inventoryMovement)
          .where(
            sql`${inventoryMovement.referenceId} = ${input.invoiceId} AND ${inventoryMovement.movementType} = ${sql.raw("'PURCHASE'")}`,
          )
          .run();

        tx.delete(purchaseInvoiceItem)
          .where(eq(purchaseInvoiceItem.purchaseInvoiceId, input.invoiceId))
          .run();

        // 5. UPDATE INVOICE (preserve photoUrl, status, validatedBy, validatedAt, createdAt)
        tx.update(purchaseInvoice)
          .set({ ...input })
          .where(eq(purchaseInvoice.id, input.invoiceId))
          .run();

        // 6. INSERT NEW ITEMS
        const insertedItems = tx
          .insert(purchaseInvoiceItem)
          .values(input.items.map((item) => ({ ...item, purchaseInvoiceId: input.invoiceId })))
          .returning({ id: purchaseInvoiceItem.id })
          .all();

        // 7. CREATE NEW MOVEMENTS
        tx.insert(inventoryMovement)
          .values(
            input.items.map((item, index) => ({
              productId: item.productId,
              qty: item.qty,
              unitCostCents: item.unitCostCents,
              purchaseInvoiceItemId: insertedItems[index].id,
              movementType: "PURCHASE" as const,
              referenceType: "PURCHASE_INVOICE" as const,
              referenceId: input.invoiceId,
              occurredAt: occurredAt,
            })),
          )
          .run();

        // 8. APPLY NEW STOCK
        const newQtyByProduct = input.items.reduce<Record<string, number>>((acc, item) => {
          acc[item.productId] = (acc[item.productId] ?? 0) + item.qty;
          return acc;
        }, {});

        const applyCases = sql.join(
          Object.entries(newQtyByProduct).map(
            ([productId, qty]) => sql`when ${productId} then ${product.stock} + ${qty}`,
          ),
          sql.raw(" "),
        );

        tx.update(product)
          .set({
            stock: sql`case ${product.id} ${applyCases} else ${product.stock} end`,
          })
          .where(inArray(product.id, Object.keys(newQtyByProduct)))
          .run();

        // 9. UPSERT ALIASES & SUPPLIER LINKS
        const aliases = input.items
          .filter((item) => item.saveAlias === true && !!item.productId && !!item.invoiceItemName)
          .map((item) => ({
            productId: item.productId,
            alias: item.invoiceItemName,
          }));
        if (aliases.length > 0) {
          tx.insert(productAlias).values(aliases).onConflictDoNothing().run();
        }

        const supplierProducts = [...new Set(input.items.map((item) => item.productId))];
        if (supplierProducts.length > 0) {
          tx.insert(productSupplier)
            .values(
              supplierProducts.map((productId) => ({
                productId,
                supplierId: input.supplierId,
              })),
            )
            .onConflictDoNothing()
            .run();
        }
      });
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      logger.error({ error }, "Failed to update purchase invoice");
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }
  });
