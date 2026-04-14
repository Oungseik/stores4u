import { movementTypes } from "@repo/db";
import { z } from "zod";

import { os, protectedShopMiddleware, shopDbMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(12),
  order: z.enum(["asc", "desc"]).default("desc"),
  productId: z.string().optional(),
  search: z.string().optional(),
  movementTypes: z.array(z.enum(movementTypes)).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const listMovementsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const movements = await shopDb.query.inventoryMovement.findMany({
      where: {
        id: input.order === "asc" ? { gte: input.cursor } : { lte: input.cursor },
        productId: input.productId || undefined,
        movementType: input.movementTypes?.length ? { in: input.movementTypes } : undefined,
        occurredAt: {
          gte: input.dateFrom ? new Date(input.dateFrom) : undefined,
          lte: input.dateTo ? new Date(input.dateTo) : undefined,
        },
        OR: input.search
          ? [
              { product: { name: { like: `%${input.search}%` } } },
              { product: { sku: { like: `%${input.search}%` } } },
              { referenceId: { like: `%${input.search}%` } },
            ]
          : undefined,
      },
      limit: input.pageSize + 1,
      orderBy: { id: input.order },
      with: {
        purchaseInvoiceItem: {
          with: {
            purchaseInvoice: {
              columns: {
                id: true,
                invoiceNumber: true,
              },
            },
          },
        },
      },
    });

    let nextCursor: string | undefined;
    if (movements.length > input.pageSize) {
      const next = movements.pop();
      nextCursor = next?.id;
    }

    if (movements.length === 0) {
      return { items: [], pageSize: input.pageSize, nextCursor };
    }

    const productIds = [...new Set(movements.map((m) => m.productId))];
    const products = await shopDb.query.product.findMany({
      where: { id: { in: productIds } },
      columns: {
        id: true,
        name: true,
        sku: true,
        image: true,
        uom: true,
      },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const items = movements.map((m) => {
      const product = productMap.get(m.productId);
      return {
        id: m.id,
        productId: m.productId,
        productName: product?.name ?? "Unknown",
        productSku: product?.sku ?? null,
        productImage: product?.image ?? null,
        productUom: product?.uom ?? null,
        movementType: m.movementType,
        qty: m.qty,
        unitCostCents: m.unitCostCents,
        unitPriceCents: m.unitPriceCents,
        reason: m.reason,
        occurredAt: m.occurredAt,
        referenceType: m.referenceType,
        referenceId: m.referenceId,
        purchaseInvoiceNumber: m.purchaseInvoiceItem?.purchaseInvoice?.invoiceNumber ?? null,
      };
    });

    return { items, pageSize: input.pageSize, nextCursor };
  });
