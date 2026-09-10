import { z } from "zod";
import { db } from "$lib/server/db";
import { os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  productId: z.string().min(1),
});

export const getSuppliersHandler = os
  .input(input)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const productSuppliers = await db.query.productSupplier.findMany({
      where: {
        productId: input.productId,
      },
      with: {
        supplier: true,
      },
    });

    const items = productSuppliers.map((ps) => ({
      id: ps.supplier?.id ?? null,
      name: ps.supplier?.name ?? null,
      contactName: ps.supplier?.contactName ?? null,
      phone: ps.supplier?.phone ?? null,
      phone2: ps.supplier?.phone2 ?? null,
      email: ps.supplier?.email ?? null,
      address: ps.supplier?.address ?? null,
      paymentTerms: ps.supplier?.paymentTerms ?? null,
      isPreferred: ps.isPreferred === "1",
    }));

    return { items };
  });
