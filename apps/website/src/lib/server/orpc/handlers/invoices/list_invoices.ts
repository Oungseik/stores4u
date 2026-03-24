import { eq, invoiceItem } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(20),
  search: z.string().optional(),
  status: z.enum(["PENDING", "VALIDATED", "REJECTED", "AUTO_ACCEPTED"]).optional(),
  supplierId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const listInvoicesHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const invoices = await shopDb.query.invoice.findMany({
      where: {
        id: input.cursor ? { lte: input.cursor } : undefined,
        status: input.status,
        supplierId: input.supplierId,
        invoiceDate: input.dateFrom
          ? {
              gte: input.dateFrom,
              ...(input.dateTo ? { lte: input.dateTo } : {}),
            }
          : input.dateTo
            ? { lte: input.dateTo }
            : undefined,
        OR: input.search
          ? [
              { invoiceNumber: { like: `%${input.search}%` } },
              { notes: { like: `%${input.search}%` } },
            ]
          : undefined,
      },
      limit: input.pageSize + 1,
      orderBy: { id: "desc" },
      with: {
        supplier: {
          columns: { id: true, name: true },
        },
      },
      extras: {
        itemsCount: (table) => shopDb.$count(invoiceItem, eq(invoiceItem.invoiceId, table.id)),
      },
    });

    let nextCursor: string | undefined;
    if (invoices.length > input.pageSize) {
      const next = invoices.pop();
      nextCursor = next?.id;
    }

    const items = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      supplierId: inv.supplierId,
      supplier: inv.supplier,
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
      itemsCount: inv.itemsCount,
      notes: inv.notes,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    }));

    return { items, pageSize: input.pageSize, nextCursor };
  });
