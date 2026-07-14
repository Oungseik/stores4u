import { z } from "zod";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/server/db";
import { sendAuthEmail } from "$lib/server/email";
import { buildLinks, type LinkPair } from "$lib/server/links";
import { os } from "$lib/server/orpc/base";
import { mintResetToken } from "./_mint";

const input = z.object({ email: z.email() });

/**
 * Forgot-password (public). Always returns the offline + online link pair
 * (shown on screen, Q9-B: insecure-on-LAN accepted) — email is best-effort.
 * An unknown email returns a null pair; enumeration is already possible by
 * design because the links are surfaced on screen.
 */
export const requestPasswordResetHandler = os.input(input).handler(async ({ input }) => {
  const found = await db.query.user.findFirst({
    where: { email: input.email },
    columns: { id: true, email: true },
  });
  if (!found) {
    return { links: null as LinkPair | null, emailSent: false };
  }

  const token = await mintResetToken(found.id);
  const links = buildLinks({
    token,
    path: "/reset-password",
    requestOrigin: getRequestEvent().url.origin,
  });
  const emailSent = await sendAuthEmail({
    email: found.email,
    subject: "Reset your password",
    url: links.online,
    token,
  });

  return { links, emailSent };
});
