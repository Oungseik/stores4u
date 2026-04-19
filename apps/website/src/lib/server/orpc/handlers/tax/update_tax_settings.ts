import { taxSettings } from "@repo/db";
import { z } from "zod";

import {
  authMiddleware,
  os,
  protectedShopMiddleware,
  shopDbMiddleware,
} from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  enabled: z.boolean(),
  name: z.string().min(1).max(100),
  rate: z.number().min(0).max(100),
});

export const updateTaxSettingsHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
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
