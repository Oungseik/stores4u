import { ORPCError } from "@orpc/server";
import {
  and,
  eq,
  type InventoryMovementInsert,
  inArray,
  inventoryMovement,
  product,
  productAlias,
  purchaseInvoice,
  purchaseInvoiceFile,
  purchaseInvoiceItem,
  purchaseInvoiceOcrResult,
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

export const submitInvoiceReviewHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb, ...context } }) => {
    const now = new Date();

    const existingFile = await shopDb.query.purchaseInvoiceFile.findFirst({
      where: { id: input.invoiceFileId },
      with: { ocrResult: true },
    });

    if (!existingFile) {
      throw new ORPCError("NOT_FOUND", { message: "Invoice file not found" });
    }

    if (existingFile.status === "PROCESSING") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invoice is under processing. Please wait until processing finish",
      });
    }

    if (existingFile.status === "REVIEWED") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invoice is already review. Please upload again if you missed to add some items.",
      });
    }

    if (existingFile.status === "REVIEWING") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invoice review is in progress. Inventory sync has not completed yet.",
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

    const existingInvoice = await shopDb.query.purchaseInvoice.findFirst({
      where: { supplierId: input.supplierId, invoiceNumber: input.invoiceNumber },
      columns: { id: true, status: true, ocrResultId: true },
    });

    if (existingInvoice) {
      if (existingInvoice.status === "PENDING") {
        await shopDb.transaction(async (tx) => {
          await tx.delete(purchaseInvoice).where(eq(purchaseInvoice.id, existingInvoice.id));
          if (existingInvoice.ocrResultId) {
            await tx
              .update(purchaseInvoiceOcrResult)
              .set({ status: "PROCESSED" })
              .where(eq(purchaseInvoiceOcrResult.id, existingInvoice.ocrResultId));
          }
        });
      } else {
        throw new ORPCError("BAD_REQUEST", {
          message: "An invoice with this number already exists for this supplier",
        });
      }
    }

    const previousFileStatus = existingFile.status;
    const previousOcrStatus = existingFile.ocrResult?.status ?? null;

    const result = await shopDb
      .transaction(async (tx) => {
        const supplierId = input.supplierId;

        const existingSupplier = await tx.query.supplier.findFirst({
          where: { id: supplierId },
          columns: { id: true },
        });

        if (!existingSupplier) {
          throw new ORPCError("NOT_FOUND", { message: "Supplier not found" });
        }

        const insertedInvoice = await tx
          .insert(purchaseInvoice)
          .values({
            invoiceNumber: input.invoiceNumber,
            supplierId,
            ocrResultId: existingFile.ocrResult?.id ?? null,
            invoiceDate: input.invoiceDate,
            photoUrl: existingFile.objectPath,
            subtotalCents: input.subtotalCents,
            vatCents: input.vatCents,
            discountCents: input.discountCents,
            freightCents: input.freightCents,
            totalCents: input.totalCents,
            notes: input.notes,
            status: "INVENTORY_PENDING",
            validatedBy: context.session.user.id,
            validatedAt: now,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        const createdInvoice = insertedInvoice.at(0);
        if (!createdInvoice) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create invoice" });
        }

        const insertedItems = await tx
          .insert(purchaseInvoiceItem)
          .values(
            input.items.map((item) => ({
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
            })),
          )
          .returning();

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

        if (existingFile.ocrResult) {
          await tx
            .update(purchaseInvoiceOcrResult)
            .set({ status: "LINKED" })
            .where(eq(purchaseInvoiceOcrResult.id, existingFile.ocrResult.id));
        }

        await tx
          .update(purchaseInvoiceFile)
          .set({ status: "REVIEWING", updatedAt: now })
          .where(eq(purchaseInvoiceFile.id, input.invoiceFileId));

        return { invoice: createdInvoice, items: insertedItems };
      })
      .catch((error) => {
        logger.error({ error }, "Failed to submit invoice review.");
        throw error;
      });

    const { invoice: createdInvoice, items: insertedItems } = result;
    const invoiceId = createdInvoice.id;
    const invoiceOcrResultId = existingFile.ocrResult?.id ?? null;

    const occurredAt = new Date(input.invoiceDate);

    const productQtyById = insertedItems.reduce((acc, item) => {
      acc.set(item.productId, (acc.get(item.productId) ?? 0) + item.qty);
      return acc;
    }, new Map<string, number>());

    const aggregatedByProduct = Array.from(productQtyById, ([productId, totalQty]) => ({
      productId,
      totalQty,
    }));

    const uniqueProductIds = [...productQtyById.keys()];

    const syncTransaction = async () => {
      await shopDb.transaction(async (tx) => {
        const movementValues = insertedItems.map(
          (item) =>
            ({
              productId: item.productId,
              purchaseInvoiceItemId: item.id,
              movementType: "PURCHASE",
              qty: item.qty,
              unitCostCents: item.unitCostCents,
              referenceType: "PURCHASE_INVOICE",
              referenceId: invoiceId,
              occurredAt,
              createdAt: now,
            }) satisfies InventoryMovementInsert,
        );

        await tx.insert(inventoryMovement).values(movementValues);

        const productCases = sql.join(
          aggregatedByProduct.map(
            (entry) =>
              sql`when ${product.id} = ${entry.productId} then ${product.stock} + ${entry.totalQty}`,
          ),
          sql.raw(" "),
        );

        await tx
          .update(product)
          .set({
            stock: sql`case ${product.id} ${productCases} else ${product.stock} end`,
            updatedAt: now,
          })
          .where(inArray(product.id, uniqueProductIds));

        await tx
          .update(purchaseInvoice)
          .set({ status: "VALIDATED", updatedAt: now })
          .where(eq(purchaseInvoice.id, invoiceId));

        if (invoiceOcrResultId) {
          await tx
            .update(purchaseInvoiceFile)
            .set({ status: "REVIEWED", updatedAt: now })
            .from(purchaseInvoiceOcrResult)
            .where(
              and(
                eq(purchaseInvoiceOcrResult.id, invoiceOcrResultId),
                eq(purchaseInvoiceFile.id, purchaseInvoiceOcrResult.invoiceFileId),
              ),
            );
        } else {
          await tx
            .update(purchaseInvoiceFile)
            .set({ status: "REVIEWED", updatedAt: now })
            .where(eq(purchaseInvoiceFile.id, input.invoiceFileId));
        }
      });
    };

    const rollbackInvoice = async () => {
      await shopDb.transaction(async (tx) => {
        await tx.delete(purchaseInvoice).where(eq(purchaseInvoice.id, invoiceId));
        if (existingFile.ocrResult && previousOcrStatus) {
          await tx
            .update(purchaseInvoiceOcrResult)
            .set({ status: previousOcrStatus })
            .where(eq(purchaseInvoiceOcrResult.id, existingFile.ocrResult.id));
        }
        await tx
          .update(purchaseInvoiceFile)
          .set({ status: previousFileStatus, updatedAt: new Date() })
          .where(eq(purchaseInvoiceFile.id, input.invoiceFileId));
      });
    };

    await syncTransaction().catch(async (error) => {
      logger.error({ error, invoiceId }, "Failed to sync inventory for invoice");
      await rollbackInvoice();
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to sync inventory. Please retry.",
      });
    });

    return {
      id: invoiceId,
      invoiceNumber: createdInvoice.invoiceNumber,
      status: "VALIDATED" as const,
      createdAt: createdInvoice.createdAt,
    };
  });
