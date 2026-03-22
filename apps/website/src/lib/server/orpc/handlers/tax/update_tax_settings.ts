import { taxSettings } from "@repo/db";
import { z } from "zod";

import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  enabled: z.boolean(),
  name: z.string().min(1).max(100),
  rate: z.number().min(0).max(100),
});

export const updateTaxSettingsHandler = os
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    const shopDb = getShopDb(context.shop);
    const now = new Date();

    await shopDb
      .insert(taxSettings)
      .values({
        id: "default",
        enabled: input.enabled,
        name: input.name,
        rate: input.rate,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: taxSettings.id,
        set: {
          enabled: input.enabled,
          name: input.name,
          rate: input.rate,
          updatedAt: now,
        },
      });

    return { success: true };
  });
