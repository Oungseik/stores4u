import { resolve } from "node:path";
import { randomUUIDv7 } from "bun";
import { drizzle } from "drizzle-orm/tursodatabase/database";
import {
  category,
  inventoryBatch,
  inventoryMovement,
  invoice,
  invoiceItem,
  invoiceOcrResult,
  product,
  productCategory,
  productSupplier,
  supplier,
} from "./src/schema/index.js";
import { relations } from "./src/schema/relations.js";

const schema = {
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
};

const arrays = {
  categories: [
    "Electronics",
    "Clothing",
    "Food & Beverages",
    "Home & Garden",
    "Sports",
    "Books",
    "Toys",
    "Health & Beauty",
  ],
  uoms: ["PCS", "KG", "BOX", "PACK", "LITER", "METER"],
  paymentTerms: ["NET 30", "NET 60", "NET 15", "COD"],
  invoiceStatuses: ["PENDING", "VALIDATED", "REJECTED", "AUTO_ACCEPTED"] as const,
  ocrStatuses: ["PENDING", "PROCESSED", "FAILED", "LINKED"] as const,
  movementTypes: ["PURCHASE", "SALE", "RETURN", "WASTAGE", "ADJUSTMENT", "CORRECTION"] as const,
  referenceTypes: ["INVOICE", "ORDER", null] as const,
  batchNumbers: ["BATCH-001", "BATCH-002", "BATCH-003"],
  invoiceNumbers: ["INV-2024-001", "INV-2024-002", "INV-2024-003", "INV-2024-004", "INV-2024-005"],
};

function rand<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error("Array cannot be empty");
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateCategoryData(count: number) {
  const data = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < count; i++) {
    let name = rand(arrays.categories);
    let suffix = 1;
    while (usedNames.has(name)) {
      name = `${rand(arrays.categories)} ${suffix++}`;
    }
    usedNames.add(name);
    data.push({
      id: randomUUIDv7(),
      name,
      description: `Description for ${name}`,
    });
  }
  return data;
}

function generateSupplierData(count: number) {
  const data = [];
  const firstNames = ["John", "Jane", "Mike", "Sarah", "David", "Emily", "Chris", "Lisa"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"];
  for (let i = 0; i < count; i++) {
    data.push({
      id: randomUUIDv7(),
      name: `Supplier ${i + 1} Co.`,
      contactName: `${rand(firstNames)} ${rand(lastNames)}`,
      phone: `+1-${randInt(200, 999)}-${randInt(100, 999)}-${randInt(1000, 9999)}`,
      email: `contact${i + 1}@supplier.com`,
      address: `${randInt(1, 999)} Business Ave, Suite ${randInt(1, 100)}`,
      paymentTerms: rand(arrays.paymentTerms),
    });
  }
  return data;
}

function generateProductData(count: number) {
  const productNames = [
    "Wireless Mouse",
    "USB Cable",
    "Laptop Stand",
    "Phone Charger",
    "Bluetooth Speaker",
    "Keyboard",
    "Monitor",
    "Headphones",
    "Webcam",
    "USB Hub",
    "Power Bank",
    "HDMI Cable",
    "Mouse Pad",
    "Laptop Bag",
    "Screen Protector",
    "Smart Watch",
    "Tablet Case",
    "Memory Card",
    "Flash Drive",
    "Router",
  ];
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: randomUUIDv7(),
      sku: `SKU-${String(i + 1).padStart(6, "0")}`,
      name:
        productNames[i % productNames.length] +
        (i >= productNames.length ? ` v${Math.floor(i / productNames.length) + 1}` : ""),
      barcode: `${randInt(1000000000000, 9999999999999)}`,
      description: `High quality product item ${i + 1}`,
      uom: rand(arrays.uoms),
      priceCents: randInt(100, 100000),
    });
  }
  return data;
}

function generateProductCategoryData(products: { id: string }[], categories: { id: string }[]) {
  const data = [];
  const usedPairs = new Set<string>();

  for (const product of products) {
    const numCategories = randInt(1, 3);
    const shuffledCategories = [...categories].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(numCategories, shuffledCategories.length); i++) {
      const pairKey = `${product.id}-${shuffledCategories[i].id}`;
      if (!usedPairs.has(pairKey)) {
        usedPairs.add(pairKey);
        data.push({
          productId: product.id,
          categoryId: shuffledCategories[i].id,
        });
      }
    }
  }
  return data;
}

