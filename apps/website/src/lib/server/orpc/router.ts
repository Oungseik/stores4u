import { createRouterClient } from "@orpc/server";

import { os } from "./base";
import { createShopHandler } from "./handlers/shops/create_shop";
import { getShopHandler } from "./handlers/shops/get_shop";

export const router = os.router({
  shops: { createShop: createShopHandler, getShop: getShopHandler },
});

/** only for server-side call */
export const client = createRouterClient(router);

export type Router = typeof router;
