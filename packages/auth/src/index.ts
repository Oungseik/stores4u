import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { account, session, shop, twoFactor, user, verification } from "./schema/auth";
import { relations } from "./schema/relations";

const schema = {
  account,
  session,
  shop,
  twoFactor,
  user,
  verification,
};

export const connectDbRemote = (url: string, authToken: string) => {
  const client = createClient({ url, authToken });
  return drizzle({ client, schema, relations });
};

export * from "drizzle-orm";
export * from "./schema/auth";
export * from "./schema/relations";
