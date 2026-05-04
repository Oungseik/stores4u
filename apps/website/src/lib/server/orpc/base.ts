import { os as base, ORPCError } from "@orpc/server";
import type { ShopSelect } from "$lib/server/db";
import { db as authDb } from "$lib/server/db";
import { getShopDb } from "$lib/server/shop_db";

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
  shopDb?: ReturnType<typeof getShopDb>;
  shop?: ShopSelect;
  shopId?: string;
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

export const shopMiddleware = os.middleware(async ({ context, next }, input: { slug: string }) => {
  const shop = await authDb.query.shop.findFirst({
    where: { slug: input.slug },
  });

  if (!shop) {
    throw new ORPCError("NOT_FOUND", {
      message: `Shop "${input.slug}" not found`,
    });
  }

  return next({ context: { ...context, shop } });
});

Object.defineProperty(shopMiddleware, "name", { value: "shop_middleware" });

export const protectedShopMiddleware = os.middleware(
  async ({ context, next }, input: { slug: string }) => {
    const session = context.session;
    if (!session) {
      throw new ORPCError("UNAUTHORIZED");
    }

    const shop = await authDb.query.shop.findFirst({
      where: { slug: input.slug },
    });

    if (!shop || shop.userId !== session.user.id) {
      throw new ORPCError("NOT_FOUND", {
        message: `Shop "${input.slug}" not found`,
      });
    }

    return next({ context: { session, shop } });
  },
);

Object.defineProperty(protectedShopMiddleware, "name", { value: "protected_shop_middleware" });

export const shopDbMiddleware = os
  .$context<{ shop: ShopSelect }>()
  .middleware(async ({ context, next }) => {
    const shopDb = getShopDb({ slug: context.shop.slug });

    return next({ context: { ...context, shopDb } });
  });

Object.defineProperty(shopDbMiddleware, "name", { value: "shop_db_middleware" });
