import { defineRelations } from "drizzle-orm";
import { inventoryMovement } from "./inventory";
import { invoice, invoiceItem, invoiceOcrResult } from "./invoice";
import { order, orderItem } from "./order";
import { category, product, productCategory } from "./product";
import { setting } from "./shop";
import { productSupplier, supplier } from "./supplier";

export const relations = defineRelations(
  {
    category,
    product,
    productCategory,
    supplier,
    productSupplier,
    invoiceOcrResult,
    invoice,
    invoiceItem,
    inventoryMovement,
    setting,
    order,
    orderItem,
  },
  (r) => ({
    category: {
      productCategories: r.many.productCategory(),
    },
    product: {
      productCategories: r.many.productCategory(),
      productSuppliers: r.many.productSupplier(),
      invoiceItems: r.many.invoiceItem(),
      inventoryMovements: r.many.inventoryMovement(),
      orderItems: r.many.orderItem(),
    },
    productCategory: {
      product: r.one.product({ from: r.productCategory.productId, to: r.product.id }),
      category: r.one.category({ from: r.productCategory.categoryId, to: r.category.id }),
    },
    supplier: {
      productSuppliers: r.many.productSupplier(),
      invoices: r.many.invoice(),
    },
    productSupplier: {
      product: r.one.product({ from: r.productSupplier.productId, to: r.product.id }),
      supplier: r.one.supplier({ from: r.productSupplier.supplierId, to: r.supplier.id }),
    },
    invoiceOcrResult: {
      invoice: r.one.invoice({ from: r.invoiceOcrResult.id, to: r.invoice.ocrResultId }),
    },
    invoice: {
      supplier: r.one.supplier({ from: r.invoice.supplierId, to: r.supplier.id }),
      ocrResult: r.one.invoiceOcrResult({
        from: r.invoice.ocrResultId,
        to: r.invoiceOcrResult.id,
      }),
      items: r.many.invoiceItem(),
    },
    invoiceItem: {
      invoice: r.one.invoice({ from: r.invoiceItem.invoiceId, to: r.invoice.id }),
      product: r.one.product({ from: r.invoiceItem.productId, to: r.product.id }),
      inventoryMovements: r.many.inventoryMovement(),
    },
    inventoryMovement: {
      product: r.one.product({ from: r.inventoryMovement.productId, to: r.product.id }),
      invoiceItem: r.one.invoiceItem({
        from: r.inventoryMovement.invoiceItemId,
        to: r.invoiceItem.id,
      }),
    },
    setting: {},
    order: {
      items: r.many.orderItem(),
    },
    orderItem: {
      order: r.one.order({ from: r.orderItem.orderId, to: r.order.id }),
      product: r.one.product({ from: r.orderItem.productId, to: r.product.id }),
    },
  }),
);
