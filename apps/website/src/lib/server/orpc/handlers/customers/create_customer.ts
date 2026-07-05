import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { customer, customerTypes, db } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  name: z.string().min(1).max(255),
  customerType: z.enum(customerTypes),
  contactName: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  phone2: z.string().max(50).optional(),
  email: z.string().max(255).optional(),
  address: z.string().max(500).optional(),
  taxId: z.string().max(255).optional(),
  paymentTerms: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
});

export const createCustomerHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const inserted = await db
      .insert(customer)
      .values({
        name: input.name,
        customerType: input.customerType,
        contactName: input.contactName,
        phone: input.phone,
        phone2: input.phone2,
        email: input.email,
        address: input.address,
        taxId: input.taxId,
        paymentTerms: input.paymentTerms,
        notes: input.notes,
      })
      .returning();

    const created = inserted.at(0);
    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return created;
  });
