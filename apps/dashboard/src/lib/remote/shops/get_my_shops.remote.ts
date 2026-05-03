import { getRequestEvent, query } from "$app/server";
import { assertAuth } from "$lib/remote/auth";
import { db } from "$lib/server/db";

export const getMyShops = query(async () => {
  const { locals } = getRequestEvent();
  assertAuth(locals);

  return db.query.shop.findMany({
    where: { userId: locals.session.userId },
  });
});
