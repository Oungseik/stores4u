import { ORPCError, os } from "@orpc/server";
import { eq, shop } from "@repo/auth";
import { z } from "zod";
import { db } from "$lib/server/auth_db";
import { authMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
});

export const getShopHandler = os
  .use(authMiddleware)
  .input(input)
  .handler(async ({ input, context }) => {
    const shop = await db.query.shop.findFirst({
      where: { slug: input.slug },
    });

    if (!shop) {
      throw new ORPCError("NOT_FOUND", {
        message: `Shop with slug "${input.slug}" not found`,
      });
    }

    if (shop.userId !== context.session.user.id) {
      throw new ORPCError("FORBIDDEN", {
        message: "You do not have permission to access this shop",
      });
    }

    return {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      isActive: shop.isActive,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };
  });
