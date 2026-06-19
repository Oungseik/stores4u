import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({});

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
}

export const getFacebookPagesHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ context }) => {
    const facebookAccount = await db.query.account.findFirst({
      where: { userId: context.session.user.id, providerId: "facebook" },
    });

    if (!facebookAccount?.accessToken) {
      throw new ORPCError("PRECONDITION_FAILED", {
        message: "NO_FACEBOOK_ACCOUNT",
      });
    }

    const response = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,category,picture.type(large)&access_token=${facebookAccount.accessToken}`,
    );

    if (!response.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "FACEBOOK_API_ERROR",
      });
    }

    const data = (await response.json()) as { data?: FacebookPage[] };

    const pages = (data.data || []).map((page) => ({
      id: page.id,
      name: page.name,
      accessToken: page.access_token,
      category: page.category,
      avatar: page.picture?.data?.url,
    }));

    return { pages };
  });
