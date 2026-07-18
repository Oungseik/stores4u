import { localizePath } from "$lib/localize-path";
import { error, redirect } from "@sveltejs/kit";
import { isDashboardRole } from "$lib/server/auth";
import { db } from "$lib/server/db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.session) {
    return redirect(303, localizePath(`/signin?return_url=${url.pathname}`));
  }
  if (!isDashboardRole(locals.session.user.role)) {
    throw error(403, "error_dashboard_staff_required");
  }

  const shop = await db.query.shop.findFirst({
    with: { shopInfo: true },
  });

  if (!shop) {
    return redirect(303, localizePath("/setup"));
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
    timezone: shop.timezone,
    phone: shop.shopInfo?.phone ?? null,
    email: shop.shopInfo?.email ?? null,
    taxId: shop.shopInfo?.taxId ?? null,
    user: locals.session.user,
    session: locals.session.session,
  };
};
