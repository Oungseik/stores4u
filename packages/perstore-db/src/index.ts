import { createClient } from "@libsql/client";
import { Database } from "bun:sqlite";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle } from "drizzle-orm/bun-sqlite";
import {
  category,
  image,
  inventoryMovement,
  order,
  orderItem,
  product,
  productAlias,
  productCategory,
  productSupplier,
  purchaseInvoice,
  purchaseInvoiceFile,
  purchaseInvoiceItem,
  purchaseInvoiceOcrResult,
  refund,
  refundItem,
  supplier,
  taxSettings,
} from "./schema";
import { relations } from "./schema/relations";

const schema = {
  category,
  image,
  purchaseInvoiceFile,
  product,
  productAlias,
  productCategory,
  supplier,
  productSupplier,
  purchaseInvoiceOcrResult,
  purchaseInvoice,
  purchaseInvoiceItem,
  inventoryMovement,
  order,
  orderItem,
  refund,
  refundItem,
  taxSettings,
};

export const connectLocal = (path: string) => {
  const client = new Database(path);
  return drizzle({ client, schema, relations });
};

export const connectRemote = (url: string, authToken: string) => {
  const client = createClient({ url, authToken });
  return drizzleLibsql({ client, schema, relations });
};

export * from "drizzle-orm";
export * from "./schema";
export * from "./schema/relations";
