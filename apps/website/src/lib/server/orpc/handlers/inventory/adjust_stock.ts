import { ORPCError } from "@orpc/server";
import { eq, inventoryMovement, product, sql } from "@repo/perstore-db";
import { z } from "zod";

import { os, protectedShopMiddleware, shopDbMiddleware } from "$lib/server/orpc/base";

const manualMovementTypes = ["ADJUSTMENT", "CORRECTION", "WASTAGE", "RETURN"] as const;

const input = z.object({
  slug: z.string().min(1).max(100),
  productId: z.string().min(1),
  direction: z.enum(["ADD", "SUBTRACT"]),
  movementType: z.enum(manualMovementTypes),
  qty: z.number().positive(),
  unitCostCents: z.number().int().min(0),
  date: z.string().min(1),
  reason: z.string().max(1000).optional(),
});

export const adjustStockHandler = os
  .input(input)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const signedQty = input.direction === "ADD" ? input.qty : -input.qty;
    const occurredAt = new Date(input.date);
    const now = new Date();

    const existingProduct = await shopDb.query.product.findFirst({
      where: { id: input.productId },
      columns: { id: true, name: true, stock: true },
    });

    if (!existingProduct) {
      throw new ORPCError("NOT_FOUND", {
        message: "Product not found",
      });
    }

    if (input.direction === "SUBTRACT" && existingProduct.stock < input.qty) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Insufficient stock. Available: ${existingProduct.stock}, requested: ${input.qty}`,
      });
    }

    await shopDb.transaction(async (tx) => {
      await tx.insert(inventoryMovement).values({
        productId: input.productId,
        movementType: input.movementType,
        qty: signedQty,
        unitCostCents: input.unitCostCents,
        referenceType: "MANUAL",
        referenceId: null,
        reason: input.reason ?? null,
        occurredAt,
        createdAt: now,
      });

      await tx
        .update(product)
        .set({
          stock: sql`${product.stock} + ${signedQty}`,
          updatedAt: now,
        })
        .where(eq(product.id, input.productId));
    });

    const updatedProduct = await shopDb.query.product.findFirst({
      where: { id: input.productId },
      columns: { id: true, stock: true },
    });

    return {
      productId: input.productId,
      stock: updatedProduct?.stock ?? existingProduct.stock + signedQty,
    };
  });
