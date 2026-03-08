import { drizzle } from "drizzle-orm/tursodatabase/database";
import { account, session, shop, twoFactor, user, verification } from "./schema/auth";
import { relations } from "./schema/relations";

export const connectDb = (path: string) => {
  return drizzle({
    connection: { path },
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
