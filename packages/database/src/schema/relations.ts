import { defineRelations } from "drizzle-orm";
import { account, session, shop, socialConnection, twoFactor, user } from "./auth";
import { inventoryMovement } from "./inventory";
import { order, orderItem } from "./order";
import { category, product, productAlias, productCategory, productImage } from "./product";
import {
  purchaseInvoice,
  purchaseInvoiceFile,
  purchaseInvoiceItem,
  purchaseInvoiceOcrResult,
} from "./purchaseInvoice";
import { shopInfo } from "./shop-info";
import { productSupplier, supplier } from "./supplier";
import { taxSettings } from "./tax";

// ponytail: full tables map = the exact set defineRelations validates against;
// also reused as the `schema` better-auth's drizzle adapter needs (drizzle 1.x
// no longer exposes db._.fullSchema).
export const schema = {
  user,
  session,
  account,
  twoFactor,
  shop,
  socialConnection,
  shopInfo,
  category,
  product,
  productAlias,
  productCategory,
  productImage,
  supplier,
  productSupplier,
  purchaseInvoiceFile,
  purchaseInvoiceOcrResult,
  purchaseInvoice,
  purchaseInvoiceItem,
  inventoryMovement,
  order,
  orderItem,
  taxSettings,
};

export const relations = defineRelations(schema, (r) => ({
    user: {
      sessions: r.many.session(),
      accounts: r.many.account(),
      twoFactors: r.many.twoFactor(),
    },
    session: {
      user: r.one.user({ from: r.session.userId, to: r.user.id }),
    },
    account: {
      user: r.one.user({ from: r.account.userId, to: r.user.id }),
    },
    twoFactor: {
      user: r.one.user({ from: r.twoFactor.userId, to: r.user.id }),
    },
    shop: {
      socialConnections: r.many.socialConnection(),
      shopInfo: r.one.shopInfo({ from: r.shop.shopInfoId, to: r.shopInfo.id }),
    },
    socialConnection: {
      shop: r.one.shop({ from: r.socialConnection.shopId, to: r.shop.id }),
    },
    shopInfo: {
      shop: r.one.shop({ from: r.shopInfo.id, to: r.shop.shopInfoId }),
    },
    category: {
      productCategories: r.many.productCategory(),
    },
    product: {
      productAliases: r.many.productAlias(),
      productCategories: r.many.productCategory(),
      productImages: r.many.productImage(),
      productSuppliers: r.many.productSupplier(),
      purchaseInvoiceItems: r.many.purchaseInvoiceItem(),
      inventoryMovements: r.many.inventoryMovement(),
      orderItems: r.many.orderItem(),
    },
    productAlias: {
      product: r.one.product({ from: r.productAlias.productId, to: r.product.id }),
    },
    productCategory: {
      product: r.one.product({ from: r.productCategory.productId, to: r.product.id }),
      category: r.one.category({ from: r.productCategory.categoryId, to: r.category.id }),
    },
    productImage: {
      product: r.one.product({ from: r.productImage.productId, to: r.product.id }),
    },
    supplier: {
      productSuppliers: r.many.productSupplier(),
      purchaseInvoices: r.many.purchaseInvoice(),
    },
    productSupplier: {
      product: r.one.product({ from: r.productSupplier.productId, to: r.product.id }),
      supplier: r.one.supplier({ from: r.productSupplier.supplierId, to: r.supplier.id }),
    },
    purchaseInvoiceFile: {
      ocrResult: r.one.purchaseInvoiceOcrResult({
        from: r.purchaseInvoiceFile.id,
        to: r.purchaseInvoiceOcrResult.invoiceFileId,
      }),
      purchaseInvoice: r.one.purchaseInvoice({
        from: r.purchaseInvoiceFile.id,
        to: r.purchaseInvoice.invoiceFileId,
      }),
    },
    purchaseInvoiceOcrResult: {
      invoiceFile: r.one.purchaseInvoiceFile({
        from: r.purchaseInvoiceOcrResult.invoiceFileId,
        to: r.purchaseInvoiceFile.id,
      }),
      purchaseInvoice: r.one.purchaseInvoice({
        from: r.purchaseInvoiceOcrResult.id,
        to: r.purchaseInvoice.ocrResultId,
      }),
    },
    purchaseInvoice: {
      invoiceFile: r.one.purchaseInvoiceFile({
        from: r.purchaseInvoice.invoiceFileId,
        to: r.purchaseInvoiceFile.id,
      }),
      supplier: r.one.supplier({
        from: r.purchaseInvoice.supplierId,
        to: r.supplier.id,
      }),
      ocrResult: r.one.purchaseInvoiceOcrResult({
        from: r.purchaseInvoice.ocrResultId,
        to: r.purchaseInvoiceOcrResult.id,
      }),
      items: r.many.purchaseInvoiceItem(),
    },
    purchaseInvoiceItem: {
      purchaseInvoice: r.one.purchaseInvoice({
        from: r.purchaseInvoiceItem.purchaseInvoiceId,
        to: r.purchaseInvoice.id,
      }),
      product: r.one.product({
        from: r.purchaseInvoiceItem.productId,
        to: r.product.id,
      }),
      inventoryMovements: r.many.inventoryMovement(),
    },
    inventoryMovement: {
      product: r.one.product({
        from: r.inventoryMovement.productId,
        to: r.product.id,
      }),
      purchaseInvoiceItem: r.one.purchaseInvoiceItem({
        from: r.inventoryMovement.purchaseInvoiceItemId,
        to: r.purchaseInvoiceItem.id,
      }),
    },
    order: {
      items: r.many.orderItem(),
    },
    orderItem: {
      order: r.one.order({ from: r.orderItem.orderId, to: r.order.id }),
      product: r.one.product({ from: r.orderItem.productId, to: r.product.id }),
    },
  }),
);
