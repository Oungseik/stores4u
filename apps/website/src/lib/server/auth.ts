import { db, schema } from "$lib/server/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, role, twoFactor } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import {
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from "$env/static/private";
import { env } from "$env/dynamic/public";

export const dashboardRoles = ["owner", "admin", "member"] as const;
export type DashboardRole = (typeof dashboardRoles)[number];

export const isDashboardRole = (value: string | null | undefined): value is DashboardRole =>
  dashboardRoles.includes(value as DashboardRole);

const userManageActions = [
  "create",
  "list",
  "set-role",
  "ban",
  "impersonate",
  "delete",
  "set-password",
  "set-email",
  "get",
  "update",
] as const;
const sessionManageActions = ["list", "revoke", "delete"] as const;
const noAdminPower = role({ user: [], session: [] });

export const auth = betterAuth({
  baseURL: env.PUBLIC_ENVIRONMENT === "development" ? undefined : BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  secret: BETTER_AUTH_SECRET,
  // No implicit linking: a matching Google/Facebook email never silently
  // creates or links an account. Post-setup creation is blocked in the user
  // create hook below; linked OAuth signin still works.
  account: { accountLinking: { enabled: true, disableImplicitLinking: true } },
  emailAndPassword: { enabled: true, autoSignIn: false },
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
    admin({
      defaultRole: "user",
      adminRoles: ["owner"],
      roles: {
        owner: role({ user: [...userManageActions], session: [...sessionManageActions] }),
        admin: noAdminPower,
        member: noAdminPower,
        user: noAdminPower,
      },
    }),
    twoFactor(),
    sveltekitCookies(getRequestEvent),
  ],
  databaseHooks: {
    user: {
      create: {
        // First user ever created becomes owner. Later account creation is
        // deferred to the owner/admin invite flow; this also blocks raw OAuth
        // signup after setup while preserving linked OAuth signin.
        before: async (incoming) => {
          const existing = await db.query.user.findFirst({ columns: { id: true } });
          if (existing) {
            throw new Error("Account creation is invite-only after setup.");
          }
          return { data: { ...incoming, role: "owner" } };
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
