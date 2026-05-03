import { eq } from "drizzle-orm";
import { getRequestEvent, query } from "$app/server";
import { assertAuth } from "$lib/remote/auth";
import { db } from "$lib/server/db";
import { shop } from "$lib/server/db/schema";

export const getMyShops = query(async () => {
  const { locals } = getRequestEvent();
  assertAuth(locals);

  return db.query.shop.findMany({
    where: eq(shop.userId, locals.session.userId),
  });
});
