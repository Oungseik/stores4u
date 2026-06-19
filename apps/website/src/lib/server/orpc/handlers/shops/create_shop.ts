import { ORPCError } from "@orpc/server";
import { CURRENCIES } from "@repo/config";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, shop } from "$lib/server/db";
import { authMiddleware, os } from "$lib/server/orpc/base";

const input = z.object({
  name: z.string().min(1).max(100),
  currency: z.enum(CURRENCIES).default("USD"),
});

/**
 * One-time store setup. One store per server — refuses if a store already exists
 * for the signed-in user.
 */
export const createShopHandler = os
  .use(authMiddleware)
  .input(input)
  .handler(async ({ input, context }) => {
    const existing = await db.query.shop.findFirst({
      where: { userId: context.session.user.id },
    });

    if (existing) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Store is already set up for this account",
      });
    }

    const newShopData = {
      id: Bun.randomUUIDv7(),
      name: input.name,
      userId: context.session.user.id,
      currency: input.currency,
    };
    const result = (await db.insert(shop).values(newShopData)) as unknown as { changes: number };

    if (!result.changes) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: `Failed to set up store "${input.name}"`,
      });
    }

    return newShopData;
  });
