import { fail, redirect } from "@sveltejs/kit";
import { CURRENCIES } from "@repo/config";
import { auth, isDashboardRole } from "$lib/server/auth";
import { db, shop } from "$lib/server/db";
import { logger } from "$lib/server/logger";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  // Reachability is owned by hooks.setupGate. Hard-floor here too.
  const existingShop = await db.query.shop.findFirst({
    columns: { id: true },
  });
  if (existingShop) throw redirect(303, "/");

  const firstUser = await db.query.user.findFirst({ columns: { id: true } });
  if (firstUser && !isDashboardRole(locals.session?.user.role)) {
    throw redirect(303, "/signin?return_url=/setup");
  }

  return { needsAccount: !firstUser };
};

export const actions: Actions = {
  default: async ({ locals, request }) => {
    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const storeName = String(form.get("storeName") ?? "").trim();
    const currency = String(form.get("currency") ?? "USD");

    const existingShop = await db.query.shop.findFirst({
      columns: { id: true },
    });
    if (existingShop) return fail(409, { message: "Store is already set up.", values: null });

    const firstUser = await db.query.user.findFirst({ columns: { id: true } });
    const needsAccount = !firstUser;

    if ((!name || !email || password.length < 8) && needsAccount) {
      return fail(400, {
        message: "All fields are required and password must be at least 8 characters.",
        values: { name, email, storeName, currency },
      });
    }
    if (!storeName) {
      return fail(400, {
        message: "Store name is required.",
        values: { name, email, storeName, currency },
      });
    }
    if (!CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) {
      return fail(400, { message: "Invalid currency.", values: { name, email, storeName, currency: "USD" } });
    }

    let userId = locals.session?.user.id ?? "";
    if (needsAccount) {
      // First account becomes owner in auth.ts. OAuth-first setup skips this:
      // user already exists and only the shop row remains.
      try {
        const signUp = await auth.api.signUpEmail({
          body: { name, email, password },
          headers: request.headers,
        });
        userId = signUp?.user?.id ?? "";
      } catch {
        return fail(400, {
          message: "Could not create the account. That email may already be in use.",
          values: { name, email, storeName, currency },
        });
      }
    } else if (!isDashboardRole(locals.session?.user.role)) {
      return fail(401, { message: "Sign in as the store owner to finish setup.", values: null });
    }

    if (!userId) {
      return fail(400, { message: "Could not create the account.", values: { name, email, storeName, currency } });
    }

    try {
      await db.insert(shop).values({
        id: Bun.randomUUIDv7(),
        name: storeName,
        currency: currency as (typeof CURRENCIES)[number],
      });
    } catch (err) {
      logger.error({ err, userId }, "shop insert failed after owner creation");
      return fail(500, {
        message: "Account created but store setup failed. Reset the database to retry.",
        values: { name, email, storeName, currency },
      });
    }

    throw redirect(303, needsAccount ? "/signin?setup=1" : "/");
  },
};
