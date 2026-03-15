import { ORPCError } from "@orpc/server";
import {
  and,
  gt,
  inArray,
  inventoryBatch,
  inventoryMovement,
  order,
  orderItem,
  product,
  sql,
} from "@repo/db";
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

type AllocatableBatch = Pick<
  typeof inventoryBatch.$inferSelect,
  "id" | "productId" | "remainingQty" | "expiryDate" | "createdAt"
>;

function isExpiredBatch(batch: Pick<AllocatableBatch, "expiryDate">, today: string) {
  return batch.expiryDate !== null && batch.expiryDate <= today;
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export const checkoutHandler = os
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);
    const now = new Date();
    const today = toDateString(now);
    const requestedQtyByProduct = input.items.reduce((qtyMap, item) => {
      qtyMap.set(item.productId, (qtyMap.get(item.productId) ?? 0) + item.qty);
      return qtyMap;
    }, new Map<string, number>());
    const productIds = [...requestedQtyByProduct.keys()];

    const products = await shopDb.select().from(product).where(inArray(product.id, productIds));

    if (products.length !== productIds.length) {
      const foundSKU = new Set(products.map((p) => p.id));
      const missingSKU = productIds.filter((id) => !foundSKU.has(id));
      throw new ORPCError("NOT_FOUND", {
        message: `Products not found: ${missingSKU.join(", ")}`,
      });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const allPositiveBatches = await shopDb
      .select({
        id: inventoryBatch.id,
        productId: inventoryBatch.productId,
        remainingQty: inventoryBatch.remainingQty,
        expiryDate: inventoryBatch.expiryDate,
        createdAt: inventoryBatch.createdAt,
      })
      .from(inventoryBatch)
      .where(
        and(inArray(inventoryBatch.productId, productIds), gt(inventoryBatch.remainingQty, 0)),
      );
    const eligibleBatchesByProduct = new Map<string, AllocatableBatch[]>();
    const totalRemainingByProduct = new Map<string, number>();
    const availableRemainingByProduct = new Map<string, number>();
    const batchMap = new Map(allPositiveBatches.map((batch) => [batch.id, batch]));

    for (const batch of allPositiveBatches) {
      totalRemainingByProduct.set(
        batch.productId,
        (totalRemainingByProduct.get(batch.productId) ?? 0) + batch.remainingQty,
      );

      if (isExpiredBatch(batch, today)) {
        continue;
      }

      availableRemainingByProduct.set(
        batch.productId,
        (availableRemainingByProduct.get(batch.productId) ?? 0) + batch.remainingQty,
      );

      const productBatches = eligibleBatchesByProduct.get(batch.productId) ?? [];
      productBatches.push(batch);
      eligibleBatchesByProduct.set(batch.productId, productBatches);
    }

    for (const productBatches of eligibleBatchesByProduct.values()) {
      productBatches.sort((a, b) => {
        const aExpiry = a.expiryDate ?? "9999-12-31";
        const bExpiry = b.expiryDate ?? "9999-12-31";

        if (aExpiry !== bExpiry) {
          return aExpiry.localeCompare(bExpiry);
        }

        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    }

    for (const [productId, requestedQty] of requestedQtyByProduct) {
      const p = productMap.get(productId)!;
      const availableQty = availableRemainingByProduct.get(productId) ?? 0;

      if (availableQty < requestedQty) {
        throw new ORPCError("INPUT_VALIDATION_FAILED", {
          message: `Insufficient stock for "${p.name}". Available: ${availableQty}, Requested: ${requestedQty}`,
        });
      }
    }

    const subtotalCents = input.items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.qty,
      0,
    );
    const totalCents = subtotalCents - input.discountCents;

    const result = await shopDb.transaction(async (tx) => {
      const orderRecord = await tx
        .insert(order)
        .values({
          orderNumber: crypto.randomUUID(),
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

      const batchQueuesByProduct = new Map(
        [...eligibleBatchesByProduct.entries()].map(([productId, batches]) => [
          productId,
          batches.map((batch) => ({ id: batch.id, remainingQty: batch.remainingQty })),
        ]),
      );
      const deductedQtyByBatch = new Map<string, number>();
      const movements: Array<typeof inventoryMovement.$inferInsert> = [];

      for (const [index, item] of input.items.entries()) {
        const batchQueue = batchQueuesByProduct.get(item.productId) ?? [];
        let remainingQtyToAllocate = item.qty;

        while (remainingQtyToAllocate > 0) {
          const currentBatch = batchQueue[0];

          if (!currentBatch) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", {
              message: `Failed to allocate inventory for "${productMap.get(item.productId)?.name ?? item.productId}"`,
            });
          }

          const deductedQty = Math.min(currentBatch.remainingQty, remainingQtyToAllocate);
          if (deductedQty <= Number.EPSILON) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", {
              message: `Invalid inventory allocation for "${productMap.get(item.productId)?.name ?? item.productId}"`,
            });
          }

          deductedQtyByBatch.set(
            currentBatch.id,
            (deductedQtyByBatch.get(currentBatch.id) ?? 0) + deductedQty,
          );
          movements.push({
            productId: item.productId,
            batchId: currentBatch.id,
            movementType: "SALE" as const,
            qty: -deductedQty,
            referenceType: "ORDER",
            referenceId: orderItems[index].id,
            occurredAt: now,
            createdAt: now,
          });

          currentBatch.remainingQty -= deductedQty;
          remainingQtyToAllocate -= deductedQty;

          if (currentBatch.remainingQty <= Number.EPSILON) {
            batchQueue.shift();
          }

          if (remainingQtyToAllocate <= Number.EPSILON) {
            remainingQtyToAllocate = 0;
          }
        }
      }

      const batchUpdates = [...deductedQtyByBatch.entries()].map(([batchId, deductedQty]) => ({
        batchId,
        remainingQty: Math.max((batchMap.get(batchId)?.remainingQty ?? 0) - deductedQty, 0),
      }));
      const productUpdates = [...requestedQtyByProduct.entries()].map(([productId, soldQty]) => ({
        productId,
        stock: (totalRemainingByProduct.get(productId) ?? 0) - soldQty,
      }));

      if (batchUpdates.length > 0) {
        const batchCases = sql.join(
          batchUpdates.map(
            ({ batchId, remainingQty }) => sql`when ${batchId} then ${remainingQty}`,
          ),
          sql.raw(" "),
        );

        await tx
          .update(inventoryBatch)
          .set({
            remainingQty: sql`case ${inventoryBatch.id} ${batchCases} else ${inventoryBatch.remainingQty} end`,
            updatedAt: now,
          })
          .where(
            inArray(
              inventoryBatch.id,
              batchUpdates.map(({ batchId }) => batchId),
            ),
          );
      }

      if (productUpdates.length > 0) {
        const productCases = sql.join(
          productUpdates.map(({ productId, stock }) => sql`when ${productId} then ${stock}`),
          sql.raw(" "),
        );

        await tx
          .update(product)
          .set({
            stock: sql`case ${product.id} ${productCases} else ${product.stock} end`,
            updatedAt: now,
          })
          .where(
            inArray(
              product.id,
              productUpdates.map(({ productId }) => productId),
            ),
          );
      }

      await tx.insert(inventoryMovement).values(movements);

      return {
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        totalCents,
        itemCount: input.items.reduce((sum, item) => sum + item.qty, 0),
      };
    });

    return result;
  });
