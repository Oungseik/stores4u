import { createTransporter, createEmailCallbacks } from "$lib/server/email";
import { db } from "$lib/server/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, twoFactor } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
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
import { env } from "$env/dynamic/public";

const port = Number(SES_SMTP_PORT ?? "465");
const transporter = createTransporter({
  host: SES_SMTP_HOST,
  port,
  user: SES_SMTP_USER,
  pass: SES_SMTP_PASS,
});
const emailCallbacks = createEmailCallbacks(transporter, NO_REPLY_EMAIL);

export const auth = betterAuth({
  baseURL: env.PUBLIC_ENVIRONMENT === "development" ? undefined : BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  secret: BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true, autoSignIn: false },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: emailCallbacks.sendVerificationEmail,
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    },
    facebook: {
      clientId: FACEBOOK_CLIENT_ID,
      clientSecret: FACEBOOK_CLIENT_SECRET,
      scopes: [
        "email",
        "public_profile",
        "pages_show_list",
        "pages_manage_posts",
        "pages_read_engagement",
      ],
    },
  },
  plugins: [
    emailOTP({ sendVerificationOTP: emailCallbacks.sendVerificationOTP }),
    twoFactor({ otpOptions: { sendOTP: emailCallbacks.sendTwoFactorOTP } }),
    sveltekitCookies(getRequestEvent),
  ],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
