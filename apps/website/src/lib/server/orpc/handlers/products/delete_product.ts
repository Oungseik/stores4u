import { connectShopDb, eq, product } from "@repo/db";
import { z } from "zod";
import { SHOP_DATA_DIR } from "$env/static/private";
import { authMiddleware, os } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  id: z.string().min(1),
});

export const deleteProductHandler = os
  .use(authMiddleware)
  .input(input)
  .handler(async ({ input }) => {
    const shopDb = connectShopDb(input.slug, SHOP_DATA_DIR);

    await shopDb.delete(product).where(eq(product.id, input.id));
  });
