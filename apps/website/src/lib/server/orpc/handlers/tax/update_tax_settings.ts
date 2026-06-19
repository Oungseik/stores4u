import { z } from "zod";
import { db, taxSettings } from "$lib/server/db";

import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  enabled: z.boolean(),
  name: z.string().min(1).max(100),
  rate: z.number().min(0).max(100),
});

export const updateTaxSettingsHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const now = new Date();

    await db
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
