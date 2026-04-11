import { createTransporter } from "@repo/website-auth";
import { createAuth } from "@repo/website-auth/server";
import { getRequestEvent } from "$app/server";
import { env } from "$env/dynamic/public";
import {
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  NO_REPLY_EMAIL,
  SES_SMTP_HOST,
  SES_SMTP_PASS,
  SES_SMTP_PORT,
  SES_SMTP_USER,
} from "$env/static/private";
import { db } from "$lib/server/auth_db";

const port = Number(SES_SMTP_PORT ?? "465");

export const auth = createAuth({
  db,
  transporter: createTransporter({
    host: SES_SMTP_HOST,
    port,
    user: SES_SMTP_USER,
    pass: SES_SMTP_PASS,
  }),
  noReplyEmail: NO_REPLY_EMAIL,
  betterAuthSecret: BETTER_AUTH_SECRET,
  betterAuthUrl: BETTER_AUTH_URL,
  googleClientId: GOOGLE_CLIENT_ID,
  googleClientSecret: GOOGLE_CLIENT_SECRET,
  facebookClientId: FACEBOOK_CLIENT_ID,
  facebookClientSecret: FACEBOOK_CLIENT_SECRET,
  isDevelopment: env.PUBLIC_ENVIRONMENT === "development",
  getRequestEvent,
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
