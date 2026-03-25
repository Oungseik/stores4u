import { ORPCError } from "@orpc/server";
import { eq, purchaseInvoice, purchaseInvoiceItem } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";
import { purchaseInvoiceItemInput } from "./schemas";

const input = z.object({
  slug: z.string().min(1).max(100),
  id: z.string().min(1),
  invoiceNumber: z.string().min(1).max(100),
  supplierId: z.string().min(1),
  invoiceDate: z.string().min(1),
  photoUrl: z.string().min(1).max(500),
  subtotalCents: z.number().int().min(0),
  vatCents: z.number().int().min(0),
  discountCents: z.number().int().min(0),
  freightCents: z.number().int().min(0),
  totalCents: z.number().int().min(0),
  notes: z.string().max(1000).nullable(),
  status: z.enum(["PENDING", "VALIDATED", "REJECTED", "AUTO_ACCEPTED"]),
  items: z.array(purchaseInvoiceItemInput).min(1),
});

export const updatePurchaseInvoiceHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);
    const now = new Date();

    const existing = await shopDb.query.purchaseInvoice.findFirst({
      where: { id: input.id },
      columns: { id: true, status: true },
    });

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Purchase invoice not found" });
    }

    const isStatusTransition =
      existing.status !== input.status &&
      (input.status === "VALIDATED" || input.status === "REJECTED");

    const result = await shopDb.transaction(async (tx) => {
      const updated = await tx
        .update(purchaseInvoice)
        .set({
          invoiceNumber: input.invoiceNumber,
          supplierId: input.supplierId,
          invoiceDate: input.invoiceDate,
          photoUrl: input.photoUrl,
          subtotalCents: input.subtotalCents,
          vatCents: input.vatCents,
          discountCents: input.discountCents,
          freightCents: input.freightCents,
          totalCents: input.totalCents,
          notes: input.notes,
          status: input.status,
          validatedBy: isStatusTransition ? context.session.user.id : undefined,
          validatedAt: isStatusTransition ? now : undefined,
          updatedAt: now,
        })
        .where(eq(purchaseInvoice.id, input.id))
        .returning();

      const result = updated.at(0);
      if (!result) {
        throw new ORPCError("NOT_FOUND");
      }

      await tx
        .delete(purchaseInvoiceItem)
        .where(eq(purchaseInvoiceItem.purchaseInvoiceId, input.id));

      await tx.insert(purchaseInvoiceItem).values(
        input.items.map((item) => ({
          purchaseInvoiceId: input.id,
          productId: item.productId,
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

      return result;
    });

    return result;
  });
