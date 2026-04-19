import { z } from "zod";
import { os, protectedShopMiddleware, shopDbMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  productId: z.string().min(1),
});

export const getSuppliersHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const productSuppliers = await shopDb.query.productSupplier.findMany({
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
