import { connectLocal } from "@repo/perstore-db";
import { SHOPS_DB_DIR } from "$env/static/private";

export async function getShopDb(shop: { slug: string }) {
  return connectLocal(`${SHOPS_DB_DIR}/${shop.slug}.db`);
}

export async function createShopDatabase(slug: string): Promise<void> {
  await Bun.write(`${SHOPS_DB_DIR}/${slug}.db`, Bun.file(`${SHOPS_DB_DIR}/parent.db`));
}

export async function deleteShopDatabase(slug: string): Promise<void> {
  await Bun.file(`${SHOPS_DB_DIR}/${slug}.db`).delete();
}
