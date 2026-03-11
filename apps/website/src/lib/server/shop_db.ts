import type { ShopSelect } from "@repo/auth";
import { connectRemote } from "@repo/db";
import {
  TURSO_GROUP,
  TURSO_GROUP_AUTH_TOKEN,
  TURSO_ORGANIZATION,
  TURSO_PARENT_DB_NAME,
} from "$env/static/private";
import { turso } from "./turso";

export function getShopDb(shop: Pick<ShopSelect, "slug" | "tursoDbUrl">) {
  const url = shop.tursoDbUrl ?? `libsql://pos-${shop.slug}-${TURSO_ORGANIZATION}.turso.io`;
  return connectRemote(url, TURSO_GROUP_AUTH_TOKEN);
}

export async function createShopDatabase(slug: string): Promise<string> {
  const db = await turso.databases.create(`pos-${slug}`, {
    group: TURSO_GROUP,
    seed: { type: "database", name: TURSO_PARENT_DB_NAME! },
  });

  return `libsql://${db.hostname}`;
}

export async function deleteShopDatabase(slug: string): Promise<void> {
  await turso.databases.delete(`pos-${slug}`);
}
