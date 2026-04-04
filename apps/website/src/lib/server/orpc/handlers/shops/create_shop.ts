import { ORPCError } from "@orpc/server";
import { eq, shop } from "@repo/website-auth";
import { COUNTRIES } from "@repo/config";
import { z } from "zod";
import { db } from "$lib/server/auth_db";
import { logger } from "$lib/server/logger";
import { authMiddleware, os } from "$lib/server/orpc/base";
import { createShopDatabase } from "$lib/server/shop_db";

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
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  email: z.email().max(200).optional(),
  country: z.enum(COUNTRIES).optional(),
  logo: z.string().max(500).optional(),
  heroImage: z.string().max(500).optional(),
});

export const createShopHandler = os
  .use(authMiddleware)
  .input(input)
  .handler(async ({ input, context }) => {
    if (input.slug === "parent") {
      throw new ORPCError("FORBIDDEN", { message: `Slug "parent" is reserved` });
    }

    const existingShop = await db.query.shop.findFirst({
      where: { slug: input.slug, userId: context.session.user.id },
    });

    if (existingShop) {
      throw new ORPCError("BAD_REQUEST", {
        message: `You already have a shop with slug "${input.slug}"`,
      });
    }

    const userHasShop = await db.query.shop.findFirst({
      where: { userId: context.session.user.id },
    });
    if (userHasShop) {
      throw new ORPCError("BAD_REQUEST", {
        message: "You can only own one shop",
      });
    }

    const shopInfo = { ...input, id: Bun.randomUUIDv7(), userId: context.session.user.id };
    const result = await db.insert(shop).values(shopInfo);

    if (!result.rowsAffected) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: `Failed to create shop "${input.name}"`,
      });
    }

    try {
      const url = await createShopDatabase(input.slug);
      await db.update(shop).set({ tursoDbUrl: url }).where(eq(shop.id, shopInfo.id));
    } catch (e) {
      logger.error({ err: e, shopSlug: input.slug }, "Failed to create shop database");
      await db.delete(shop).where(eq(shop.id, shopInfo.id));
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create shop database. Please try again.",
      });
    }

    return shopInfo;
  });
