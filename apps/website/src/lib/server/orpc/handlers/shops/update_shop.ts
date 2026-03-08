import { ORPCError } from "@orpc/server";
import { eq, shop } from "@repo/auth";
import { connectShopDb, shopSetting } from "@repo/db";
import { z } from "zod";
import { SHOP_DATA_DIR } from "$env/static/private";
import { db } from "$lib/server/auth_db";
import { authMiddleware, os } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  phone: z.string().min(1).max(50),
  region: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  logo: z.string().max(500).optional(),
  heroImage: z.string().max(500).optional(),
});

export const updateShopHandler = os
  .use(authMiddleware)
  .input(input)
  .handler(async ({ input, context }) => {
    const existingShop = await db.query.shop.findFirst({
      where: { slug: input.slug },
    });

    if (!existingShop) {
      throw new ORPCError("NOT_FOUND", {
        message: `Shop with slug "${input.slug}" not found`,
      });
    }

    if (existingShop.userId !== context.session.user.id) {
      throw new ORPCError("FORBIDDEN", {
        message: "You do not have permission to update this shop",
      });
    }

    if (input.name !== undefined) {
      await db.update(shop).set({ name: input.name }).where(eq(shop.id, existingShop.id));
    }

    const shopDb = connectShopDb(existingShop.slug, SHOP_DATA_DIR);

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

    await shopDb.insert(shopSetting).values(settingValues).onConflictDoUpdate({
      target: shopSetting.id,
      set: settingValues,
    });

    return { success: true };
  });
