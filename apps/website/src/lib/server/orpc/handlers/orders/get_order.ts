import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  orderId: z.string().min(1),
});

export const getOrderHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const order = await shopDb.query.order.findFirst({
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
      throw new ORPCError("NOT_FOUND", { message: "Order not found" });
    }

    return {
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
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
