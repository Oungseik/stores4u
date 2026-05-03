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

  const items = await db.query.shop.findMany({
    where: { userId: locals.session.userId, id: cursor ? { gt: cursor } : undefined },
    with: { info: true },
    orderBy: { id: "asc" },
    limit: limit + 1,
  });

  let nextCursor: string | undefined;
  if (items.length > limit) {
    items.pop();
    nextCursor = items[items.length - 1]?.id;
  }

  return { items, nextCursor };
});
