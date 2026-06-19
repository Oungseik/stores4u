import { error, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.session) {
    return redirect(303, `/signin?return_url=${url.pathname}`);
  }

  const shop = await db.query.shop.findFirst({
    where: { userId: locals.session.user.id },
    with: { shopInfo: true },
  });

  if (!shop) {
    return redirect(303, "/setup");
  }

  return {
    ...shop,
    title: shop.shopInfo?.title ?? null,
    description: shop.shopInfo?.description ?? null,
    heroImage: shop.shopInfo?.heroImage ?? null,
    address: shop.shopInfo?.address ?? null,
    city: shop.shopInfo?.city ?? null,
    state: shop.shopInfo?.state ?? null,
    zipCode: shop.shopInfo?.zipCode ?? null,
    country: shop.shopInfo?.country ?? null,
    currency: shop.currency,
    phone: shop.shopInfo?.phone ?? null,
    email: shop.shopInfo?.email ?? null,
    taxId: shop.shopInfo?.taxId ?? null,
    user: locals.session.user,
    session: locals.session.session,
  };
};
