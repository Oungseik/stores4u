import { z } from "zod";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/server/db";
import { sendAuthEmail } from "$lib/server/email";
import { buildLinks, type LinkPair } from "$lib/server/links";
import { os } from "$lib/server/orpc/base";
import { mintVerification } from "$lib/server/orpc/handlers/recovery/_mint";

const input = z.object({ email: z.email() });

/** Magic links live 15 minutes (matches the plugin's expiresIn). */
export const MAGIC_TTL_MS = 15 * 60 * 1000;

/**
 * Magic-link signin request. Mints a verification row in better-auth's exact
 * magic-link shape (`identifier: <token>`, `value: JSON {email, name}`) so the
 * verify endpoint at /api/auth/magic-link/verify consumes it and signs the user
 * in. disableSignUp is on, so only existing users can use it. Always returns
 * the offline + online link pair (shown on screen, Q9-B); email is best-effort.
 */
export const requestMagicLinkHandler = os.input(input).handler(async ({ input }) => {
  const found = await db.query.user.findFirst({
    where: { email: input.email },
    columns: { id: true, email: true, name: true },
  });
  if (!found) {
    return { links: null as LinkPair | null, emailSent: false };
  }

  const token = crypto.randomUUID();
  await mintVerification({
    identifier: token,
    value: JSON.stringify({ email: found.email, name: found.name }),
    ttlMs: MAGIC_TTL_MS,
  });

  // Point straight at better-auth's verify GET endpoint (sets session cookie).
  const origin = getRequestEvent().url.origin;
  const links = buildLinks({
    token,
    path: "/api/auth/magic-link/verify?callbackURL=/",
    requestOrigin: origin,
  });
  const emailSent = await sendAuthEmail({
    email: found.email,
    subject: "Your sign-in link",
    url: links.online,
    token,
  });

  return { links, emailSent };
});
