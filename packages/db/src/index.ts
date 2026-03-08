import { drizzle } from "drizzle-orm/tursodatabase/database";
import { migrate } from "drizzle-orm/tursodatabase/migrator";
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
  shopSetting,
  supplier,
} from "./schema";
import { relations } from "./schema/relations";

const schema = {
  shopSetting,
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
};

export const connectDb = (path: string) => {
  return drizzle({
    connection: { path },
    schema,
    relations,
  });
};

export const getShopDbPath = (shopId: string, baseDir: string) => {
  return `${baseDir}/shops/${shopId}.db`;
};

export const connectShopDb = (shopId: string, baseDir: string) => {
  const path = getShopDbPath(shopId, baseDir);
  return drizzle({
    connection: { path },
    schema,
    relations,
  });
};

export const migrateShopDb = async (shopId: string, baseDir: string, migrationsFolder: string) => {
  const db = connectShopDb(shopId, baseDir);
  await migrate(db, { migrationsFolder });
  return db;
};

export { migrate };

export * from "drizzle-orm";
export * from "./schema";
export * from "./schema/relations";
