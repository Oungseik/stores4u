import { mkdir } from "node:fs/promises";
import { ORPCError } from "@orpc/server";
import { eq, shop } from "@repo/auth";
import { connectShopDb, migrateShopDb, shopSetting } from "@repo/db";
import { z } from "zod";
import { MIGRATION_FOLDER, SHOP_DATA_DIR } from "$env/static/private";
import { db } from "$lib/server/auth_db";
import { authMiddleware, os } from "$lib/server/orpc/base";

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

    // TODO remove this once implement correct plan logic
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

    let migrationsFolder: string;
    try {
      const shopsDir = `${SHOP_DATA_DIR}/shops`;
      await mkdir(shopsDir, { recursive: true });

      migrationsFolder = new URL(MIGRATION_FOLDER, import.meta.url).pathname;

      await migrateShopDb(createdShop.slug, SHOP_DATA_DIR, migrationsFolder);
    } catch (e) {
      console.error(e);
      console.error(`Failed to create database for ${createdShop.slug}`);
      await db.delete(shop).where(eq(shop.id, createdShop.id));
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create shop database. Please try again.",
      });
    }

    try {
      const shopDb = connectShopDb(createdShop.slug, SHOP_DATA_DIR);
      await shopDb.insert(shopSetting).values({
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
      console.error(e);
      console.error(`Failed to create shop setting for ${createdShop.slug}`);
      await db.delete(shop).where(eq(shop.id, createdShop.id));
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create shop settings. Please try again.",
      });
    }

    return createdShop;
  });
