import { ORPCError } from "@orpc/server";
import { db, shop } from "$lib/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
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

    const newShopData = {
      id: Bun.randomUUIDv7(),
      name: input.name,
      slug: input.slug,
      userId: context.session.user.id,
    };
    const result = await db.insert(shop).values(newShopData);

    if (!result.changes) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: `Failed to create shop "${input.name}"`,
      });
    }

    try {
      await createShopDatabase(input.slug);
    } catch (e) {
      logger.error({ err: e, shopSlug: input.slug }, "Failed to create shop database");
      await db.delete(shop).where(eq(shop.id, newShopData.id));
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create shop database. Please try again.",
      });
    }

    return newShopData;
  });
