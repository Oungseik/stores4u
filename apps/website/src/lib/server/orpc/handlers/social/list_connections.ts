import { z } from "zod";
import { db } from "$lib/server/auth_db";
import { authMiddleware, os, shopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
});

export const listConnectionsHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(shopMiddleware)
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const connections = await db.query.socialConnection.findMany({
      where: { shopId: context.shop.id },
    });

    return connections.map((conn) => ({
      id: conn.id,
      platform: conn.platform,
      name: conn.pageName,
      isConnected: true,
      connectedAccount: {
        name: conn.pageName,
        pageName: conn.pageName,
        connectedAt: conn.createdAt,
      },
      permissions: conn.permissions,
    }));
  });
