import { createRouterClient } from "@orpc/server";

import { os } from "./base";
import { createShopHandler } from "./handlers/shops/create_shop";
import { getShopHandler } from "./handlers/shops/get_shop";
import { updateShopHandler } from "./handlers/shops/update_shop";

export const router = os.router({
  shops: { createShop: createShopHandler, getShop: getShopHandler, updateShop: updateShopHandler },
});

/** only for server-side call */
export const client = createRouterClient(router);

export type Router = typeof router;
