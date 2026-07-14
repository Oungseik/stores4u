import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const session = locals.session?.session;
  const pathname = url.pathname;

  // Public auth routes viewable without a session.
  const publicPrefixes = [
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/magic-link",
    "/verify-account",
    "/invite",
  ];
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix)) && !session) {
    return;
  }

  if (!session) {
    return redirect(303, "/signin");
  }

  // Signed in: send to store setup if no store exists, else to the app.
  const shop = await db.query.shop.findFirst({ columns: { id: true } });

  if (!shop && pathname === "/setup") {
    return;
  }

  if (!shop) {
    return redirect(303, "/setup");
  }

  return redirect(303, url.searchParams.get("return_url") ?? "/");
};
