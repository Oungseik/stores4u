import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, twoFactor } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
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
} from "$env/static/private";
import { db } from "$lib/server/auth_db";
import { transporter } from "$lib/server/email";

export const auth = betterAuth({
  baseURL: env.PUBLIC_ENVIRONMENT === "development" ? undefined : BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),

  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  secret: BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await transporter.sendMail({
        from: NO_REPLY_EMAIL,
        to: user.email,
        subject: "Verify your email",
        html: `verify your email with ${url}`,
      });
    },
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
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type === "forget-password") {
          await transporter.sendMail({
            from: NO_REPLY_EMAIL,
            to: email,
            subject: "Reset password",
            html: `OTP for reset password ${otp}`,
          });
        }
      },
    }),
    twoFactor({
      otpOptions: {
        sendOTP: async ({ user, otp }) => {
          await transporter.sendMail({
            from: NO_REPLY_EMAIL,
            to: user.email,
            subject: "Reset password",
            html: `OTP is ${otp}`,
          });
        },
      },
    }),
    sveltekitCookies(getRequestEvent),
  ],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
