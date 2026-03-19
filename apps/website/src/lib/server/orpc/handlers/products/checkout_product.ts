import { ORPCError } from "@orpc/server";
import { and, gte, inArray, inventoryMovement, order, orderItem, product, sql } from "@repo/db";
import { z } from "zod";

import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const checkoutItem = z.object({
  productId: z.string().min(1),
  qty: z.number().positive(),
  unitPriceCents: z.number().int().positive(),
});

const input = z.object({
  slug: z.string().min(1).max(100),
  items: z.array(checkoutItem).min(1),
  customerName: z.string().max(255).optional(),
  customerPhone: z.string().max(50).optional(),
  discountCents: z.number().int().min(0).default(0),
  notes: z.string().max(1000).optional(),
});

export const checkoutHandler = os
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);
    const now = new Date();

    const requestedQtyByProduct = input.items.reduce((qtyMap, item) => {
      qtyMap.set(item.productId, (qtyMap.get(item.productId) ?? 0) + item.qty);
      return qtyMap;
    }, new Map<string, number>());
    const productIds = [...requestedQtyByProduct.keys()];

    const products = await shopDb.query.product.findMany({ where: { id: { in: productIds } } });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      throw new ORPCError("NOT_FOUND", {
        message: `Products not found: ${missingIds.join(", ")}`,
      });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const stockQtyByProduct = new Map(products.map((p) => [p.id, p.stock]));

    const subtotalCents = input.items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.qty,
      0,
    );
    const totalCents = subtotalCents - input.discountCents;

    const result = await shopDb.transaction(async (tx) => {
      const orderRecord = await tx
        .insert(order)
        .values({
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          subtotalCents,
          discountCents: input.discountCents,
          totalCents,
          notes: input.notes,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const createdOrder = orderRecord[0];

      if (!createdOrder) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create order",
        });
      }

      const orderItems = input.items.map((item) => ({
        id: crypto.randomUUID(),
        orderId: createdOrder.id,
        productId: item.productId,
        qty: item.qty,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.unitPriceCents * item.qty,
        createdAt: now,
      }));

      await tx.insert(orderItem).values(orderItems);

      const productCases = sql.join(
        [...requestedQtyByProduct.entries()].map(
          ([productId, soldQty]) => sql`when ${productId} then ${product.stock} - ${soldQty}`,
        ),
        sql.raw(" "),
      );

      const updateResult = await tx
        .update(product)
        .set({
          stock: sql`case ${product.id} ${productCases} else ${product.stock} end`,
          updatedAt: now,
        })
        .where(
          and(
            inArray(product.id, productIds),
            gte(
              product.stock,
              sql`CASE ${sql.join(
                [...requestedQtyByProduct.entries()].map(
                  ([productId, soldQty]) => sql`when ${product.id} = ${productId} then ${soldQty}`,
                ),
                sql.raw(" "),
              )} else 0 END`,
            ),
          ),
        );

      if (updateResult.rowsAffected !== productIds.length) {
        const insufficient = [...requestedQtyByProduct.entries()]
          .filter(([id, requested]) => (stockQtyByProduct.get(id) ?? 0) < requested)
          .map(([id, requested]) => {
            const p = productMap.get(id)!;
            return `"${p.name}" (available: ${stockQtyByProduct.get(id)}, requested: ${requested})`;
          });

        throw new ORPCError("BAD_REQUEST", {
          message: `Insufficient stock for: ${insufficient.join(", ")}`,
        });
      }

      await tx.insert(inventoryMovement).values(
        input.items.map((item, index) => ({
          productId: item.productId,
          movementType: "SALE" as const,
          qty: -item.qty,
          referenceType: "ORDER",
          referenceId: orderItems[index].id,
          occurredAt: now,
          createdAt: now,
        })),
      );

      return {
        orderId: createdOrder.id,
        totalCents,
        itemCount: input.items.reduce((sum, item) => sum + item.qty, 0),
      };
    });

    return result;
  });
