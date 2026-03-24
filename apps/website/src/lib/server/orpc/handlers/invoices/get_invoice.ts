import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  invoiceId: z.string().min(1),
});

export const getInvoiceHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const inv = await shopDb.query.invoice.findFirst({
      where: { id: input.invoiceId },
      with: {
        supplier: {
          columns: { id: true, name: true },
        },
        items: {
          with: {
            product: {
              columns: { id: true, name: true, sku: true, barcode: true },
            },
          },
        },
      },
    });

    if (!inv) {
      throw new ORPCError("NOT_FOUND", { message: "Invoice not found" });
    }

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      supplierId: inv.supplierId,
      supplier: inv.supplier,
      ocrResultId: inv.ocrResultId,
      invoiceDate: inv.invoiceDate,
      photoUrl: inv.photoUrl,
      subtotalCents: inv.subtotalCents,
      vatCents: inv.vatCents,
      discountCents: inv.discountCents,
      freightCents: inv.freightCents,
      totalCents: inv.totalCents,
      status: inv.status,
      validatedBy: inv.validatedBy,
      validatedAt: inv.validatedAt,
      notes: inv.notes,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      items: inv.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        product: item.product,
        qty: item.qty,
        unitCostCents: item.unitCostCents,
        lineSubtotalCents: item.lineSubtotalCents,
        vatCents: item.vatCents,
        discountCents: item.discountCents,
        freightCents: item.freightCents,
        lineTotalCents: item.lineTotalCents,
        expiryDate: item.expiryDate,
        batchNumber: item.batchNumber,
        createdAt: item.createdAt,
      })),
    };
  });
