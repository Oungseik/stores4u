import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  orderId: z.string().min(1),
});

export const getOrderHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const order = await db.query.order.findFirst({
      where: { id: input.orderId },
      with: {
        items: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                barcode: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new ORPCError("NOT_FOUND", { data: { key: "error_order_not_found" } });
    }

    return {
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
      vatCents: order.vatCents,
      totalCents: order.totalCents,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        qty: item.qty,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
        product: item.product,
      })),
    };
  });
