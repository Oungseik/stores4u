import { eq } from "drizzle-orm";
import { account, db } from "$lib/server/db";
import { authMiddleware, os } from "$lib/server/orpc/base";

export const listAccountsHandler = os
  .route({ method: "GET" })
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const userId = context.session.user.id;

    const accounts = await db
      .select({
        id: account.id,
        providerId: account.providerId,
        accountId: account.accountId,
        createdAt: account.createdAt,
      })
      .from(account)
      .where(eq(account.userId, userId));

    return accounts;
  });
