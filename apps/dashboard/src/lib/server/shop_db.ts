import { connect } from "@tursodatabase/sync";
import { drizzle } from "drizzle-orm/tursodatabase/database";
import { LRUCache } from "lru-cache";
import {
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
  relations,
} from "@repo/perstore-db";
import {
  TURSO_GROUP,
  TURSO_GROUP_AUTH_TOKEN,
  TURSO_ORGANIZATION,
  TURSO_PARENT_DB_NAME,
  SHOPS_DB_DIR,
} from "$env/static/private";
import { turso } from "./turso";
import path from "node:path";
import fs from "node:fs";

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

type ShopDb = ReturnType<typeof drizzle<typeof schema, typeof relations>>;

const shopDbCache = new LRUCache<string, Promise<ShopDb>>({
  max: 50,
});

async function connectLocalFirst(slug: string): Promise<ShopDb> {
  const url = `libsql://${TURSO_GROUP}-${slug}-${TURSO_ORGANIZATION}.turso.io`;
  const dbPath = path.join(SHOPS_DB_DIR, `${slug}.db`);

  await fs.promises.mkdir(SHOPS_DB_DIR, { recursive: true });

  const client = await connect({
    path: dbPath,
    url,
    authToken: TURSO_GROUP_AUTH_TOKEN,
    partialSyncExperimental: {
      bootstrapStrategy: { kind: "prefix", length: 128 * 1024 },
      prefetch: true,
    },
  });

  return drizzle({ client, schema, relations });
}

function initShopDb(slug: string): Promise<ShopDb> {
  const cached = shopDbCache.get(slug);
  if (cached) return cached;

  const promise = connectLocalFirst(slug).catch((err) => {
    shopDbCache.delete(slug);
    throw err;
  });

  shopDbCache.set(slug, promise);
  return promise;
}

export function getShopDb(shop: { slug: string }): Promise<ShopDb> {
  return initShopDb(shop.slug);
}

export async function createShopDatabase(slug: string): Promise<string> {
  const db = await turso.databases.create(`${TURSO_GROUP}-${slug}`, {
    group: TURSO_GROUP,
    seed: { type: "database", name: TURSO_PARENT_DB_NAME },
  });

  await initShopDb(slug);

  return `libsql://${db.hostname}`;
}

export async function deleteShopDatabase(slug: string): Promise<void> {
  await turso.databases.delete(`${TURSO_GROUP}-${slug}`);
  shopDbCache.delete(slug);
}
