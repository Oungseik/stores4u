import { z } from "zod";

import { os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
});

export const getTaxSettingsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .handler(async ({ context }) => {
    const shopDb = getShopDb(context.shop);

    const settings = await shopDb.query.taxSettings.findFirst();
    return { settings };
  });
