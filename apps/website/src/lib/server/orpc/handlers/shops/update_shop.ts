import { eq, shop } from "@repo/website-auth";
import { COUNTRIES } from "@repo/config";
import { z } from "zod";
import { db } from "$lib/server/auth_db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { extractObjectKey, removeImage } from "$lib/server/storage";

const input = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  phone: z.string().min(1).max(50),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  email: z.email().max(200).optional(),
  taxId: z.string().max(100).optional(),
  country: z.enum(COUNTRIES),
  logo: z.string().max(500).optional(),
  heroImage: z.string().max(500).optional(),
});

export const updateShopHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input, context }) => {
    const oldLogo = context.shop.logo;
    const oldHeroImage = context.shop.heroImage;

    await db
      .update(shop)
      .set({
        name: input.name,
        title: input.title,
        description: input.description,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        country: input.country,
        phone: input.phone,
        email: input.email,
        taxId: input.taxId,
        logo: input.logo,
        heroImage: input.heroImage,
      })
      .where(eq(shop.id, context.shop.id));

    if (oldLogo && oldLogo !== input.logo) {
      const oldLogoKey = extractObjectKey(oldLogo);
      if (oldLogoKey) {
        await removeImage(oldLogoKey).catch(() => {});
      }
    }

    if (oldHeroImage && oldHeroImage !== input.heroImage) {
      const oldHeroImageKey = extractObjectKey(oldHeroImage);
      if (oldHeroImageKey) {
        await removeImage(oldHeroImageKey).catch(() => {});
      }
    }

    return { success: true };
  });
