import { drizzle } from "drizzle-orm/tursodatabase/database";
import {
  category,
  image,
  inventoryBatch,
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
  inventoryBatch,
  inventoryMovement,
};

export const connect = (path: string) => {
  return drizzle({
    connection: { path },
    schema,
    relations,
  });
};

export * from "drizzle-orm";
export * from "./schema";
export * from "./schema/relations";
