import { ORPCError } from "@orpc/server";
import { eq, shop } from "@repo/auth";
import { z } from "zod";
import { db } from "$lib/server/auth_db";
import { authMiddleware, os } from "$lib/server/orpc/base";
import { turso } from "$lib/server/turso";

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
    const existingShop = await db.query.shop.findFirst({
      where: { slug: input.slug, userId: context.session.user.id },
      // where: and(eq(shop.slug, input.slug), eq(shop.userId, context.session.user.id)),
    });
    if (existingShop) {
      throw new ORPCError("INPUT_VALIDATION_FAILED", {
        message: `You already have a shop with slug "${input.slug}"`,
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

    try {
      await turso.databases.create(createdShop.id, { schema: "parent" });
    } catch (e) {
      console.error(`Failed to create database for ${createdShop.id}`);
      await db.delete(shop).where(eq(shop.id, createdShop.id));
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create shop database. Please try again.",
      });
    }

    return createdShop;
  });
