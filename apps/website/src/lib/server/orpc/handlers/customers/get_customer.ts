import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  customerId: z.string().min(1),
});

export const getCustomerHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const found = await db.query.customer.findFirst({
      where: { id: input.customerId },
    });

    if (!found) {
      throw new ORPCError("NOT_FOUND", { data: { key: "error_customer_not_found" } });
    }

    return found;
  });
