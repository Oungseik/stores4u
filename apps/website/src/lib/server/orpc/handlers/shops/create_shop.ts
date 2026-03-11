import { ORPCError } from "@orpc/server";
import { eq, shop } from "@repo/auth";
import { setting } from "@repo/db";
import { z } from "zod";
import { db } from "$lib/server/auth_db";
import { logger } from "$lib/server/logger";
import { authMiddleware, os } from "$lib/server/orpc/base";
import { createShopDatabase, deleteShopDatabase, getShopDb } from "$lib/server/shop_db";

const input = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
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

export const createShopHandler = os
  .use(authMiddleware)
  .input(input)
  .handler(async ({ input, context }) => {
    const existingShop = await db.query.shop.findFirst({
      where: { slug: input.slug, userId: context.session.user.id },
    });

    if (existingShop) {
      throw new ORPCError("INPUT_VALIDATION_FAILED", {
        message: `You already have a shop with slug "${input.slug}"`,
      });
    }

    const userHasShop = await db.query.shop.findFirst({
      where: { userId: context.session.user.id },
    });
    if (userHasShop) {
      throw new ORPCError("INPUT_VALIDATION_FAILED", {
        message: "You can only own one shop",
      });
    }

    const result = await db
      .insert(shop)
      .values({ name: input.name, slug: input.slug, userId: context.session.user.id })
      .returning();

    const createdShop = result.at(0);
    if (!createdShop) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: `Failed to create shop "${input.name}"`,
      });
    }

    let tursoDbUrl: string | undefined;
    try {
      tursoDbUrl = await createShopDatabase(createdShop.slug);

      await db.update(shop).set({ tursoDbUrl }).where(eq(shop.id, createdShop.id));
    } catch (e) {
      logger.error({ err: e, shopSlug: createdShop.slug }, "Failed to create shop database");
      await db.delete(shop).where(eq(shop.id, createdShop.id));
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create shop database. Please try again.",
      });
    }

    try {
      const shopDb = getShopDb({
        slug: createdShop.slug,
        tursoDbUrl,
      });
      await shopDb.insert(setting).values({
        title: input.title,
        description: input.description,
        address: input.address,
        city: input.city,
        phone: input.phone,
        region: input.region,
        country: input.country,
        logo: input.logo,
        heroImage: input.heroImage,
      });
    } catch (e) {
      logger.error({ err: e, shopSlug: createdShop.slug }, "Failed to create shop setting");
      try {
        await deleteShopDatabase(createdShop.slug);
      } catch (cleanupError) {
        logger.error(
          { err: cleanupError, shopSlug: createdShop.slug },
          "Failed to delete shop database after shop setup failure",
        );
      }
      await db.delete(shop).where(eq(shop.id, createdShop.id));
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create shop settings. Please try again.",
      });
    }

    return {
      ...createdShop,
      tursoDbUrl,
    };
  });
