import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(20),
  supplierId: z.string().optional(),
});

export const listInvoicesHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const invoices = await shopDb.query.purchaseInvoice.findMany({
      where: {
        id: input.cursor ? { lte: input.cursor } : undefined,
        supplierId: input.supplierId,
      },
      with: {
        supplier: {
          columns: { name: true },
        },
        items: {
          columns: { id: true },
        },
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
      itemsCount: invoice.items.length,
      vatCents: invoice.vatCents,
      discountCents: invoice.discountCents,
      freightCents: invoice.freightCents,
      subtotalCents: invoice.subtotalCents,
    }));

    return { items, pageSize: input.pageSize, nextCursor };
  });
