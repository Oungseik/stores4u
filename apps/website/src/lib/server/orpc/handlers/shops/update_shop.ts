import { db, shop, shopInfo } from "$lib/server/db";
import { eq } from "drizzle-orm";
import { COUNTRIES } from "@repo/config";
import { z } from "zod";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";
import { extractObjectKey, removeImage } from "$lib/server/storage";

const input = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(100).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  phone: z.string().min(1).max(50),
  state: z.string().min(1).max(100),
  zipCode: z.string().min(1).max(20),
  email: z.email().max(200),
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
    const oldHeroImage = context.shop.shopInfo?.heroImage;

    // Update core shop fields
    await db
      .update(shop)
      .set({
        name: input.name,
        logo: input.logo,
      })
      .where(eq(shop.id, context.shop.id));

    // Upsert shopInfo
    if (context.shop.shopInfoId) {
      // Update existing shopInfo
      await db
        .update(shopInfo)
        .set({
          title: input.title ?? "",
          description: input.description ?? null,
          heroImage: input.heroImage ?? null,
          address: input.address,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
          country: input.country,
          phone: input.phone,
          email: input.email,
          taxId: input.taxId ?? null,
          logo: input.logo ?? null,
          updatedAt: new Date(),
        })
        .where(eq(shopInfo.id, context.shop.shopInfoId));
    } else {
      // Create new shopInfo and link to shop
      const infoId = Bun.randomUUIDv7();
      await db.insert(shopInfo).values({
        id: infoId,
        title: input.title ?? "",
        description: input.description ?? null,
        heroImage: input.heroImage ?? null,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        country: input.country,
        phone: input.phone,
        email: input.email,
        taxId: input.taxId ?? null,
        logo: input.logo ?? null,
      });
      await db.update(shop).set({ shopInfoId: infoId }).where(eq(shop.id, context.shop.id));
    }

    // Clean up old images
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
