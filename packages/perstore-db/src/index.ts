import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import {
  category,
  chat,
  image,
  inventoryMovement,
  message,
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
  chat,
  message,
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

export const connectRemote = (url: string, authToken: string) => {
  const client = createClient({ url, authToken });
  return drizzle({ client, schema, relations });
};

export * from "drizzle-orm";
export * from "./schema";
export * from "./schema/relations";
