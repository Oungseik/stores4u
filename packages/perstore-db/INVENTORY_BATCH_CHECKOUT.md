# Inventory Batch Checkout Implementation Guide

## Overview

This document details how to implement checkout with inventory batches, including the complete flow for selling stock and querying product stock levels.

---

## Table of Contents

1. [Data Models](#data-models)
2. [Selling Stock (Checkout)](#selling-stock-checkout)
3. [Listing Products with Stock](#listing-products-with-stock)
4. [Race Condition Handling](#race-condition-handling)
5. [Complete Transaction Example](#complete-transaction-example)

---

## Data Models

### inventory_batch

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| productId | TEXT | FK to product |
| invoiceItemId | TEXT | FK to supplier invoice (nullable) |
| qty | REAL | Original quantity in batch |
| remainingQty | REAL | Available quantity (decreases on sale) |
| expiryDate | TEXT | ISO date string (nullable) |
| batchNumber | TEXT | Supplier batch number (nullable) |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Last update timestamp |

**Indexes:**
- `(productId, expiryDate, createdAt)` where `remainingQty > 0`
- `(productId, remainingQty)`

### inventory_movement

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| productId | TEXT | FK to product |
| batchId | TEXT | FK to inventory_batch |
| invoiceItemId | TEXT | FK to supplier invoice (nullable) |
| movementType | TEXT | PURCHASE, SALE, RETURN, WASTAGE, ADJUSTMENT, CORRECTION |
| qty | REAL | Positive = in, Negative = out |
| unitCostCents | INTEGER | Cost per unit (nullable) |
| referenceType | TEXT | ORDER, ORDER_ITEM, INVOICE, etc. |
| referenceId | TEXT | ID of referenced record |
| reason | TEXT | Explanation (nullable) |
| occurredAt | TIMESTAMP | When movement happened |
| createdAt | TIMESTAMP | Creation timestamp |

### order

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key (used as order identifier) |
| customerName | TEXT | Customer name (nullable) |
| customerPhone | TEXT | Customer phone (nullable) |
| subtotalCents | INTEGER | Sum of line totals |
| discountCents | INTEGER | Discount applied |
| totalCents | INTEGER | Final total |
| notes | TEXT | Order notes (nullable) |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Last update timestamp |

### order_item

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| orderId | TEXT | FK to order |
| productId | TEXT | FK to product |
| qty | REAL | Quantity sold |
| unitPriceCents | INTEGER | Price per unit |
| lineTotalCents | INTEGER | qty × unitPriceCents |
| createdAt | TIMESTAMP | Creation timestamp |

---

## Selling Stock (Checkout)

### High-Level Flow

```
1. Validate products exist
2. Calculate available stock per product (exclude expired)
3. Check if sufficient stock available
4. Plan FIFO deduction (which batches to use)
5. Execute transaction:
   a. Create order
   b. Create order items
   c. For each batch in deduction plan:
      - Insert inventory_movement (negative qty)
      - Atomically update batch.remainingQty
6. Return order confirmation
```

### Step 1: Validate Products Exist

```sql
SELECT id, name, sku FROM product WHERE id IN ('prod_A', 'prod_B', ...);
```

If any product not found → throw `PRODUCT_NOT_FOUND`.

---

### Step 2: Calculate Available Stock

```sql
SELECT 
  productId,
  SUM(remainingQty) as availableQty
FROM inventory_batch
WHERE productId IN ('prod_A', 'prod_B', ...)
  AND remainingQty > 0
  AND (expiryDate IS NULL OR expiryDate > :currentDate)
GROUP BY productId;
```

**Result:**
| productId | availableQty |
|-----------|---------------|
| prod_A    | 150           |
| prod_B    | 200           |

---

### Step 3: Check Sufficiency

```typescript
// Pseudocode
for each item in cart:
  available = stockMap.get(item.productId)
  if (!available || available < item.requestedQty):
    throw { code: 'INSUFFICIENT_STOCK', productId, available, requested }
```

---

### Step 4: Plan FIFO Deduction

For each product in cart, determine which batches to deduct from:

```sql
SELECT 
  id,
  remainingQty,
  expiryDate,
  createdAt
FROM inventory_batch
WHERE productId = :productId
  AND remainingQty > 0
  AND (expiryDate IS NULL OR expiryDate > :currentDate)
ORDER BY 
  expiryDate ASC NULLS LAST,  -- Oldest expiry first
  createdAt ASC;             -- Then oldest created date
```

**Example:** Selling 60 units of prod_A with batches:

| batchId | remainingQty | expiryDate |
|---------|--------------|------------|
| b2      | 50           | 2026-03-15 |
| b1      | 100          | 2026-04-01 |

**Deduction Plan:**
```
b2: deduct 50 (all 50)
b1: deduct 10 (remaining 10)
Total: 60 ✓
```

---

### Step 5: Execute Transaction (with Race Condition Protection)

**Critical:** Use atomic UPDATE to prevent overselling.

```sql
BEGIN IMMEDIATE;  -- SQLite exclusive lock

-- 5a. Create Order
INSERT INTO "order" (id, subtotalCents, discountCents, totalCents, createdAt, updatedAt)
VALUES (
  'ord-abc123',
  100000,  -- subtotal
  5000,    -- discount
  95000,   -- total
  :now,
  :now
);

-- 5b. Create Order Items
INSERT INTO "order_item" (id, orderId, productId, qty, unitPriceCents, lineTotalCents, createdAt)
VALUES 
  ('item-1', 'ord-abc123', 'prod_A', 60, 1583, 94980, :now),
  ('item-2', 'ord-abc123', 'prod_B', 5, 1000, 5000, :now);

-- 5c. Deduct from batches (ATOMIC with race condition protection)
-- Batch b2: deduct 50
UPDATE inventory_batch 
SET remainingQty = remainingQty - 50, updatedAt = :now
WHERE id = 'b2' 
  AND remainingQty >= 50;

-- Check if update succeeded
-- If rowsAffected = 0, another transaction took this batch → retry or fail

-- Insert movement for b2
INSERT INTO inventory_movement (id, productId, batchId, movementType, qty, referenceType, referenceId, occurredAt, createdAt)
VALUES ('mov-1', 'prod_A', 'b2', 'SALE', -50, 'ORDER_ITEM', 'item-1', :now, :now);

-- Batch b1: deduct 10
UPDATE inventory_batch 
SET remainingQty = remainingQty - 10, updatedAt = :now
WHERE id = 'b1' 
  AND remainingQty >= 10;

-- Insert movement for b1
INSERT INTO inventory_movement (id, productId, batchId, movementType, qty, referenceType, referenceId, occurredAt, createdAt)
VALUES ('mov-2', 'prod_A', 'b1', 'SALE', -10, 'ORDER_ITEM', 'item-1', :now, :now);

-- Batch b3: deduct 5 (prod_B)
UPDATE inventory_batch 
SET remainingQty = remainingQty - 5, updatedAt = :now
WHERE id = 'b3' 
  AND remainingQty >= 5;

-- Insert movement for b3
INSERT INTO inventory_movement (id, productId, batchId, movementType, qty, referenceType, referenceId, occurredAt, createdAt)
VALUES ('mov-3', 'prod_B', 'b3', 'SALE', -5, 'ORDER_ITEM', 'item-2', :now, :now);

COMMIT;
```

---

### Why Atomic UPDATE is Critical

**Without atomic check (RACE CONDITION):**
```sql
-- Step A: Read remainingQty
SELECT remainingQty FROM inventory_batch WHERE id = 'b1';  -- returns 10

-- Step B: Check (10 >= 10) → OK

-- Step C: Update
UPDATE inventory_batch SET remainingQty = 10 - 10 WHERE id = 'b1';
```

Two customers both read 10, both pass check → oversell!

**With atomic check (SAFE):**
```sql
UPDATE inventory_batch 
SET remainingQty = remainingQty - 10
WHERE id = 'b1' 
  AND remainingQty >= 10;
```

- Customer A: `10 >= 10` → TRUE → updates to 0, rowsAffected = 1 ✓
- Customer B: `0 >= 10` → FALSE → no update, rowsAffected = 0 → FAIL

---

## Listing Products with Stock

### Paginated Query (First 10 Products with Stock)

Two approaches:

#### Approach 1: Two Queries (Simpler)

```sql
-- Query 1: Get first 10 products
SELECT id, name, sku, priceCents, lowStockThreshold
FROM product
ORDER BY name
LIMIT 10;

-- Query 2: Get stock for those products
SELECT 
  productId,
  SUM(remainingQty) as totalAvailableQty,
  COUNT(*) as batchCount
FROM inventory_batch
WHERE productId IN ('prod_A', 'prod_B', ...)
  AND remainingQty > 0
  AND (expiryDate IS NULL OR expiryDate > :currentDate)
GROUP BY productId;
```

#### Approach 2: Single Query with Subquery (More Efficient)

```sql
SELECT 
  p.id as productId,
  p.name as productName,
  p.sku,
  p.priceCents,
  p.lowStockThreshold,
  COALESCE(stock.totalAvailableQty, 0) as totalAvailableQty,
  COALESCE(stock.batchCount, 0) as batchCount
FROM product p
LEFT JOIN (
  SELECT 
    productId,
    SUM(remainingQty) as totalAvailableQty,
    COUNT(*) as batchCount
  FROM inventory_batch
  WHERE remainingQty > 0 
    AND (expiryDate IS NULL OR expiryDate > :currentDate)
  GROUP BY productId
) stock ON p.id = stock.productId
ORDER BY p.name
LIMIT 10;
```

**Result:**

| productId | productName | sku | priceCents | lowStockThreshold | totalAvailableQty | batchCount |
|-----------|-------------|-----|------------|-------------------|-------------------|------------|
| prod_A    | Milk 1L     | M001 | 1583      | 10                | 90                | 2          |
| prod_B    | Bread       | B001 | 1000      | 20                | 195               | 1          |
| prod_C    | Eggs        | E001 | 500       | 50                | 0                 | 0          |

---

### Full Stock Query (All Products with Details)

Use this when you need expired/expiring info:

---

### Query for Single Product Stock Status

```sql
SELECT 
  productId,
  SUM(remainingQty) as totalAvailableQty,
  COUNT(*) as batchCount,
  SUM(CASE WHEN expiryDate IS NOT NULL AND expiryDate <= :currentDate THEN remainingQty ELSE 0 END) as expiredQty
FROM inventory_batch
WHERE productId = :productId
  AND remainingQty > 0
GROUP BY productId;
```

---

### Query for Product with Batch Details

```sql
SELECT 
  ib.id as batchId,
  ib.qty as batchQty,
  ib.remainingQty,
  ib.expiryDate,
  ib.batchNumber,
  ib.createdAt,
  CASE 
    WHEN ib.expiryDate IS NULL THEN FALSE
    WHEN ib.expiryDate <= :currentDate THEN TRUE
    ELSE FALSE
  END as isExpired,
  CASE 
    WHEN ib.expiryDate IS NULL THEN FALSE
    WHEN ib.expiryDate > :currentDate AND ib.expiryDate <= :currentDate + 3 days THEN TRUE
    ELSE FALSE
  END as isExpiringSoon
FROM inventory_batch ib
WHERE ib.productId = :productId
  AND ib.remainingQty > 0
ORDER BY ib.expiryDate ASC NULLS LAST, ib.createdAt ASC;
```

---

## Race Condition Handling

### The Problem

Two customers checkout simultaneously for the last item in stock.

```
Customer A                          Customer B
─────────                          ─────────
READ stock (1)                     READ stock (1)
CHECK 1 >= 1 ✓                     CHECK 1 >= 1 ✓
UPDATE stock (0)                   UPDATE stock (-1) ❌
```

Result: Oversold, stock goes negative!

### Solution: Atomic UPDATE with WHERE Clause

```sql
UPDATE inventory_batch 
SET remainingQty = remainingQty - :deductQty
WHERE id = :batchId 
  AND remainingQty >= :deductQty;
```

**If `rowsAffected === 0`:**
- Either batch doesn't exist
- Or not enough stock (race condition caught)
- → Re-run validation or return error

### Implementation Pattern

```typescript
async function deductFromBatch(batchId: string, deductQty: number) {
  const result = await db.update(inventoryBatch)
    .set({ remainingQty: sql`remainingQty - ${deductQty}` })
    .where(
      and(
        eq(inventoryBatch.id, batchId),
        gte(inventoryBatch.remainingQty, deductQty)  // Atomic check!
      )
    );
  
  if (result.changes === 0) {
    throw new Error('INSUFFICIENT_STOCK');
  }
}
```

### Transaction Isolation

For SQLite, use `BEGIN IMMEDIATE` for write transactions:

```sql
BEGIN IMMEDIATE;
-- ... all operations ...
COMMIT;
```

This acquires a RESERVED lock immediately, preventing other writers.

---

## Complete Transaction Example

### Input

```typescript
const checkoutInput = {
  customerName: "John Doe",
  customerPhone: "0123456789",
  items: [
    { productId: "prod_A", qty: 60, unitPriceCents: 1583 },
    { productId: "prod_B", qty: 5, unitPriceCents: 1000 },
  ],
  discountCents: 5000,
  notes: "Please deliver before 5pm",
};
```

### Pre-Check: Available Batches

```sql
-- prod_A batches
SELECT id, remainingQty, expiryDate FROM inventory_batch
WHERE productId = 'prod_A' AND remainingQty > 0 AND (expiryDate IS NULL OR expiryDate > '2026-03-16')
ORDER BY expiryDate ASC NULLS LAST;

-- prod_B batches
SELECT id, remainingQty, expiryDate FROM inventory_batch
WHERE productId = 'prod_B' AND remainingQty > 0 AND (expiryDate IS NULL OR expiryDate > '2026-03-16')
ORDER BY expiryDate ASC NULLS LAST;
```

**Batches:**
- prod_A: b2(50, exp 2026-03-15), b1(100, exp 2026-04-01)
- prod_B: b3(200, exp NULL)

### Deduction Plan

```
prod_A (60 units):
  - b2: 50 (all remaining)
  - b1: 10 (partial)

prod_B (5 units):
  - b3: 5 (partial)
```

### Execution

```sql
BEGIN IMMEDIATE;

-- Order
INSERT INTO "order" (id, subtotalCents, discountCents, totalCents, customerName, customerPhone, notes, createdAt, updatedAt)
VALUES (
  'ord-abc123', 100000, 5000, 95000,
  'John Doe', '0123456789', 'Please deliver before 5pm',
  :now, :now
);

-- Order Items
INSERT INTO "order_item" (id, orderId, productId, qty, unitPriceCents, lineTotalCents, createdAt)
VALUES 
  ('item-1', 'ord-abc123', 'prod_A', 60, 1583, 94980, :now),
  ('item-2', 'ord-abc123', 'prod_B', 5, 1000, 5000, :now);

-- Deduct prod_A from b2 (50 units)
UPDATE inventory_batch SET remainingQty = remainingQty - 50, updatedAt = :now
WHERE id = 'b2' AND remainingQty >= 50;

INSERT INTO inventory_movement (id, productId, batchId, movementType, qty, referenceType, referenceId, occurredAt, createdAt)
VALUES ('mov-1', 'prod_A', 'b2', 'SALE', -50, 'ORDER_ITEM', 'item-1', :now, :now);

-- Deduct prod_A from b1 (10 units)
UPDATE inventory_batch SET remainingQty = remainingQty - 10, updatedAt = :now
WHERE id = 'b1' AND remainingQty >= 10;

INSERT INTO inventory_movement (id, productId, batchId, movementType, qty, referenceType, referenceId, occurredAt, createdAt)
VALUES ('mov-2', 'prod_A', 'b1', 'SALE', -10, 'ORDER_ITEM', 'item-1', :now, :now);

-- Deduct prod_B from b3 (5 units)
UPDATE inventory_batch SET remainingQty = remainingQty - 5, updatedAt = :now
WHERE id = 'b3' AND remainingQty >= 5;

INSERT INTO inventory_movement (id, productId, batchId, movementType, qty, referenceType, referenceId, occurredAt, createdAt)
VALUES ('mov-3', 'prod_B', 'b3', 'SALE', -5, 'ORDER_ITEM', 'item-2', :now, :now);

COMMIT;
```

### Response

```typescript
{
  order: {
    id: 'ord-abc123',
    totalCents: 95000,
    customerName: 'John Doe',
    createdAt: '2026-03-16T10:30:00Z'
  },
  items: [
    { productId: 'prod_A', qty: 60, lineTotalCents: 94980 },
    { productId: 'prod_B', qty: 5, lineTotalCents: 5000 }
  ]
}
```

### Post-State

**inventory_batch:**

| id | productId | qty | remainingQty | expiryDate |
|----|-----------|-----|--------------|-------------|
| b2 | prod_A    | 50  | 0            | 2026-03-15  |
| b1 | prod_A    | 100 | 90           | 2026-04-01  |
| b3 | prod_B    | 200 | 195          | NULL        |

**inventory_movement:**

| id  | productId | batchId | movementType | qty | referenceType | referenceId |
|-----|-----------|---------|--------------|-----|---------------|-------------|
| m1  | prod_A    | b1      | PURCHASE     | 100 | INVOICE       | inv-1       |
| m2  | prod_A    | b2      | PURCHASE     | 50  | INVOICE       | inv-2       |
| m3  | prod_B    | b3      | PURCHASE     | 200 | INVOICE       | inv-3       |
| mov-1 | prod_A  | b2      | SALE         | -50 | ORDER_ITEM    | item-1      |
| mov-2 | prod_A  | b1      | SALE         | -10 | ORDER_ITEM    | item-1      |
| mov-3 | prod_B  | b3      | SALE         | -5  | ORDER_ITEM    | item-2      |

---

## Summary

| Operation | Key Points |
|-----------|------------|
| **Sell Stock** | Validate → FIFO Plan → Atomic Deduct → Record Movement |
| **List Products** | JOIN with inventory_batch, GROUP BY productId |
| **Race Condition** | Use `UPDATE ... WHERE remainingQty >= deductQty` |
| **Audit Trail** | Every deduction creates inventory_movement record |

The inventory batch approach enables FIFO selling, expiry tracking, and complete audit trails at the cost of slightly more complex stock queries and multiple writes per sale.
