import { ORPCError } from "@orpc/server";
import { eq, supplier } from "@repo/db";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  contactName: z.string().max(255).nullable(),
  phone: z.string().max(50).nullable(),
  phone2: z.string().max(50).nullable(),
  email: z.string().max(255).nullable(),
  address: z.string().max(500).nullable(),
  paymentTerms: z.string().max(255).nullable(),
});

export const updateSupplierHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);

    const updated = await shopDb
      .update(supplier)
      .set({
        name: input.name,
        contactName: input.contactName,
        phone: input.phone,
        phone2: input.phone2,
        email: input.email,
        address: input.address,
        paymentTerms: input.paymentTerms,
      })
      .where(eq(supplier.id, input.id))
      .returning();

    const result = updated.at(0);
    if (!result) {
      throw new ORPCError("NOT_FOUND");
    }

    return result;
  });
