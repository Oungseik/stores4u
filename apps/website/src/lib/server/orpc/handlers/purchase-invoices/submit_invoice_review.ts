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
  purchaseInvoiceFile,
  purchaseInvoiceItem,
  sql,
} from "$lib/server/db";
import { logger } from "$lib/server/logger";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { invoiceAmountFields, purchaseInvoiceItemInput } from "./schemas";

const input = z.object({
  invoiceFileId: z.string().min(1),
  invoiceNumber: z.string().min(1).max(100),
  invoiceDate: z.string().min(1),
  supplierId: z.string().min(1),
  ...invoiceAmountFields,
  items: z.array(purchaseInvoiceItemInput).min(1),
});

function getInvoiceFileStateError(status: string) {
  if (status === "PROCESSING") {
    return new ORPCError("BAD_REQUEST", {
      message: "Invoice is under processing. Please wait until processing finish",
    });
  }

  if (status === "REVIEWED") {
    return new ORPCError("BAD_REQUEST", {
      message: "Invoice is already review. Please upload again if you missed to add some items.",
    });
  }

  if (status === "REVIEWING") {
    return new ORPCError("BAD_REQUEST", {
      message: "Invoice review is in progress. Inventory sync has not completed yet.",
    });
  }

  return null;
}

export const submitInvoiceReviewHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const occurredAt = new Date(input.invoiceDate);

    if (Number.isNaN(occurredAt.getTime())) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Invalid invoice date: ${input.invoiceDate}`,
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
        message: `Products not found: ${[...missingIds].join(", ")}`,
      });
    }

    try {
      db.transaction((tx) => {
        const existingFile = tx.query.purchaseInvoiceFile
          .findFirst({
            where: { id: input.invoiceFileId },
            with: { ocrResult: true },
          })
          .sync();

        if (!existingFile) {
          throw new ORPCError("NOT_FOUND", { message: "Invoice file not found" });
        }

        const fileStateError = getInvoiceFileStateError(existingFile.status);
        if (fileStateError) {
          throw fileStateError;
        }

        const supplierId = input.supplierId;
        const existingSupplier = tx.query.supplier
          .findFirst({
            where: { id: supplierId },
            columns: { id: true },
          })
          .sync();

        if (!existingSupplier) {
          throw new ORPCError("NOT_FOUND", { message: "Supplier not found" });
        }

        const invoiceForFile = tx.query.purchaseInvoice
          .findFirst({
            where: { invoiceFileId: input.invoiceFileId, supplierId },
            columns: { id: true },
          })
          .sync();

        if (invoiceForFile) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Invoice file already has a purchase invoice",
          });
        }

        const insertInvoice = tx
          .insert(purchaseInvoice)
          .values({
            ...input,
            supplierId,
            invoiceFileId: existingFile.id,
            photoUrl: existingFile.objectPath,
            ocrResultId: existingFile.ocrResult?.id ?? null,
            status: "VALIDATED",
            validatedBy: context.session.user.id,
            validatedAt: new Date(),
          })
          .returning({ id: purchaseInvoice.id })
          .all();

        const createdInvoice = insertInvoice.at(0);
        if (!createdInvoice) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create invoice" });
        }

        const insertedItems = tx
          .insert(purchaseInvoiceItem)
          .values(input.items.map((item) => ({ ...item, purchaseInvoiceId: createdInvoice.id })))
          .returning({ id: purchaseInvoiceItem.id })
          .all();

        const aliases = input.items
          .filter((item) => item.saveAlias === true && !!item.productId && !!item.invoiceItemName)
          .map((item) => ({ productId: item.productId, alias: item.invoiceItemName }));

        if (aliases.length > 0) {
          tx.insert(productAlias).values(aliases).onConflictDoNothing().run();
        }

        const supplierProducts = [...new Set(input.items.map((item) => item.productId))];
        if (supplierProducts.length > 0) {
          tx.insert(productSupplier)
            .values(
              supplierProducts.map((productId) => ({ productId, supplierId: input.supplierId })),
            )
            .onConflictDoNothing()
            .run();
        }

        tx.insert(inventoryMovement)
          .values(
            input.items.map((item, index) => ({
              ...item,
              purchaseInvoiceItemId: insertedItems[index].id,
              movementType: "PURCHASE" as const,
              referenceType: "PURCHASE_INVOICE" as const,
              referenceId: createdInvoice.id,
              occurredAt: occurredAt,
            })),
          )
          .run();

        const qtyByProduct = input.items.reduce<Record<string, number>>(
          (acc, item) => ({ ...acc, [item.productId]: (acc[item.productId] ?? 0) + item.qty }),
          {},
        );

        const productCases = sql.join(
          Object.entries(qtyByProduct).map(
            ([productId, qty]) => sql`when ${productId} then ${product.stock} + ${qty}`,
          ),
          sql.raw(" "),
        );

        tx.update(product)
          .set({ stock: sql`case ${product.id} ${productCases} else ${product.stock} end` })
          .where(inArray(product.id, Object.keys(qtyByProduct)))
          .run();

        tx.update(purchaseInvoiceFile)
          .set({ status: "REVIEWED" })
          .where(eq(purchaseInvoiceFile.id, existingFile.id))
          .run();
      });
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      logger.error({ error }, "Failed to sync inventory for invoice");
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }
  });
