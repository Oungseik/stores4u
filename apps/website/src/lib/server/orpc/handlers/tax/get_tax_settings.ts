import { z } from "zod";
import { db } from "$lib/server/db";

import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({});

export const getTaxSettingsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async () => {
    const settings = await db.query.taxSettings.findFirst();
    return { settings };
  });
