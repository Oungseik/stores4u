import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { customer, customerTypes, db, eq } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  customerType: z.enum(customerTypes).optional(),
  contactName: z.string().max(255).nullable(),
  phone: z.string().max(50).nullable(),
  phone2: z.string().max(50).nullable(),
  email: z.string().max(255).nullable(),
  address: z.string().max(500).nullable(),
  taxId: z.string().max(255).nullable(),
  paymentTerms: z.string().max(255).nullable(),
  notes: z.string().max(2000).nullable(),
});

export const updateCustomerHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const updated = await db
      .update(customer)
      .set({
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
      .where(eq(customer.id, input.id))
      .returning();

    const result = updated.at(0);
    if (!result) {
      throw new ORPCError("NOT_FOUND");
    }

    return result;
  });
