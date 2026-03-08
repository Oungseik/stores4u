import { createRouterClient } from "@orpc/server";

import { os } from "./base";
import { uploadImageHandler } from "./handlers/images/upload_image";
import { createProductHandler } from "./handlers/products/create_product";
import { deleteProductHandler } from "./handlers/products/delete_product";
import { listProductsHandler } from "./handlers/products/list_products";
import { updateProductHandler } from "./handlers/products/update_product";
import { createShopHandler } from "./handlers/shops/create_shop";
import { getShopHandler } from "./handlers/shops/get_shop";
import { updateShopHandler } from "./handlers/shops/update_shop";

export const router = os.router({
  images: { uploadImage: uploadImageHandler },
  products: {
    create: createProductHandler,
    list: listProductsHandler,
    update: updateProductHandler,
    delete: deleteProductHandler,
  },
  shops: {
    createShop: createShopHandler,
    getShop: getShopHandler,
    updateShop: updateShopHandler,
  },
});

/** only for server-side call */
export const client = createRouterClient(router);

export type Router = typeof router;
