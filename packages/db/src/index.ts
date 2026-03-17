import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import {
  category,
  image,
  inventoryMovement,
  invoice,
  invoiceItem,
  invoiceOcrResult,
  product,
  productCategory,
  productSupplier,
  setting,
  supplier,
} from "./schema";
import { relations } from "./schema/relations";

const schema = {
  setting,
  category,
  image,
  product,
  productCategory,
  supplier,
  productSupplier,
  invoiceOcrResult,
  invoice,
  invoiceItem,
  inventoryMovement,
};

export const connectRemote = (url: string, authToken: string) => {
  const client = createClient({ url, authToken });
  return drizzle({ client, schema, relations });
};

export * from "drizzle-orm";
export * from "./schema";
export * from "./schema/relations";
