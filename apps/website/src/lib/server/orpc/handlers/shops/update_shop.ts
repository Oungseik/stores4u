import { ORPCError } from "@orpc/server";
import { eq, shop } from "@repo/auth";
import { COUNTRIES } from "@repo/config";
import { setting } from "@repo/db";
import { z } from "zod";
import { db } from "$lib/server/auth_db";
import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";
import { getShopDb } from "$lib/server/shop_db";

const input = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  phone: z.string().min(1).max(50),
  region: z.string().max(100).optional(),
  country: z.enum(COUNTRIES),
  logo: z.string().max(500).optional(),
  heroImage: z.string().max(500).optional(),
});

export const updateShopHandler = os
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    if (context.shop.userId !== context.session.user.id) {
      throw new ORPCError("FORBIDDEN", {
        message: "You do not have permission to update this shop",
      });
    }

    if (input.name !== undefined) {
      await db.update(shop).set({ name: input.name }).where(eq(shop.id, context.shop.id));
    }

    const shopDb = getShopDb(context.shop);

    const settingValues = {
      title: input.title,
      description: input.description,
      address: input.address,
      city: input.city,
      phone: input.phone,
      region: input.region,
      country: input.country,
      logo: input.logo,
      heroImage: input.heroImage,
    };

    await shopDb.insert(setting).values(settingValues).onConflictDoUpdate({
      target: setting.id,
      set: settingValues,
    });

    return { success: true };
  });
