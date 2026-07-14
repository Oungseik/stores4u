import { createRouterClient } from "@orpc/server";

import { os } from "./base";
import { createCategoryHandler } from "./handlers/categories/create_category";
import { deleteCategoryHandler } from "./handlers/categories/delete_category";
import { getCategoryProductsHandler } from "./handlers/categories/get_category_products";
import { listCategoriesHandler } from "./handlers/categories/list_categories";
import { updateCategoryHandler } from "./handlers/categories/update_category";
import { updateCategoryProductsHandler } from "./handlers/categories/update_category_products";
import { createCustomerHandler } from "./handlers/customers/create_customer";
import { deleteCustomerHandler } from "./handlers/customers/delete_customer";
import { getCustomerHandler } from "./handlers/customers/get_customer";
import { listCustomersHandler } from "./handlers/customers/list_customers";
import { updateCustomerHandler } from "./handlers/customers/update_customer";
import { dashboardRevenueTrendHandler } from "./handlers/dashboard/revenue_trend";
import { dashboardStatsHandler } from "./handlers/dashboard/stats";
import { deleteImageHandler } from "./handlers/images/delete";
import { uploadHandler } from "./handlers/images/upload";
import { getInvoiceSettingsHandler } from "./handlers/invoice/get_invoice_settings";
import { updateInvoiceSettingsHandler } from "./handlers/invoice/update_invoice_settings";
import { adjustStockHandler } from "./handlers/inventory/adjust_stock";
import { listMovementsHandler } from "./handlers/inventory/list_movements";
import { createInviteHandler } from "./handlers/invites/create";
import { acceptInviteHandler } from "./handlers/invites/accept";
import { requestPasswordResetHandler } from "./handlers/recovery/request";
import { resetForUserHandler } from "./handlers/recovery/for_user";
import { requestMagicLinkHandler } from "./handlers/magic-link/request";
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
import { listMembersHandler } from "./handlers/members/list_members";
import { listInvoiceFilesHandler } from "./handlers/purchase-invoices/list_invoice_files";
import { listInvoicesHandler } from "./handlers/purchase-invoices/list_invoices";
import { processInvoiceFileHandler } from "./handlers/purchase-invoices/process_purchase_invoice_file";
import { rejectInvoiceFileHandler } from "./handlers/purchase-invoices/reject_invoice_file";
import { submitInvoiceReviewHandler } from "./handlers/purchase-invoices/submit_invoice_review";
import { updateInvoiceHandler } from "./handlers/purchase-invoices/update_invoice";
import { uploadInvoiceFileHandler } from "./handlers/purchase-invoices/upload_invoice_file";
import { setupCreateHandler } from "./handlers/setup/create";
import { updateShopHandler } from "./handlers/shops/update_shop";
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
    getProducts: getCategoryProductsHandler,
    list: listCategoriesHandler,
    update: updateCategoryHandler,
    updateProducts: updateCategoryProductsHandler,
  },

  customers: {
    create: createCustomerHandler,
    delete: deleteCustomerHandler,
    get: getCustomerHandler,
    list: listCustomersHandler,
    update: updateCustomerHandler,
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
  members: {
    list: listMembersHandler,
  },

  invites: {
    create: createInviteHandler,
    accept: acceptInviteHandler,
  },
  recovery: {
    request: requestPasswordResetHandler,
    forUser: resetForUserHandler,
  },
  magicLink: {
    request: requestMagicLinkHandler,
  },
  setup: {
    create: setupCreateHandler,
  },
  shops: {
    update: updateShopHandler,
  },
  invoice: {
    get: getInvoiceSettingsHandler,
    update: updateInvoiceSettingsHandler,
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
