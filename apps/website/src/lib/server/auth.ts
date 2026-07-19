import { db, schema } from "$lib/server/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, magicLink, role } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { getRequestEvent } from "$app/server";
import { env as privateEnv } from "$env/dynamic/private";
import { env } from "$env/dynamic/public";
import { sendAuthEmail } from "$lib/server/email";

const { BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = privateEnv;

if (!BETTER_AUTH_SECRET && !building) throw new Error("BETTER_AUTH_SECRET is not set");
if (!BETTER_AUTH_URL && !building) throw new Error("BETTER_AUTH_URL is not set");
const authSecret = BETTER_AUTH_SECRET || "build-time-placeholder-secret-32-chars";
const authBaseUrl = BETTER_AUTH_URL || "http://localhost";

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
  baseURL: env.PUBLIC_ENVIRONMENT === "development" ? undefined : authBaseUrl,
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  secret: authSecret,
  // No implicit linking: a matching Google email never silently
  // creates or links an account. Post-setup creation is blocked in the user
  // create hook below; linked OAuth signin still works.
  account: { accountLinking: { enabled: true, disableImplicitLinking: true } },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    // Block signin until the email is verified. Setup owner + invited users
    // are marked verified on creation, so this only gates future public
    // signup (currently closed) and any path that leaves a user unverified.
    requireEmailVerification: true,
    // No sendResetPassword: reset tokens are minted in orpc/handlers/recovery
    // and emailed via sendAuthEmail directly, so better-auth's /forget-password
    // (its only caller) is never hit.
  },
  // Email verification. sendOnSignUp is off: the first-owner /setup path and
  // invite-accept both mark emailVerified directly, so there is no unverified
  // signup to email. Flip to true if public signup reopens. The callback stays
  // wired for explicit resend / future flows.
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      const url = `${authBaseUrl.replace(/\/$/, "")}/verify-account?token=${token}`;
      await sendAuthEmail({
        email: user.email,
        subject: "Verify your email",
        url,
        token,
      });
    },
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
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
    // TOTP/email-OTP 2FA removed at this time; plugin stays out until reused.
    // Magic-link signin. disableSignUp: invite-only model, unknown emails are
    // rejected. The verify endpoint is better-auth's own GET (sets cookie).
    magicLink({
      expiresIn: 60 * 15,
      disableSignUp: true,
      sendMagicLink: async ({ email, url }) => {
        await sendAuthEmail({ email, subject: "Your sign-in link", url });
      },
    }),
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
          // First owner: grant role + mark email verified (bypass
          // requireEmailVerification) so /setup can sign in without email.
          return { data: { ...incoming, role: "owner", emailVerified: true } };
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
