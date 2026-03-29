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
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
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

    const result = await shopDb.transaction(async (tx) => {
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
          status: "VALIDATED",
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
        .set({ status: "REVIEWED", updatedAt: now })
        .where(eq(purchaseInvoiceFile.id, input.invoiceFileId));

      return createdInvoice;
    });

    return {
      id: result.id,
      invoiceNumber: result.invoiceNumber,
      status: result.status,
      createdAt: result.createdAt,
    };
  });
