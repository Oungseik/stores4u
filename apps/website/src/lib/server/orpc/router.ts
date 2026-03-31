import { createRouterClient } from "@orpc/server";

import { os } from "./base";
import { createCategoryHandler } from "./handlers/categories/create_category";
import { deleteCategoryHandler } from "./handlers/categories/delete_category";
import { listCategoriesHandler } from "./handlers/categories/list_categories";
import { updateCategoryHandler } from "./handlers/categories/update_category";
import { uploadHandler } from "./handlers/images/upload";
import { listMovementsHandler } from "./handlers/inventory/list_movements";
import { getOrderHandler } from "./handlers/orders/get_order";
import { listOrdersHandler } from "./handlers/orders/list_order";
import { checkoutHandler } from "./handlers/products/checkout_product";
import { createProductHandler } from "./handlers/products/create_product";
import { deleteProductHandler } from "./handlers/products/delete_product";
import { getInvoiceHistoryHandler } from "./handlers/products/get_invoice_history";
import { getOrderHistoryHandler } from "./handlers/products/get_order_history";
import { getProductHandler } from "./handlers/products/get_product";
import { getSuppliersHandler } from "./handlers/products/get_suppliers";
import { listProductsHandler } from "./handlers/products/list_products";
import { updateProductHandler } from "./handlers/products/update_product";
import { deleteInvoiceFileHandler } from "./handlers/purchase-invoices/delete_invoice_file";
import { downloadInvoiceFileHandler } from "./handlers/purchase-invoices/download_invoice_file";
import { getInvoiceFileHandler } from "./handlers/purchase-invoices/get_invoice_file";
import { getInvoiceFilesStatsHandler } from "./handlers/purchase-invoices/get_invoice_files_stats";
import { listInvoiceFilesHandler } from "./handlers/purchase-invoices/list_invoice_files";
import { processInvoiceFileHandler } from "./handlers/purchase-invoices/process_purchase_invoice_file";
import { rejectInvoiceFileHandler } from "./handlers/purchase-invoices/reject_invoice_file";
import { submitInvoiceReviewHandler } from "./handlers/purchase-invoices/submit_invoice_review";
import { uploadInvoiceFileHandler } from "./handlers/purchase-invoices/upload_invoice_file";
import { createShopHandler } from "./handlers/shops/create_shop";
import { updateShopHandler } from "./handlers/shops/update_shop";
import { connectPlatformHandler } from "./handlers/social/connect_platform";
import { disconnectPlatformHandler } from "./handlers/social/disconnect_platform";
import { getFacebookPagesHandler } from "./handlers/social/get_facebook_pages";
import { listConnectionsHandler } from "./handlers/social/list_connections";
import { updatePermissionsHandler } from "./handlers/social/update_permissions";
import { createSupplierHandler } from "./handlers/suppliers/create_supplier";
import { deleteSupplierHandler } from "./handlers/suppliers/delete_supplier";
import { getSupplierHandler } from "./handlers/suppliers/get_supplier";
import { listSuppliersHandler } from "./handlers/suppliers/list_suppliers";
import { updateSupplierHandler } from "./handlers/suppliers/update_supplier";
import { getTaxSettingsHandler } from "./handlers/tax/get_tax_settings";
import { updateTaxSettingsHandler } from "./handlers/tax/update_tax_settings";
import { listAccountsHandler } from "./handlers/user/list_accounts";
import { uploadAvatarHandler } from "./handlers/user/upload-avatar";

export const router = os.router({
  categories: {
    create: createCategoryHandler,
    delete: deleteCategoryHandler,
    list: listCategoriesHandler,
    update: updateCategoryHandler,
  },
  images: {
    upload: uploadHandler,
  },
  inventory: {
    listMovements: listMovementsHandler,
  },
  purchaseInvoices: {
    deleteFile: deleteInvoiceFileHandler,
    downloadFile: downloadInvoiceFileHandler,
    listFiles: listInvoiceFilesHandler,
    getFile: getInvoiceFileHandler,
    getStats: getInvoiceFilesStatsHandler,
    uploadFile: uploadInvoiceFileHandler,
    processFile: processInvoiceFileHandler,
    rejectFile: rejectInvoiceFileHandler,
    submitReview: submitInvoiceReviewHandler,
  },
  products: {
    checkout: checkoutHandler,
    create: createProductHandler,
    delete: deleteProductHandler,
    get: getProductHandler,
    getInvoiceHistory: getInvoiceHistoryHandler,
    getOrderHistory: getOrderHistoryHandler,
    getSuppliers: getSuppliersHandler,
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
  social: {
    connect: connectPlatformHandler,
    disconnect: disconnectPlatformHandler,
    getFacebookPages: getFacebookPagesHandler,
    list: listConnectionsHandler,
    updatePermissions: updatePermissionsHandler,
  },
  suppliers: {
    create: createSupplierHandler,
    delete: deleteSupplierHandler,
    get: getSupplierHandler,
    list: listSuppliersHandler,
    update: updateSupplierHandler,
  },
  tax: {
    get: getTaxSettingsHandler,
    update: updateTaxSettingsHandler,
  },
  user: {
    listAccounts: listAccountsHandler,
    uploadAvatar: uploadAvatarHandler,
  },
});

/** only for server-side call */
export const client = createRouterClient(router);

export type Router = typeof router;
