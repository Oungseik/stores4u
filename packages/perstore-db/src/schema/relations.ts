import { defineRelations } from "drizzle-orm";
import { chat, message } from "./chat";
import { inventoryMovement } from "./inventory";
import { order, orderItem } from "./order";
import { category, product, productAlias, productCategory } from "./product";
import {
  purchaseInvoice,
  purchaseInvoiceFile,
  purchaseInvoiceItem,
  purchaseInvoiceOcrResult,
} from "./purchaseInvoice";
import { refund, refundItem } from "./refund";
import { productSupplier, supplier } from "./supplier";
import { taxSettings } from "./tax";

export const relations = defineRelations(
  {
    chat,
    message,
    category,
    product,
    productAlias,
    productCategory,
    supplier,
    productSupplier,
    purchaseInvoiceFile,
    purchaseInvoiceOcrResult,
    purchaseInvoice,
    purchaseInvoiceItem,
    inventoryMovement,
    order,
    orderItem,
    refund,
    refundItem,
    taxSettings,
  },
  (r) => ({
    chat: {
      messages: r.many.message(),
    },
    message: {
      chat: r.one.chat({ from: r.message.chatId, to: r.chat.id }),
    },
    category: {
      productCategories: r.many.productCategory(),
    },
    product: {
      productAliases: r.many.productAlias(),
      productCategories: r.many.productCategory(),
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
      refunds: r.many.refund(),
    },
    orderItem: {
      order: r.one.order({ from: r.orderItem.orderId, to: r.order.id }),
      product: r.one.product({ from: r.orderItem.productId, to: r.product.id }),
      refundItems: r.many.refundItem(),
    },
    refund: {
      order: r.one.order({ from: r.refund.orderId, to: r.order.id }),
      items: r.many.refundItem(),
    },
    refundItem: {
      refund: r.one.refund({ from: r.refundItem.refundId, to: r.refund.id }),
      orderItem: r.one.orderItem({ from: r.refundItem.orderItemId, to: r.orderItem.id }),
    },
  }),
);
