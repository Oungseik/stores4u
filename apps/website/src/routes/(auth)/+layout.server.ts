import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
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

  // Signed in + verified: send to store setup if no store exists, else to the app.
  const shop = await db.query.shop.findFirst({
    columns: { id: true },
  });

  if (!shop && pathname === "/setup") {
    return;
  }

  if (!shop) {
    return redirect(303, "/setup");
  }

  return redirect(303, url.searchParams.get("return_url") ?? "/");
};
