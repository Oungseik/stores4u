import { ORPCError } from "@orpc/server";
import { eq, shop } from "@repo/auth";
import { z } from "zod";
import { db } from "$lib/server/auth_db";
import { authMiddleware, os } from "$lib/server/orpc/base";
import { turso } from "$lib/server/turso";

const input = z.object({
  name: z.string(),
});

export const createShopHandler = os
  .use(authMiddleware)
  .input(input)
  .handler(async ({ input, context }) => {
    const result = await db
      .insert(shop)
      .values({ name: input.name, userId: context.session.user.id })
      .returning();

    const shopId = result.at(0)?.id;
    if (!shopId) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: `Failed to create shop "${input.name}"`,
      });
    }

    try {
      await turso.databases.create(shopId, { schema: "parent" });
    } catch (e) {
      console.error(`Failed to create database for ${shopId}`);
      await db.delete(shop).where(eq(shop.id, shopId));
    }
  });
