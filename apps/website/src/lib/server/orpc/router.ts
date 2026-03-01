import { createRouterClient } from "@orpc/server";

import { os } from "./base";
import { createShopHandler } from "./handlers/shops/create";

export const router = os.router({
  shops: { createShop: createShopHandler },
});

/** only for server-side call */
export const client = createRouterClient(router);

export type Router = typeof router;
