import { z } from "zod";
import { customer, db, eq } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  id: z.string().min(1),
});

export const deleteCustomerHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    // No history guard: order.customerId is ON DELETE SET NULL, so deleting a
    // customer orphans order links while the order's snapshot columns
    // (customer_name/customer_phone) keep historical receipts intact.
    await db.delete(customer).where(eq(customer.id, input.id));
  });
