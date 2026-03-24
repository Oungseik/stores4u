import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import {
  category,
  image,
  inventoryMovement,
  order,
  orderItem,
  product,
  productCategory,
  productSupplier,
  purchaseInvoice,
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
  product,
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
