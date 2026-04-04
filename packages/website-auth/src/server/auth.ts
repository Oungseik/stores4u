import type { RequestEvent } from "@sveltejs/kit";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, twoFactor } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Transporter } from "nodemailer";
import type { schemaObj } from "../index";
import type { relations } from "../schema/relations";
import { createEmailCallbacks } from "./email";

type AuthDb = LibSQLDatabase<typeof schemaObj, typeof relations>;

type GetRequestEvent = () => RequestEvent;

export interface AuthConfig {
  db: AuthDb;
  transporter: Transporter;
  noReplyEmail: string;
  betterAuthSecret: string;
  betterAuthUrl?: string;
  googleClientId: string;
  googleClientSecret: string;
  facebookClientId: string;
  facebookClientSecret: string;
  isDevelopment: boolean;
  getRequestEvent?: GetRequestEvent;
}

export const createAuth = (config: AuthConfig) => {
  const emailCallbacks = createEmailCallbacks(config.transporter, config.noReplyEmail);

  const plugins: Parameters<typeof betterAuth>[0]["plugins"] = [
    emailOTP({
      sendVerificationOTP: emailCallbacks.sendVerificationOTP,
    }),
    twoFactor({
      otpOptions: {
        sendOTP: emailCallbacks.sendTwoFactorOTP,
      },
    }),
  ];

  if (config.getRequestEvent) {
    plugins.push(sveltekitCookies(config.getRequestEvent));
  }

  const auth = betterAuth({
    baseURL: config.isDevelopment ? undefined : config.betterAuthUrl,
    database: drizzleAdapter(config.db, {
      provider: "sqlite",
    }),

    session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
    secret: config.betterAuthSecret,

    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: emailCallbacks.sendVerificationEmail,
    },

    socialProviders: {
      google: {
        prompt: "select_account",
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
      },
      facebook: {
        clientId: config.facebookClientId,
        clientSecret: config.facebookClientSecret,
        scopes: [
          "email",
          "public_profile",
          "pages_show_list",
          "pages_manage_posts",
          "pages_read_engagement",
        ],
      },
    },

    plugins,
  });

  return auth;
};

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"]["session"];
export type AuthUser = ReturnType<typeof createAuth>["$Infer"]["Session"]["user"];