function generateProductSupplierData(products: { id: string }[], suppliers: { id: string }[]) {
  const data = [];
  const usedPairs = new Set<string>();

  for (const product of products) {
    const numSuppliers = randInt(1, 3);
    const shuffledSuppliers = [...suppliers].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(numSuppliers, shuffledSuppliers.length); i++) {
      const pairKey = `${product.id}-${shuffledSuppliers[i].id}`;
      if (!usedPairs.has(pairKey)) {
        usedPairs.add(pairKey);
        data.push({
          productId: product.id,
          supplierId: shuffledSuppliers[i].id,
          isPreferred: i === 0 ? ("1" as const) : ("0" as const),
        });
      }
    }
  }
  return data;
}

function generateInvoiceOcrResultData(count: number) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: randomUUIDv7(),
      photoUrl: `https://example.com/invoices/ocr-${i + 1}.jpg`,
      rawJson: JSON.stringify({ items: [], total: randInt(1000, 100000) }),
      extractedText: `Extracted text from invoice ${i + 1}`,
      extractedData: JSON.stringify({
        invoiceNumber: `INV-${i + 1}`,
        total: randInt(1000, 100000),
      }),
      confidenceScore: randFloat(0.5, 1.0),
      status: rand(arrays.ocrStatuses),
    });
  }
  return data;
}

function generateInvoiceData(suppliers: { id: string }[], ocrResults: { id: string }[]) {
  const data = [];
  for (let i = 0; i < suppliers.length; i++) {
    const subtotalCents = randInt(1000, 100000);
    const taxCents = Math.floor(subtotalCents * 0.1);
    const freightCents = randInt(0, 2000);
    const discountCents = randInt(0, Math.floor((subtotalCents + taxCents + freightCents) * 0.3));
    const totalCents = subtotalCents + taxCents + freightCents - discountCents;

    const status = rand(arrays.invoiceStatuses);
    const validatedBy = status === "PENDING" ? null : randomUUIDv7();
    const validatedAt = status === "PENDING" ? null : new Date();

    data.push({
      id: randomUUIDv7(),
      invoiceNumber: arrays.invoiceNumbers[i % arrays.invoiceNumbers.length],
      supplierId: suppliers[i % suppliers.length].id,
      ocrResultId: i < ocrResults.length ? ocrResults[i].id : null,
      invoiceDate: `2024-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
      photoUrl: `https://example.com/invoices/${i + 1}.jpg`,
      subtotalCents,
      taxCents,
      discountCents,
      freightCents,
      totalCents,
      status,
      validatedBy,
      validatedAt,
      notes: randInt(0, 1) ? `Notes for invoice ${i + 1}` : null,
    });
  }
  return data;
}

function generateInvoiceItemData(invoices: { id: string }[], products: { id: string }[]) {
  const data = [];
  let itemIndex = 0;

  for (const invoice of invoices) {
    const numItems = randInt(1, 5);

    for (let i = 0; i < numItems; i++) {
      const product = products[itemIndex % products.length];
      const qty = randFloat(1, 100);
      const unitCostCents = randInt(100, 10000);
      const lineSubtotalCents = Math.floor(qty * unitCostCents);
      const taxCents = Math.floor(lineSubtotalCents * 0.1);
      const discountCents = randInt(0, 2000);
      const freightCents = randInt(0, 1000);
      const lineTotalCents = lineSubtotalCents + taxCents + freightCents - discountCents;

      data.push({
        id: randomUUIDv7(),
        invoiceId: invoice.id,
        productId: product.id,
        qty,
        unitCostCents,
        lineSubtotalCents,
        taxCents,
        discountCents,
        freightCents,
        lineTotalCents,
        expiryDate: randInt(0, 1)
          ? `2025-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`
          : null,
        batchNumber: rand(arrays.batchNumbers),
      });
      itemIndex++;
    }
  }
  return data;
}

function generateInventoryBatchData(products: { id: string }[], invoiceItems: { id: string }[]) {
  const data = [];

  for (let i = 0; i < products.length; i++) {
    const qty = randFloat(10, 500);
    const remainingQty = randFloat(0, qty);

    data.push({
      id: randomUUIDv7(),
      productId: products[i].id,
      invoiceItemId: i < invoiceItems.length ? invoiceItems[i].id : null,
      qty,
      remainingQty,
      expiryDate: randInt(0, 1)
        ? `2025-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`
        : null,
      batchNumber: rand(arrays.batchNumbers),
    });
  }
  return data;
}

