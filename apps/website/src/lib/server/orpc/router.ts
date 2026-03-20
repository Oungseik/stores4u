import { createRouterClient } from "@orpc/server";

import { os } from "./base";
import { createCategoryHandler } from "./handlers/categories/create_category";
import { deleteCategoryHandler } from "./handlers/categories/delete_category";
import { listCategoriesHandler } from "./handlers/categories/list_categories";
import { updateCategoryHandler } from "./handlers/categories/update_category";
import { confirmUploadHandler } from "./handlers/images/confirm_upload";
import { getUploadUrlHandler } from "./handlers/images/get_upload_url";
import { getOrderHandler } from "./handlers/orders/get_order";
import { listOrdersHandler } from "./handlers/orders/list_order";
import { checkoutHandler } from "./handlers/products/checkout_product";
import { createProductHandler } from "./handlers/products/create_product";
import { deleteProductHandler } from "./handlers/products/delete_product";
import { exportProductsCsvHandler } from "./handlers/products/export_products_csv";
import { getProductHandler } from "./handlers/products/get_product";
import { importProductsCsvHandler } from "./handlers/products/import_products_csv";
import { listProductsHandler } from "./handlers/products/list_products";
import { updateProductHandler } from "./handlers/products/update_product";
import { createShopHandler } from "./handlers/shops/create_shop";
import { updateShopHandler } from "./handlers/shops/update_shop";

export const router = os.router({
  categories: {
    create: createCategoryHandler,
    delete: deleteCategoryHandler,
    list: listCategoriesHandler,
    update: updateCategoryHandler,
  },
  images: {
    confirmUpload: confirmUploadHandler,
    getUploadUrl: getUploadUrlHandler,
  },
  products: {
    checkout: checkoutHandler,
    create: createProductHandler,
    delete: deleteProductHandler,
    exportCsv: exportProductsCsvHandler,
    get: getProductHandler,
    importCsv: importProductsCsvHandler,
    list: listProductsHandler,
    update: updateProductHandler,
  },
  orders: {
    get: getOrderHandler,
    list: listOrdersHandler,
  },
  shops: {
    create: createShopHandler,
    update: updateShopHandler,
  },
});

/** only for server-side call */
export const client = createRouterClient(router);

export type Router = typeof router;
