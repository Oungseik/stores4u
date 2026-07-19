import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { and, db, eq, gte, inventoryMovement, product, sql } from "$lib/server/db";

import { os, protectedShopMiddleware } from "$lib/server/orpc/base";

const manualMovementTypes = ["ADJUSTMENT", "CORRECTION", "WASTAGE", "RETURN"] as const;

const input = z.object({
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
  .handler(({ input }) => {
    const signedQty = input.direction === "ADD" ? input.qty : -input.qty;
    const occurredAt = new Date(input.date);
    const now = new Date();

    return db.transaction((tx) => {
      const updatedProduct = tx
        .update(product)
        .set({
          stock: sql`${product.stock} + ${signedQty}`,
          updatedAt: now,
        })
        .where(
          input.direction === "SUBTRACT"
            ? and(eq(product.id, input.productId), gte(product.stock, input.qty))
            : eq(product.id, input.productId),
        )
        .returning({ id: product.id, stock: product.stock })
        .get();

      if (!updatedProduct) {
        const currentProduct = tx
          .select({ stock: product.stock })
          .from(product)
          .where(eq(product.id, input.productId))
          .get();

        if (!currentProduct) {
          throw new ORPCError("NOT_FOUND", {
            data: { key: "error_product_not_found" },
          });
        }

        throw new ORPCError("BAD_REQUEST", {
          data: {
            key: "error_insufficient_stock",
            values: { available: currentProduct.stock, requested: input.qty },
          },
        });
      }

      tx.insert(inventoryMovement)
        .values({
          productId: input.productId,
          movementType: input.movementType,
          qty: signedQty,
          unitCostCents: input.unitCostCents,
          referenceType: "MANUAL",
          referenceId: null,
          reason: input.reason ?? null,
          occurredAt,
          createdAt: now,
        })
        .run();

      return {
        productId: updatedProduct.id,
        stock: updatedProduct.stock,
      };
    });
  });
