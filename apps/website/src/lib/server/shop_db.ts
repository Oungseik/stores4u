import { connect } from "@repo/db";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { SHOP_DATA_DIR } from "$env/static/private";

export function getShopDb(param: { slug: string }) {
  const path = `${SHOP_DATA_DIR}/shops/${param.slug}.db`;

  return connect(path);
}

export function createShopDatabase(slug: string): string {
  if (!existsSync(SHOP_DATA_DIR)) {
    mkdirSync(SHOP_DATA_DIR, { recursive: true });
  }

  const newDbPath = join(SHOP_DATA_DIR, "shops", `${slug}.db`);
  const parentDbPath = join(SHOP_DATA_DIR, "/parent.db");
  copyFileSync(parentDbPath, newDbPath);

  return newDbPath;
}
