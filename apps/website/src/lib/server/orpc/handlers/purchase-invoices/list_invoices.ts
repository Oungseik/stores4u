import { z } from "zod";
import { db, eq, purchaseInvoiceItem } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(12),
  supplierId: z.string().optional(),
  productId: z.string().optional(),
});

export const listInvoicesHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const invoices = await db.query.purchaseInvoice.findMany({
      where: {
        items: { productId: input.productId },
        supplierId: input.supplierId,
      },
      with: {
        supplier: {
          columns: { name: true },
        },
      },
      extras: {
        itemsCount: (table) =>
          db.$count(purchaseInvoiceItem, eq(purchaseInvoiceItem.purchaseInvoiceId, table.id)),
      },
      limit: input.pageSize + 1,
      orderBy: { id: "desc" },
    });

    let nextCursor: string | undefined;
    if (invoices.length > input.pageSize) {
      const next = invoices.pop();
      nextCursor = next?.id;
    }

    const items = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceFileId: invoice.invoiceFileId,
      supplier: invoice.supplier,
      createdAt: invoice.createdAt,
      status: invoice.status,
      totalCents: invoice.totalCents,
      itemsCount: invoice.itemsCount,
      vatCents: invoice.vatCents,
      discountCents: invoice.discountCents,
      freightCents: invoice.freightCents,
      subtotalCents: invoice.subtotalCents,
    }));

    return { items, pageSize: input.pageSize, nextCursor };
  });
