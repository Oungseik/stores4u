import { drizzle } from "drizzle-orm/libsql";
import {
  category,
  inventoryBatch,
  inventoryMovement,
  invoice,
  invoiceItem,
  invoiceOcrResult,
  product,
  productCategory,
  productSupplier,
  supplier,
} from "./schema";
import { relations } from "./schema/relations";

export const connectDb = (url: string, authToken: string) => {
  return drizzle({
    connection: { url, authToken },
    schema: {
      category,
      product,
      productCategory,
      supplier,
      productSupplier,
      invoiceOcrResult,
      invoice,
      invoiceItem,
      inventoryBatch,
      inventoryMovement,
    },
    relations,
  });
};

export * from "drizzle-orm";
export * from "./schema";
export * from "./schema/relations";
