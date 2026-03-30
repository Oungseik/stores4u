import { ORPCError } from "@orpc/server";
import {
  eq,
  productAlias,
  purchaseInvoice,
  purchaseInvoiceFile,
  purchaseInvoiceItem,
  purchaseInvoiceOcrResult,
} from "@repo/db";
import { z } from "zod";
import { logger } from "$lib/server/logger";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { baseUrl, qstashClient } from "$lib/server/qstash";
import { getShopDb } from "$lib/server/shop_db";
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
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);
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

    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await shopDb.query.product.findMany({
      where: { id: { in: productIds } },
      columns: { id: true },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      throw new ORPCError("NOT_FOUND", {
        message: `Products not found: ${missingIds.join(", ")}`,
      });
    }

    const existingInvoice = await shopDb.query.purchaseInvoice.findFirst({
      where: { supplierId: input.supplierId, invoiceNumber: input.invoiceNumber },
      columns: { id: true },
    });

    if (existingInvoice) {
      throw new ORPCError("BAD_REQUEST", {
        message: "An invoice with this number already exists for this supplier",
      });
    }

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

        await tx.insert(purchaseInvoiceItem).values(
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
        );

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

        return createdInvoice;
      })
      .catch((error) => {
        logger.error({ error }, "Failed to submit invoice review.");
        throw error;
      });

    try {
      await qstashClient.publishJSON({
        url: `${baseUrl}/api/queue/inventory-sync`,
        body: {
          invoiceId: result.id,
          shopSlug: context.shop.slug,
        },
        failureCallback: `${baseUrl}/api/queue/inventory-sync/failure`,
      });
    } catch (error) {
      logger.error({ error, invoiceId: result.id }, "Failed to dispatch inventory sync to QStash");
      await shopDb
        .update(purchaseInvoice)
        .set({ status: "PENDING", updatedAt: new Date() })
        .where(eq(purchaseInvoice.id, result.id));
      await shopDb
        .update(purchaseInvoiceFile)
        .set({ status: "PROCESSED", updatedAt: new Date() })
        .where(eq(purchaseInvoiceFile.id, input.invoiceFileId));
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to queue inventory sync. Please retry.",
      });
    }

    return {
      id: result.id,
      invoiceNumber: result.invoiceNumber,
      status: result.status,
      createdAt: result.createdAt,
    };
  });
