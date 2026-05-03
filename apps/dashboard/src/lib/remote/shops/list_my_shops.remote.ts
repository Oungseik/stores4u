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
    columns: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    where: {
      id: cursor ? { gt: cursor } : undefined,
      members: { userId: locals.session.userId },
    },
    with: {
      shopInfo: {
        columns: {
          organizationId: true,
          logo: true,
          title: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          phone: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
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
