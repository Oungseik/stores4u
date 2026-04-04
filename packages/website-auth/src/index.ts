import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import {
  account,
  session,
  shop,
  socialConnection,
  twoFactor,
  user,
  verification,
} from "./schema/auth";
import { relations } from "./schema/relations";

const schemaObj = {
  account,
  session,
  shop,
  socialConnection,
  twoFactor,
  user,
  verification,
};

export { schemaObj };

export const connectDbRemote = (url: string, authToken: string) => {
  const client = createClient({ url, authToken });
  return drizzle({ client, schema: schemaObj, relations });
};

export * from "drizzle-orm";
export * from "./email";
export * from "./schema/auth";
export * from "./schema/relations";
