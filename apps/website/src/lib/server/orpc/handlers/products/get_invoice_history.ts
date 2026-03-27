import { z } from "zod";
import { os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  productId: z.string().min(1),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(20),
});

export const getInvoiceHistoryHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const invoiceItems = await shopDb.query.purchaseInvoiceItem.findMany({
      where: {
        id: input.cursor ?? { lte: input.cursor },
        productId: input.productId,
      },
      limit: input.pageSize + 1,
      orderBy: { id: "desc" },
      with: {
        purchaseInvoice: {
          columns: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            status: true,
          },
          with: {
            supplier: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    let nextCursor: string | undefined;
    if (invoiceItems.length > input.pageSize) {
      const next = invoiceItems.pop();
      nextCursor = next?.id;
    }

    const mostRecentUnitCost =
      !input.cursor && invoiceItems.length > 0 ? invoiceItems[0].unitCostCents : null;

    const items = invoiceItems.map((item) => ({
      id: item.id,
      invoiceId: item.purchaseInvoice?.id ?? null,
      invoiceNumber: item.purchaseInvoice?.invoiceNumber ?? null,
      supplierId: item.purchaseInvoice?.supplier?.id ?? null,
      supplierName: item.purchaseInvoice?.supplier?.name ?? null,
      invoiceDate: item.purchaseInvoice?.invoiceDate ?? null,
      status: item.purchaseInvoice?.status ?? null,
      qty: item.qty,
      unitCostCents: item.unitCostCents,
      lineTotalCents: item.lineTotalCents,
      createdAt: item.createdAt,
    }));

    return { items, pageSize: input.pageSize, nextCursor, mostRecentUnitCost };
  });
