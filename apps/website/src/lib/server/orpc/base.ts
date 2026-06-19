import { os as base, ORPCError } from "@orpc/server";
import type { ShopInfoSelect, ShopSelect } from "$lib/server/db";
import { db } from "$lib/server/db";

type ShopWithInfo = ShopSelect & {
  shopInfo: ShopInfoSelect | null;
};

type Context = {
  session?: {
    session: {
      id: string;
      userId: string;
      expiresAt: Date;
      createdAt: Date;
      updatedAt: Date;
      token: string;
      ipAddress?: string | null;
      userAgent?: string | null;
    };
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
      name: string;
      createdAt: Date;
      updatedAt: Date;
      image?: string | null;
    };
  } | null;
  shop?: ShopWithInfo;
};

export const os = base.$context<Context>().errors({
  FORBIDDEN: {},
  NOT_FOUND: {},
  INTERNAL_SERVER_ERROR: {},
  INPUT_VALIDATION_FAILED: {
    status: 422,
  },
});

export const authMiddleware = os.middleware(async ({ context, next }) => {
  const session = context.session;
  if (!session) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return next({ context: { session } });
});

Object.defineProperty(authMiddleware, "name", { value: "auth_middleware" });

/**
 * Resolves the single store for this server. No slug — one store per install.
 * Throws if the store has not been set up yet.
 */
export const shopMiddleware = os.middleware(async ({ next }) => {
  const shop = await db.query.shop.findFirst({ with: { shopInfo: true } });
  if (!shop) {
    throw new ORPCError("NOT_FOUND", { message: "Store is not set up" });
  }
  return next({ context: { shop } });
});

Object.defineProperty(shopMiddleware, "name", { value: "shop_middleware" });

/** Requires a session and that the signed-in user owns the single store. */
export const protectedShopMiddleware = os.middleware(async ({ context, next }) => {
  const session = context.session;
  if (!session) {
    throw new ORPCError("UNAUTHORIZED");
  }

  const shop = await db.query.shop.findFirst({
    where: { userId: session.user.id },
    with: { shopInfo: true },
  });

  if (!shop) {
    throw new ORPCError("NOT_FOUND", { message: "Store is not set up" });
  }

  return next({ context: { session, shop } });
});

Object.defineProperty(protectedShopMiddleware, "name", { value: "protected_shop_middleware" });
