import { drizzle } from "drizzle-orm/libsql";
import { account, session, twoFactor, user, verification } from "./schema/auth";
import { relations } from "./schema/relations";

export const connectDb = () => {
  return drizzle({
    connection: {
      url: process.env.AUTH_DATABASE_URL!,
      authToken: process.env.TURSO_GROUP_AUTH_TOKEN,
    },
    schema: {
      account,
      session,
      twoFactor,
      user,
      verification,
    },
    relations,
  });
};

export * from "drizzle-orm";
export * from "./schema/auth";
export * from "./schema/relations";
