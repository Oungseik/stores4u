import { ORPCError } from "@orpc/server";
import {
  eq,
  inArray,
  inventoryMovement,
  product,
  productAlias,
  purchaseInvoice,
  purchaseInvoiceFile,
  purchaseInvoiceItem,
  sql,
} from "@repo/db";
import { z } from "zod";
import { logger } from "$lib/server/logger";
import {
  authMiddleware,
  os,
  protectedShopMiddleware,
  shopDbMiddleware,
} from "$lib/server/orpc/base";
import { invoiceAmountFields, purchaseInvoiceItemInput } from "./schemas";

const input = z.object({
  slug: z.string().min(1).max(100),
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
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb, ...context } }) => {
    const now = new Date();
    const occurredAt = new Date(input.invoiceDate);

    if (Number.isNaN(occurredAt.getTime())) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Invalid invoice date: ${input.invoiceDate}`,
      });
    }

    const productIds = new Set(input.items.map((item) => item.productId));
    const products = await shopDb.query.product.findMany({
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

    await shopDb
      .transaction(async (tx) => {
        const existingFile = await tx.query.purchaseInvoiceFile.findFirst({
          where: { id: input.invoiceFileId },
          with: { ocrResult: true },
        });

        if (!existingFile) {
          throw new ORPCError("NOT_FOUND", { message: "Invoice file not found" });
        }

        const fileStateError = getInvoiceFileStateError(existingFile.status);
        if (fileStateError) {
          throw fileStateError;
        }

        const supplierId = input.supplierId;
        const existingSupplier = await tx.query.supplier.findFirst({
          where: { id: supplierId },
          columns: { id: true },
        });

        if (!existingSupplier) {
          throw new ORPCError("NOT_FOUND", { message: "Supplier not found" });
        }

        const invoiceForFile = await tx.query.purchaseInvoice.findFirst({
          where: { invoiceFileId: input.invoiceFileId, supplierId },
          columns: { id: true },
        });

        if (invoiceForFile) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Invoice file already has a purchase invoice",
          });
        }

        const insertInvoice = await tx
          .insert(purchaseInvoice)
          .values({
            invoiceNumber: input.invoiceNumber,
            supplierId,
            invoiceFileId: existingFile.id,
            ocrResultId: existingFile.ocrResult?.id ?? null,
            invoiceDate: input.invoiceDate,
            photoUrl: existingFile.objectPath,
            subtotalCents: input.subtotalCents,
            vatCents: input.vatCents,
            discountCents: input.discountCents,
            freightCents: input.freightCents,
            totalCents: input.totalCents,
            notes: input.notes,
            status: "VALIDATED",
            validatedBy: context.session.user.id,
            validatedAt: now,
            createdAt: now,
            updatedAt: now,
          })
          .returning({ id: purchaseInvoice.id });

        const createdInvoice = insertInvoice.at(0);
        if (!createdInvoice) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create invoice" });
        }

        const items = input.items.map((item) => ({
          purchaseInvoiceId: createdInvoice.id,
          productId: item.productId,
          invoiceItemName: item.invoiceItemName,
          qty: item.qty,
          unitCostCents: item.unitCostCents,
          lineSubtotalCents: item.lineSubtotalCents,
          vatCents: item.vatCents,
          discountCents: item.discountCents,
          freightCents: item.freightCents,
          lineTotalCents: item.lineTotalCents,
          expiryDate: item.expiryDate,
          batchNumber: item.batchNumber,
          createdAt: now,
        }));

        const insertedItems = await tx
          .insert(purchaseInvoiceItem)
          .values(items)
          .returning({ id: purchaseInvoiceItem.id });

        const aliasesToCreate = input.items
          .filter(
            (item): item is typeof item & { productId: string; invoiceItemName: string } =>
              item.saveAlias === true && !!item.productId && !!item.invoiceItemName,
          )
          .map((item) => ({
            productId: item.productId,
            alias: item.invoiceItemName,
            createdAt: now,
          }));

        if (aliasesToCreate.length > 0) {
          await tx.insert(productAlias).values(aliasesToCreate).onConflictDoNothing();
        }

        await tx.insert(inventoryMovement).values(
          input.items.map((item, index) => ({
            productId: item.productId,
            purchaseInvoiceItemId: insertedItems[index].id,
            movementType: "PURCHASE" as const,
            qty: item.qty,
            unitCostCents: item.unitCostCents,
            referenceType: "PURCHASE_INVOICE" as const,
            referenceId: createdInvoice.id,
            occurredAt: occurredAt,
            createdAt: now,
          })),
        );

        const qtyByProduct = new Map<string, number>();
        for (const item of input.items) {
          qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.qty);
        }

        const productCases = sql.join(
          [...qtyByProduct.entries()].map(
            ([productId, qty]) => sql`when ${productId} then ${product.stock} + ${qty}`,
          ),
          sql.raw(" "),
        );

        await tx
          .update(product)
          .set({
            stock: sql`case ${product.id} ${productCases} else ${product.stock} end`,
            updatedAt: now,
          })
          .where(inArray(product.id, [...qtyByProduct.keys()]));

        await tx
          .update(purchaseInvoiceFile)
          .set({ status: "REVIEWED", updatedAt: now })
          .where(eq(purchaseInvoiceFile.id, existingFile.id));
      })
      .catch((error) => {
        if (error instanceof ORPCError) {
          throw error;
        }
        logger.error({ error }, "Failed to sync inventory for invoice");
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      });
  });
