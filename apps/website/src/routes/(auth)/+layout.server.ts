import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/auth_db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const session = locals.session?.session;
  const user = locals.session?.user;
  const pathname = url.pathname;
  const isEmailVerified = user?.emailVerified;

  if (["/signin", "/signup"].some((prefix) => pathname.startsWith(prefix)) && !session) {
    return;
  }

  if (pathname.startsWith("/forgot-password")) {
    return { session, user };
  }

  if (!session) {
    return redirect(303, "/signin");
  }

  if (!isEmailVerified && pathname.startsWith("/verify-account")) {
    return { session, user };
  }

  if (!isEmailVerified) {
    return redirect(303, "/verify-account");
  }

  const shops = await db.query.shop.findMany({
    where: { userId: user.id },
  });

  if (shops.length === 0 && pathname === "/setup") {
    return;
  }

  if (shops.length === 0) {
    return redirect(303, "/setup");
  }

  return redirect(303, url.searchParams.get("return_url") ?? `/${shops.at(0)?.slug}/admin`);
};
