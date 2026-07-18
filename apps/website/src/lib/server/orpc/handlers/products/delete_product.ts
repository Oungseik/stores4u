import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, eq, product } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  id: z.string().min(1),
});

export const deleteProductHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    // Soft-delete: archive only. The product row stays so order / inventory /
    // purchase-invoice history keeps its FK target. A hard delete would either
    // orphan history (those refs have no onDelete) or throw now that FK
    // enforcement is on. Images are left in place (the product still exists).
    const updated = await db
      .update(product)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(product.id, input.id));

    if (updated.changes === 0) {
      throw new ORPCError("NOT_FOUND", { data: { key: "error_product_not_found" } });
    }

    return { success: true };
  });
