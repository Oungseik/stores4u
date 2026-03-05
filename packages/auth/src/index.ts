import { drizzle } from "drizzle-orm/libsql";
import { account, session, shop, twoFactor, user, verification } from "./schema/auth";
import { relations } from "./schema/relations";

export const connectDb = (url: string, authToken: string) => {
  return drizzle({
    connection: { url, authToken },
    schema: {
      account,
      session,
      shop,
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
