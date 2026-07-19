import { ORPCError } from "@orpc/server";
import { getRequestEvent } from "$app/server";
import { CURRENCIES, isValidTimezone } from "@repo/config";
import { z } from "zod";
import { auth, isDashboardRole } from "$lib/server/auth";
import { db, shop } from "$lib/server/db";
import { logger } from "$lib/server/logger";
import { os } from "$lib/server/orpc/base";

const input = z.object({
  storeName: z.string().min(1).max(100),
  currency: z.enum(CURRENCIES).default("USD"),
  timezone: z.string().refine(isValidTimezone),
  // Owner credentials are only required on the true first-run path (no users
  // yet). On the OAuth-first path the owner is already signed in.
  name: z.string().min(1).optional(),
  email: z.email().optional(),
  password: z.string().min(8).optional(),
});

/**
 * One-time store setup. Two paths mirror the original setup action exactly:
 * - No users yet: create the first owner via signUpEmail (the user create hook
 *   grants role "owner"), then insert the shop row. Owner is NOT signed in
 *   (autoSignIn is off); the client sends them to /signin to sign in.
 * - Owner already exists (OAuth first run): require a dashboard session, then
 *   insert the shop row.
 * One store per server: refuses if a shop already exists.
 */
export const setupCreateHandler = os.input(input).handler(async ({ input, context }) => {
  const existingShop = await db.query.shop.findFirst({ columns: { id: true } });
  if (existingShop) {
    throw new ORPCError("BAD_REQUEST", { data: { key: "error_store_is_already_set_up" } });
  }

  const firstUser = await db.query.user.findFirst({ columns: { id: true } });
  const needsAccount = !firstUser;

  let userId = context.session?.user.id ?? "";

  if (needsAccount) {
    if (!input.name || !input.email || !input.password) {
      throw new ORPCError("INPUT_VALIDATION_FAILED", {
        data: { key: "error_name_email_and_password_are_required_to_create_the_owne" },
      });
    }
    try {
      const signUp = await auth.api.signUpEmail({
        body: { name: input.name, email: input.email, password: input.password },
        headers: getRequestEvent().request.headers,
      });
      userId = signUp?.user?.id ?? "";
    } catch {
      throw new ORPCError("BAD_REQUEST", {
        data: { key: "error_could_not_create_the_account_that_email_may_already_be_" },
      });
    }
  } else if (!context.session || !isDashboardRole(context.session.user.role)) {
    throw new ORPCError("UNAUTHORIZED", {
      data: { key: "error_sign_in_as_the_store_owner_to_finish_setup" },
    });
  }

  if (!userId) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      data: { key: "error_could_not_create_the_account" },
    });
  }

  try {
    await db.insert(shop).values({
      id: crypto.randomUUID(),
      name: input.storeName,
      currency: input.currency,
      timezone: input.timezone,
    });
  } catch (err) {
    logger.error({ err, userId }, "shop insert failed after owner creation");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      data: { key: "error_account_created_but_store_setup_failed_reset_the_databa" },
    });
  }

  return { needsAccount };
});
