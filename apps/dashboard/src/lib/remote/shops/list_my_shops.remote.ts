import { z } from "zod";
import { getRequestEvent, query } from "$app/server";
import { assertAuth } from "$lib/remote/auth";
import { db } from "$lib/server/db";

const listMyShopsSchema = z
  .object({
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(1000),
  })
  .default({ limit: 20 });

export const listMyShops = query(listMyShopsSchema, async (input) => {
  const { locals } = getRequestEvent();
  assertAuth(locals);

  const { cursor, limit = 20 } = input;

  const shops = await db.query.organization.findMany({
    where: {
      id: cursor ? { gt: cursor } : undefined,
      members: { userId: locals.session.userId },
    },
    with: { shopInfo: true },
    orderBy: { id: "asc" },
    limit: limit + 1,
  });

  let nextCursor: string | undefined;
  if (shops.length > limit) {
    shops.pop();
    nextCursor = shops[shops.length - 1]?.id;
  }

  return { items: shops, nextCursor };
});
