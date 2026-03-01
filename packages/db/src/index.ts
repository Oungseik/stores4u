import { drizzle } from "drizzle-orm/libsql";
import { employee } from "./schema/members";
import { relations } from "./schema/relations";

export const connectDb = (url: string, authToken: string) => {
  return drizzle({
    connection: { url, authToken },
    schema: { employee },
    relations,
  });
};

export * from "drizzle-orm";
export * from "./schema/members";
