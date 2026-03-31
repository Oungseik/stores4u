import { eq, account } from "@repo/auth";
import { db } from "$lib/server/auth_db";
import { authMiddleware, os } from "$lib/server/orpc/base";

export const listAccountsHandler = os.use(authMiddleware).handler(async ({ context }) => {
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