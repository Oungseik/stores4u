import { createRouterClient } from "@orpc/server";

import { os } from "./base";
import { createCategoryHandler } from "./handlers/categories/create_category";
import { deleteCategoryHandler } from "./handlers/categories/delete_category";
import { listCategoriesHandler } from "./handlers/categories/list_categories";
import { updateCategoryHandler } from "./handlers/categories/update_category";
import { uploadImageHandler } from "./handlers/images/upload_image";
import { createProductHandler } from "./handlers/products/create_product";
import { deleteProductHandler } from "./handlers/products/delete_product";
import { exportProductsCsvHandler } from "./handlers/products/export_products_csv";
import { importProductsCsvHandler } from "./handlers/products/import_products_csv";
import { listProductsHandler } from "./handlers/products/list_products";
import { updateProductHandler } from "./handlers/products/update_product";
import { createShopHandler } from "./handlers/shops/create_shop";
import { getShopHandler } from "./handlers/shops/get_shop";
import { updateShopHandler } from "./handlers/shops/update_shop";

export const router = os.router({
  categories: {
    create: createCategoryHandler,
    delete: deleteCategoryHandler,
    list: listCategoriesHandler,
    update: updateCategoryHandler,
  },
  images: { uploadImage: uploadImageHandler },
  products: {
    create: createProductHandler,
    delete: deleteProductHandler,
    exportCsv: exportProductsCsvHandler,
    importCsv: importProductsCsvHandler,
    list: listProductsHandler,
    update: updateProductHandler,
  },
  shops: {
    create: createShopHandler,
    getShop: getShopHandler,
    updateShop: updateShopHandler,
  },
});

/** only for server-side call */
export const client = createRouterClient(router);

export type Router = typeof router;
