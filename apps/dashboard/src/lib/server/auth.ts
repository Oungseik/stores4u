import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { env } from "$env/dynamic/private";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";

export const auth = betterAuth({
  baseURL: env.ORIGIN,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
  },
  plugins: [
    organization({
      schema: {
        organization: {
          additionalFields: {
            tursoDbUrl: {
              type: "string",
              required: false,
            },
            tursoDbToken: {
              type: "string",
              required: false,
            },
            isActive: {
              type: "boolean",
              required: false,
              defaultValue: true,
            },
          },
        },
      },
    }),
    sveltekitCookies(getRequestEvent), // make sure this is the last plugin in the array
  ],
});

export type Organization = typeof auth.$Infer.Organization;
export type Member = typeof auth.$Infer.Member;
export type AuthSession = typeof auth.$Infer.Session;
