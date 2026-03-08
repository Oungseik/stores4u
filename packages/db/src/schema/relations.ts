import { defineRelations } from "drizzle-orm";
import { inventoryBatch, inventoryMovement } from "./inventory";
import { invoice, invoiceItem, invoiceOcrResult } from "./invoice";
import { category, product, productCategory } from "./product";
import { shopSetting } from "./shop";
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
    inventoryBatch,
    inventoryMovement,
    shopSetting,
  },
  (r) => ({
    category: {
      productCategories: r.many.productCategory(),
    },
    product: {
      productCategories: r.many.productCategory(),
      productSuppliers: r.many.productSupplier(),
      invoiceItems: r.many.invoiceItem(),
      inventoryBatches: r.many.inventoryBatch(),
      inventoryMovements: r.many.inventoryMovement(),
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
      inventoryBatches: r.many.inventoryBatch(),
      inventoryMovements: r.many.inventoryMovement(),
    },
    inventoryBatch: {
      product: r.one.product({ from: r.inventoryBatch.productId, to: r.product.id }),
      invoiceItem: r.one.invoiceItem({
        from: r.inventoryBatch.invoiceItemId,
        to: r.invoiceItem.id,
      }),
      movements: r.many.inventoryMovement(),
    },
    inventoryMovement: {
      product: r.one.product({ from: r.inventoryMovement.productId, to: r.product.id }),
      batch: r.one.inventoryBatch({
        from: r.inventoryMovement.batchId,
        to: r.inventoryBatch.id,
      }),
      invoiceItem: r.one.invoiceItem({
        from: r.inventoryMovement.invoiceItemId,
        to: r.invoiceItem.id,
      }),
    },
    shopSetting: {},
  }),
);