function generateInventoryMovementData(
  products: { id: string }[],
  batches: { id: string }[],
  invoiceItems: { id: string }[],
) {
  const data = [];

  for (let i = 0; i < products.length * 2; i++) {
    const product = products[i % products.length];
    const movementType = rand(arrays.movementTypes);
    let qty: number;

    if (movementType === "PURCHASE" || movementType === "RETURN") {
      qty = randFloat(10, 100);
    } else if (movementType === "SALE" || movementType === "WASTAGE") {
      qty = -randFloat(1, 50);
    } else {
      qty = randFloat(-20, 20);
    }

    data.push({
      id: randomUUIDv7(),
      productId: product.id,
      batchId: i < batches.length ? batches[i % batches.length].id : null,
      invoiceItemId: i < invoiceItems.length ? invoiceItems[i % invoiceItems.length].id : null,
      movementType,
      qty,
      unitCostCents: randInt(100, 10000),
      referenceType: rand(arrays.referenceTypes),
      referenceId: randInt(0, 1) ? randomUUIDv7() : null,
      reason: randInt(0, 1) ? `Movement reason ${i + 1}` : null,
      occurredAt: new Date(),
    });
  }
  return data;
}

async function main() {
  const shopSlug = process.env.SHOP_SLUG;
  const shopDataDir = process.env.SHOP_DATA_DIR;

  if (!shopSlug || !shopDataDir) {
    console.error("Error: SHOP_SLUG and SHOP_DATA_DIR environment variables are required");
    console.error("Usage: SHOP_SLUG=my-shop bun run db:seed");
    process.exit(1);
  }

  const dbPath = resolve(shopDataDir, "shops", `${shopSlug}.db`);

  const db = drizzle({
    connection: { path: dbPath },
    schema,
    relations,
  });

  console.log(`Seeding database: ${dbPath}`);

  console.log("Clearing existing data...");
  await db.delete(inventoryMovement);
  await db.delete(inventoryBatch);
  await db.delete(invoiceItem);
  await db.delete(invoice);
  await db.delete(invoiceOcrResult);
  await db.delete(productCategory);
  await db.delete(productSupplier);
  await db.delete(product);
  await db.delete(supplier);
  await db.delete(category);
  console.log("Existing data cleared.");

  console.log("Generating categories...");
  const categoryData = generateCategoryData(5);
  await db.insert(category).values(categoryData);
  console.log(`Inserted ${categoryData.length} categories`);

  console.log("Generating suppliers...");
  const supplierData = generateSupplierData(10);
  await db.insert(supplier).values(supplierData);
  console.log(`Inserted ${supplierData.length} suppliers`);

  console.log("Generating products...");
  const productData = generateProductData(20);
  await db.insert(product).values(productData);
  console.log(`Inserted ${productData.length} products`);

  console.log("Generating product-category relations...");
  const productCategoryData = generateProductCategoryData(productData, categoryData);
  await db.insert(productCategory).values(productCategoryData);
  console.log(`Inserted ${productCategoryData.length} product-category relations`);

  console.log("Generating product-supplier relations...");
  const productSupplierData = generateProductSupplierData(productData, supplierData);
  await db.insert(productSupplier).values(productSupplierData);
  console.log(`Inserted ${productSupplierData.length} product-supplier relations`);

  console.log("Generating invoice OCR results...");
  const invoiceOcrResultData = generateInvoiceOcrResultData(5);
  await db.insert(invoiceOcrResult).values(invoiceOcrResultData);
  console.log(`Inserted ${invoiceOcrResultData.length} invoice OCR results`);

  console.log("Generating invoices...");
  const invoiceData = generateInvoiceData(supplierData, invoiceOcrResultData);
  await db.insert(invoice).values(invoiceData);
  console.log(`Inserted ${invoiceData.length} invoices`);

  console.log("Generating invoice items...");
  const invoiceItemData = generateInvoiceItemData(invoiceData, productData);
  await db.insert(invoiceItem).values(invoiceItemData);
  console.log(`Inserted ${invoiceItemData.length} invoice items`);

  console.log("Generating inventory batches...");
  const inventoryBatchData = generateInventoryBatchData(productData, invoiceItemData);
  await db.insert(inventoryBatch).values(inventoryBatchData);
  console.log(`Inserted ${inventoryBatchData.length} inventory batches`);

  console.log("Generating inventory movements...");
  const inventoryMovementData = generateInventoryMovementData(
    productData,
    inventoryBatchData,
    invoiceItemData,
  );
  await db.insert(inventoryMovement).values(inventoryMovementData);
  console.log(`Inserted ${inventoryMovementData.length} inventory movements`);

  console.log("Seeding completed!");
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
