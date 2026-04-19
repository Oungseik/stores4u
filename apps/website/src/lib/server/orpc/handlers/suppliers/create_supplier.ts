import { ORPCError } from "@orpc/server";
import { supplier } from "@repo/db";
import { z } from "zod";
import {
  authMiddleware,
  os,
  protectedShopMiddleware,
  shopDbMiddleware,
} from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  contactName: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  phone2: z.string().max(50).optional(),
  email: z.string().max(255).optional(),
  address: z.string().max(500).optional(),
  paymentTerms: z.string().max(255).optional(),
});

export const createSupplierHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const inserted = await shopDb
      .insert(supplier)
      .values({
        name: input.name,
        contactName: input.contactName,
        phone: input.phone,
        phone2: input.phone2,
        email: input.email,
        address: input.address,
        paymentTerms: input.paymentTerms,
      })
      .returning();

    const created = inserted.at(0);
    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return created;
  });
