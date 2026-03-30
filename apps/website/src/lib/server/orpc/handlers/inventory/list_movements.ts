import { z } from "zod";
import { os, protectedShopMiddleware, shopDbMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  order: z.enum(["asc", "desc"]).default("desc"),
  productId: z.uuidv7(),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().default(20),
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
        productId: input.productId,
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

    const items = movements.map((m) => ({
      id: m.id,
      movementType: m.movementType,
      qty: m.qty,
      unitCostCents: m.unitCostCents,
      reason: m.reason,
      occurredAt: m.occurredAt,
      referenceId: m.referenceId,
      purchaseInvoiceId: m.purchaseInvoiceItem?.purchaseInvoiceId,
      purchaseInvoiceNumber: m.purchaseInvoiceItem?.purchaseInvoice?.invoiceNumber,
    }));

    return { items, pageSize: input.pageSize, nextCursor };
  });
