import { ORPCError } from "@orpc/server";
import { getRequestEvent } from "$app/server";
import { CURRENCIES } from "@repo/config";
import { z } from "zod";
import { auth, isDashboardRole } from "$lib/server/auth";
import { db, shop } from "$lib/server/db";
import { logger } from "$lib/server/logger";
import { os } from "$lib/server/orpc/base";

const input = z.object({
  storeName: z.string().min(1).max(100),
  currency: z.enum(CURRENCIES).default("USD"),
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
    throw new ORPCError("BAD_REQUEST", { message: "Store is already set up." });
  }

  const firstUser = await db.query.user.findFirst({ columns: { id: true } });
  const needsAccount = !firstUser;

  let userId = context.session?.user.id ?? "";

  if (needsAccount) {
    if (!input.name || !input.email || !input.password) {
      throw new ORPCError("INPUT_VALIDATION_FAILED", {
        message: "Name, email, and password are required to create the owner.",
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
        message: "Could not create the account. That email may already be in use.",
      });
    }
  } else if (!context.session || !isDashboardRole(context.session.user.role)) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Sign in as the store owner to finish setup.",
    });
  }

  if (!userId) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Could not create the account." });
  }

  try {
    await db.insert(shop).values({
      id: Bun.randomUUIDv7(),
      name: input.storeName,
      currency: input.currency,
    });
  } catch (err) {
    logger.error({ err, userId }, "shop insert failed after owner creation");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Account created but store setup failed. Reset the database to retry.",
    });
  }

  return { needsAccount };
});
