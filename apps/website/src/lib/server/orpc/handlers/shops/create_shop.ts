import { ORPCError } from "@orpc/server";
import { eq, shop } from "@repo/auth";
import { z } from "zod";
import { TURSO_GROUP, TURSO_PARENT_DB_NAME } from "$env/static/private";
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

    try {
      let parentDb: Awaited<ReturnType<typeof turso.databases.get>> | null = null;
      try {
        parentDb = await turso.databases.get(TURSO_PARENT_DB_NAME);
      } catch (_e) {
        parentDb = null;
      }

      if (!parentDb) {
        await turso.databases.create(TURSO_PARENT_DB_NAME, {
          group: TURSO_GROUP,
          is_schema: true,
        });
      }

      await turso.databases.create(createdShop.id, {
        schema: TURSO_PARENT_DB_NAME,
        group: TURSO_GROUP,
      });
    } catch (e) {
      console.error(e);
      console.error(`Failed to create database for ${createdShop.id}`);
      await db.delete(shop).where(eq(shop.id, createdShop.id));
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create shop database. Please try again.",
      });
    }

    return createdShop;
  });
