import { createClient } from "@libsql/client";
import { connect } from "@tursodatabase/database";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle } from "drizzle-orm/tursodatabase/database";
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

export const connectLocal = async (path: string) => {
  const client = await connect(path);
  return drizzle({ client, schema, relations });
};

export const connectRemote = (url: string, authToken: string) => {
  const client = createClient({ url, authToken });
  return drizzleLibsql({ client, schema, relations });
};

export * from "drizzle-orm";
export * from "./schema";
export * from "./schema/relations";
