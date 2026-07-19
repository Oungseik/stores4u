import { COUNTRIES, CURRENCIES, isValidTimezone } from "@repo/config";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, shop, shopInfo } from "$lib/server/db";
import { os, ownerMiddleware, shopMiddleware } from "$lib/server/orpc/base";
import { extractObjectKey, removeImage } from "$lib/server/storage";

const input = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  address: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(50).optional(),
  state: z.string().min(1).max(100).optional(),
  zipCode: z.string().min(1).max(20).optional(),
  email: z.email().max(200).optional(),
  taxId: z.string().max(100).optional(),
  country: z.enum(COUNTRIES).optional(),
  currency: z.enum(CURRENCIES).optional(),
  timezone: z.string().refine(isValidTimezone).optional(),
  logo: z.string().max(500).optional(),
  heroImage: z.string().max(500).optional(),
});

export const updateShopHandler = os
  .input(input)
  .use(ownerMiddleware)
  .use(shopMiddleware)
  .handler(async ({ input, context }) => {
    const oldLogo = context.shop.logo;
    const oldHeroImage = context.shop.shopInfo?.heroImage;

    // Update core shop fields
    await db
      .update(shop)
      .set({
        name: input.name,
        logo: input.logo,
        currency: input.currency,
        timezone: input.timezone,
      })
      .where(eq(shop.id, context.shop.id));

    // Upsert shopInfo
    if (context.shop.shopInfoId) {
      // Update existing shopInfo
      await db
        .update(shopInfo)
        .set({
          title: input.title,
          description: input.description === undefined ? undefined : input.description || null,
          heroImage: input.heroImage === undefined ? undefined : input.heroImage || null,
          address: input.address,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
          country: input.country,
          phone: input.phone,
          email: input.email,
          taxId: input.taxId === undefined ? undefined : input.taxId || null,
          logo: input.logo === undefined ? undefined : input.logo || null,
          updatedAt: new Date(),
        })
        .where(eq(shopInfo.id, context.shop.shopInfoId));
    } else {
      // Create new shopInfo and link to shop
      const infoId = crypto.randomUUID();
      await db.insert(shopInfo).values({
        id: infoId,
        title: input.title ?? "",
        description: input.description ?? null,
        heroImage: input.heroImage ?? null,
        address: input.address ?? "",
        city: input.city ?? "",
        state: input.state ?? "",
        zipCode: input.zipCode ?? "",
        country: input.country ?? "US",
        phone: input.phone ?? "",
        email: input.email ?? "",
        taxId: input.taxId ?? null,
        logo: input.logo ?? null,
      });
      await db.update(shop).set({ shopInfoId: infoId }).where(eq(shop.id, context.shop.id));
    }

    // Clean up old images
    if (input.logo !== undefined && oldLogo && oldLogo !== input.logo) {
      const oldLogoKey = extractObjectKey(oldLogo);
      if (oldLogoKey) {
        await removeImage(oldLogoKey).catch(() => {});
      }
    }

    if (input.heroImage !== undefined && oldHeroImage && oldHeroImage !== input.heroImage) {
      const oldHeroImageKey = extractObjectKey(oldHeroImage);
      if (oldHeroImageKey) {
        await removeImage(oldHeroImageKey).catch(() => {});
      }
    }

    return { success: true };
  });
