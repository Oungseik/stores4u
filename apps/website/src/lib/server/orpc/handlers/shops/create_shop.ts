import { ORPCError } from "@orpc/server";
import { CURRENCIES } from "@repo/config";
import { z } from "zod";
import { db, shop } from "$lib/server/db";
import { authMiddleware, os } from "$lib/server/orpc/base";

const input = z.object({
  name: z.string().min(1).max(100),
  currency: z.enum(CURRENCIES).default("USD"),
});

/**
 * One-time store setup. One store per server — refuses if any shop already
 * exists (global, not per-user) and only owners may call it.
 */
export const createShopHandler = os
  .use(authMiddleware)
  .input(input)
  .handler(async ({ input, context }) => {
    if (context.session.user.role !== "owner") {
      throw new ORPCError("FORBIDDEN", {
        message: "Only the store owner can set up the store",
      });
    }

    const existing = await db.query.shop.findFirst({ columns: { id: true } });

    if (existing) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Store is already set up for this account",
      });
    }

    const newShopData = {
      id: Bun.randomUUIDv7(),
      name: input.name,
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
