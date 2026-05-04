import { COUNTRIES, SOCIAL_PLATFORMS } from "@repo/config";
import { index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const shopRoles = ["OWNER", "ADMIN", "MEMBER"] as const;
export type ShopRole = (typeof shopRoles)[number];

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
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

export const shop = sqliteTable(
  "shop",
  {
    id: text("id").primaryKey().$defaultFn(Bun.randomUUIDv7),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    heroImage: text("hero_image"),
    title: text("title"),
    description: text("description"),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state"),
    zipCode: text("zip_code"),
    country: text("country", { enum: COUNTRIES }),
    phone: text("phone").notNull(),
    email: text("email"),
    taxId: text("tax_id"),
    tursoDbUrl: text("turso_db_url"),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index("shop_slug_idx").on(t.slug), index("shop_user_id_idx").on(t.userId)],
);

export type ShopSelect = typeof shop.$inferSelect;
export type ShopInsert = typeof shop.$inferInsert;

export const socialConnection = sqliteTable(
  "social_connection",
  {
    id: text("id").primaryKey().$defaultFn(Bun.randomUUIDv7),
    shopId: text("shop_id")
      .notNull()
      .references(() => shop.id, { onDelete: "cascade" }),
    platform: text("platform", { enum: SOCIAL_PLATFORMS }).notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    pageId: text("page_id").notNull(),
    pageName: text("page_name").notNull(),
    pageAccessToken: text("page_access_token").notNull(),
    pageAccessTokenExpiresAt: integer("page_access_token_expires_at", { mode: "timestamp" }),
    userAccessToken: text("user_access_token"),
    userRefreshToken: text("user_refresh_token"),
    permissions: text("permissions", { mode: "json" })
      .$type<{
        autoPostProducts: boolean;
        manualPosting: boolean;
        postPromotions: boolean;
        postOrderUpdates: boolean;
      }>()
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("social_connection_shop_id_idx").on(t.shopId),
    index("social_connection_platform_idx").on(t.platform),
    unique().on(t.shopId, t.platform),
  ],
);

export type SocialConnectionSelect = typeof socialConnection.$inferSelect;
export type SocialConnectionInsert = typeof socialConnection.$inferInsert;
