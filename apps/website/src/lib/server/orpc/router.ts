import { createRouterClient } from "@orpc/server";

import { os } from "./base";
import { createCategoryHandler } from "./handlers/categories/create_category";
import { deleteCategoryHandler } from "./handlers/categories/delete_category";
import { getCategoryProductsHandler } from "./handlers/categories/get_category_products";
import { listCategoriesHandler } from "./handlers/categories/list_categories";
import { updateCategoryHandler } from "./handlers/categories/update_category";
import { updateCategoryProductsHandler } from "./handlers/categories/update_category_products";
import { dashboardRevenueTrendHandler } from "./handlers/dashboard/revenue_trend";
import { dashboardStatsHandler } from "./handlers/dashboard/stats";
import { deleteImageHandler } from "./handlers/images/delete";
import { uploadHandler } from "./handlers/images/upload";
import { adjustStockHandler } from "./handlers/inventory/adjust_stock";
import { listMovementsHandler } from "./handlers/inventory/list_movements";
import { getOrderHandler } from "./handlers/orders/get_order";
import { listOrdersHandler } from "./handlers/orders/list_orders";
import { statsOrdersHandler } from "./handlers/orders/stats_order";
import { checkoutHandler } from "./handlers/products/checkout_product";
import { createProductHandler } from "./handlers/products/create_product";
import { deleteProductHandler } from "./handlers/products/delete_product";
import { getProductHandler } from "./handlers/products/get_product";
import { getSuppliersHandler } from "./handlers/products/get_suppliers";
import { listProductsHandler } from "./handlers/products/list_products";
import { statsProductHandler } from "./handlers/products/stats_product";
import { statsProductsHandler } from "./handlers/products/stats_products";
import { updateProductHandler } from "./handlers/products/update_product";
import { deleteInvoiceFileHandler } from "./handlers/purchase-invoices/delete_invoice_file";
import { getInvoiceHandler } from "./handlers/purchase-invoices/get_invoice";
import { getInvoiceFileHandler } from "./handlers/purchase-invoices/get_invoice_file";
import { getInvoiceFilesStatsHandler } from "./handlers/purchase-invoices/get_invoice_files_stats";
import { listInvoiceFilesHandler } from "./handlers/purchase-invoices/list_invoice_files";
import { listInvoicesHandler } from "./handlers/purchase-invoices/list_invoices";
import { processInvoiceFileHandler } from "./handlers/purchase-invoices/process_purchase_invoice_file";
import { rejectInvoiceFileHandler } from "./handlers/purchase-invoices/reject_invoice_file";
import { submitInvoiceReviewHandler } from "./handlers/purchase-invoices/submit_invoice_review";
import { updateInvoiceHandler } from "./handlers/purchase-invoices/update_invoice";
import { uploadInvoiceFileHandler } from "./handlers/purchase-invoices/upload_invoice_file";
import { setupCreateHandler } from "./handlers/setup/create";
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
import { deleteThreadHandler } from "./handlers/threads/delete_thread";
import { getThreadMessagesHandler } from "./handlers/threads/get_thread_messages";
import { listThreadsHandler } from "./handlers/threads/list_threads";
import { updateThreadHandler } from "./handlers/threads/update_thread";
import { listAccountsHandler } from "./handlers/user/list_accounts";
import { uploadAvatarHandler } from "./handlers/user/upload-avatar";

export const router = os.router({
  categories: {
    create: createCategoryHandler,
    delete: deleteCategoryHandler,
    getProducts: getCategoryProductsHandler,
    list: listCategoriesHandler,
    update: updateCategoryHandler,
    updateProducts: updateCategoryProductsHandler,
  },

  dashboard: {
    revenueTrend: dashboardRevenueTrendHandler,
    stats: dashboardStatsHandler,
  },
  images: {
    delete: deleteImageHandler,
    upload: uploadHandler,
  },
  inventory: {
    adjustStock: adjustStockHandler,
    listMovements: listMovementsHandler,
  },
  purchaseInvoices: {
    deleteFile: deleteInvoiceFileHandler,
    list: listInvoicesHandler,
    listFiles: listInvoiceFilesHandler,
    getFile: getInvoiceFileHandler,
    getInvoice: getInvoiceHandler,
    getStats: getInvoiceFilesStatsHandler,
    uploadFile: uploadInvoiceFileHandler,
    processFile: processInvoiceFileHandler,
    rejectFile: rejectInvoiceFileHandler,
    submitReview: submitInvoiceReviewHandler,
    updateInvoice: updateInvoiceHandler,
  },
  products: {
    checkout: checkoutHandler,
    create: createProductHandler,
    delete: deleteProductHandler,
    get: getProductHandler,
    statsProduct: statsProductHandler,
    getSuppliers: getSuppliersHandler,
    list: listProductsHandler,
    stats: statsProductsHandler,
    update: updateProductHandler,
  },
  orders: {
    get: getOrderHandler,
    list: listOrdersHandler,
    stats: statsOrdersHandler,
  },
  setup: {
    create: setupCreateHandler,
  },
  shops: {
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
  threads: {
    delete: deleteThreadHandler,
    getMessages: getThreadMessagesHandler,
    list: listThreadsHandler,
    update: updateThreadHandler,
  },
  user: {
    listAccounts: listAccountsHandler,
    uploadAvatar: uploadAvatarHandler,
  },
});

/** only for server-side call */
export const client = createRouterClient(router);

export type Router = typeof router;
