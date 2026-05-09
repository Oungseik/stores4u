import { ORPCError } from "@orpc/server";
import {
  and,
  gte,
  inArray,
  inventoryMovement,
  order,
  orderItem,
  product,
  sql,
} from "@repo/perstore-db";
import { z } from "zod";

import {
  authMiddleware,
  os,
  protectedShopMiddleware,
  shopDbMiddleware,
} from "$lib/server/orpc/base";

const checkoutItem = z.object({
  productId: z.string().min(1),
  qty: z.number().positive(),
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
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const now = new Date();

    const requestedQtyByProduct = input.items.reduce((qtyMap, item) => {
      qtyMap.set(item.productId, (qtyMap.get(item.productId) ?? 0) + item.qty);
      return qtyMap;
    }, new Map<string, number>());
    const productIds = [...requestedQtyByProduct.keys()];

    const [products, taxConfig] = await Promise.all([
      shopDb.query.product.findMany({ where: { id: { in: productIds } } }),
      shopDb.query.taxSettings.findFirst(),
    ]);

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      throw new ORPCError("NOT_FOUND", {
        message: `Products not found: ${missingIds.join(", ")}`,
      });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const getProduct = (id: string) => {
      const p = productMap.get(id);
      if (!p) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: `Product ${id} not found` });
      }
      return p;
    };

    const subtotalCents = input.items.reduce((sum, item) => {
      const dbProduct = getProduct(item.productId);
      return sum + dbProduct.priceCents * item.qty;
    }, 0);

    let vatCents = 0;
    if (taxConfig?.enabled) {
      vatCents = Math.round(subtotalCents * (taxConfig.rate / 100));
    }

    const totalCents = subtotalCents - input.discountCents + vatCents;

    const latestCostByProduct = new Map(
      await Promise.all(
        productIds.map(async (pid) => {
          const row = await shopDb.query.inventoryMovement.findFirst({
            where: { productId: pid, movementType: { in: ["ADJUSTMENT", "PURCHASE"] } },
            orderBy: { createdAt: "desc" },
          });
          return [pid, row?.unitCostCents ?? 0] as const;
        }),
      ),
    );

    const result = await shopDb.transaction(async (tx) => {
      const orderRecord = await tx
        .insert(order)
        .values({
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          subtotalCents,
          discountCents: input.discountCents,
          vatCents,
          totalCents,
          notes: input.notes,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: order.id });
      const createdOrder = orderRecord[0];

      if (!createdOrder) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create order",
        });
      }

      const orderItems = input.items.map((item) => {
        const unitPriceCents = getProduct(item.productId).priceCents;
        return {
          id: Bun.randomUUIDv7(),
          orderId: createdOrder.id,
          productId: item.productId,
          qty: item.qty,
          unitPriceCents,
          lineTotalCents: unitPriceCents * item.qty,
          createdAt: now,
        };
      });

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

      if (updateResult.changes !== productIds.length) {
        const insufficient = [...requestedQtyByProduct.entries()]
          .filter(([id, requested]) => getProduct(id).stock < requested)
          .map(([id, requested]) => {
            const p = getProduct(id);
            return `"${p.name}" (available: ${getProduct(id).stock}, requested: ${requested})`;
          });

        throw new ORPCError("BAD_REQUEST", {
          message: `Insufficient stock for: ${insufficient.join(", ")}`,
        });
      }

      await tx.insert(inventoryMovement).values(
        input.items.map((item) => ({
          productId: item.productId,
          movementType: "SALE" as const,
          qty: -item.qty,
          unitCostCents: latestCostByProduct.get(item.productId) ?? 0,
          unitPriceCents: getProduct(item.productId).priceCents,
          referenceType: "ORDER" as const,
          referenceId: createdOrder.id,
          occurredAt: now,
          createdAt: now,
        })),
      );

      return {
        orderId: createdOrder.id,
        subtotalCents,
        discountCents: input.discountCents,
        vatCents,
        totalCents,
        itemCount: input.items.reduce((sum, item) => sum + item.qty, 0),
      };
    });

    return result;
  });
