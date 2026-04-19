import { z } from "zod";

import {
  authMiddleware,
  os,
  protectedShopMiddleware,
  shopDbMiddleware,
} from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
});

export const getTaxSettingsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ context: { shopDb } }) => {
    const settings = await shopDb.query.taxSettings.findFirst();
    return { settings };
  });
