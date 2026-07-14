import { CURRENCIES } from "@repo/config";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { shopInfo } from "./shop-info";

export const userRoles = ["owner", "admin", "member", "user"] as const;
export type UserRole = (typeof userRoles)[number];

// Fields below (role/banned/banReason/banExpires on user, impersonatedBy on
// session) back the better-auth `admin` plugin. First account becomes "owner";
// dashboard access is role-based. The single shop row has no user owner.
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  role: text("role", { enum: userRoles }).notNull().default("user"),
  banned: integer("banned", { mode: "boolean" }).default(false).notNull(),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }),
});

export type UserSelect = typeof user.$inferSelect;
export type UserInsert = typeof user.$inferInsert;

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    impersonatedBy: text("impersonated_by"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId), index("token_idx").on(t.token)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// ponytail: 2FA plugin removed; this table + the twoFactorEnabled column on
// `user` are now orphaned (harmless, no migration). Drop both via a drizzle
// migration if 2FA stays gone for good.
export const twoFactor = sqliteTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    secret: text("secret"),
    backupCodes: text("backup_codes"),
  },
  (t) => [index("two_factor_secret_idx").on(t.secret)],
);

export const shop = sqliteTable("shop", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  name: text("name").notNull(),
  currency: text("currency", { enum: CURRENCIES }).notNull().default("USD"),
  logo: text("logo"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  shopInfoId: text("shop_info_id").references(() => shopInfo.id, {
    onDelete: "set null",
  }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type ShopSelect = typeof shop.$inferSelect;
export type ShopInsert = typeof shop.$inferInsert;

// Owner-generated, one-time, TTL invite links for dashboard staff onboarding.
// Manual transport (copy/paste → SMS/voice): the owner hands the link to the
// recipient, who opens it on the same wifi (offline link) or over the
// internet (online link). Accept creates a new user with the role baked into
// the token. Not a better-auth concept (no org plugin) — own table.
export const inviteRoles = ["admin", "member"] as const;
export type InviteRole = (typeof inviteRoles)[number];

export const invite = sqliteTable("invite", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  token: text("token").notNull().unique(),
  role: text("role", { enum: inviteRoles }).notNull(),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  consumedAt: integer("consumed_at", { mode: "timestamp" }),
  consumedById: text("consumed_by_id").references(() => user.id, { onDelete: "set null" }),
});

export type InviteSelect = typeof invite.$inferSelect;
export type InviteInsert = typeof invite.$inferInsert;
