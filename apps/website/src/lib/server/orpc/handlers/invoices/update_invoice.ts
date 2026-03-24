import { ORPCError } from "@orpc/server";
import { eq, invoice, invoiceItem } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const invoiceItemInput = z.object({
  productId: z.string().min(1),
  qty: z.number().positive(),
  unitCostCents: z.number().int().min(0),
  lineSubtotalCents: z.number().int().min(0),
  vatCents: z.number().int().min(0).default(0),
  discountCents: z.number().int().min(0).default(0),
  freightCents: z.number().int().min(0).default(0),
  lineTotalCents: z.number().int().min(0),
  expiryDate: z.string().optional(),
  batchNumber: z.string().max(100).optional(),
});

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
  items: z.array(invoiceItemInput).min(1),
});

export const updateInvoiceHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);
    const now = new Date();

    const existing = await shopDb.query.invoice.findFirst({
      where: { id: input.id },
      columns: { id: true, status: true },
    });

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Invoice not found" });
    }

    const isStatusTransition =
      existing.status !== input.status &&
      (input.status === "VALIDATED" || input.status === "REJECTED");

    const result = await shopDb.transaction(async (tx) => {
      const updated = await tx
        .update(invoice)
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
        .where(eq(invoice.id, input.id))
        .returning();

      const result = updated.at(0);
      if (!result) {
        throw new ORPCError("NOT_FOUND");
      }

      await tx.delete(invoiceItem).where(eq(invoiceItem.invoiceId, input.id));

      await tx.insert(invoiceItem).values(
        input.items.map((item) => ({
          invoiceId: input.id,
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
