# Inventory API Design Document

## Overview

This document defines the domain-specific inventory operations for the POS system. These APIs handle stock management including sales, refills, refunds, expiry tracking, and stock adjustments.

**Created:** March 2026

---

## Core Philosophy

### Batch Append-Only Model

Batches follow an **append-only** model for incoming stock:

1. **New stock always creates a new batch** - Never add quantity to existing batches
2. **Refunds create new batches** - Returned items become new batches, not restored to original
3. **Movements are immutable** - Audit trail cannot be reversed or deleted
4. **`remainingQty` is a performance cache** - It's decremented but never incremented after creation

This ensures:
- Clean audit trail
- Accurate historical tracking
- Simpler reasoning about stock flow

---

## Database Changes

### Product Table Extension

Add `lowStockThreshold` field to `product` table:

```typescript
// packages/db/src/schema/product.ts
export const product = sqliteTable("product", {
  // ... existing fields
  lowStockThreshold: real("low_stock_threshold"), // nullable, falls back to global default
});
```

**Migration required:** `ALTER TABLE product ADD COLUMN low_stock_threshold REAL;`

---

## API Operations

### Mutation Operations

#### 1. `sell_stock` (Create Customer Order)

**Purpose:** Sell products to customers, creating an order and deducting inventory.

**HTTP Method:** POST

**Input:**
```typescript
{
  // Customer info (optional)
  customerName?: string,
  customerPhone?: string,
  
  // Order items (required, at least 1)
  items: Array<{
    productId: string,
    qty: number,        // positive number
    unitPriceCents: number,
  }>,
  
  // Pricing
  discountCents?: number,  // defaults to 0
  notes?: string,
}
```

**Business Logic:**

1. **Validation Phase:**
   - Validate all products exist
   - For each item, calculate available stock:
     - Get batches where `productId` matches AND `remainingQty > 0`
     - Exclude expired batches: `expiryDate IS NULL OR expiryDate > now()`
     - Sum `remainingQty` across eligible batches
   - If any item has `availableQty < requestedQty`, reject with error

2. **FIFO Deduction Planning:**
   - For each item, determine deduction plan:
     - Sort eligible batches by `expiryDate ASC NULLS LAST` (earliest expiry first)
     - Allocate quantity to batches until request fulfilled
     - Record: `[{ batchId, qtyToDeduct }, ...]`

3. **Order Creation (Transaction):**
   - Calculate `subtotalCents = sum(item.lineTotalCents)`
   - Calculate `totalCents = subtotalCents - discountCents`
   - Insert `order` record (uses UUID id as order identifier)
   - Insert `orderItem` records for each item
   - For each orderItem, for each batch in deduction plan:
     - Insert `inventoryMovement` with:
       - `movementType: "SALE"`
       - `qty: -deductedQty` (negative)
       - `batchId: batch.id`
       - `productId: item.productId`
       - `referenceType: "ORDER"`
       - `referenceId: orderItem.id`
     - Update `inventoryBatch.remainingQty -= deductedQty`

4. **Response:**
   ```typescript
   {
     order: { id, totalCents, ... },
     items: [{ productId, qty, ... }],
   }
   ```

**Error Cases:**
- `INSUFFICIENT_STOCK`: Not enough available stock for product
- `PRODUCT_NOT_FOUND`: Invalid productId
- `EXPIRED_BATCH_ONLY`: All batches for product are expired

---

#### 2. `refill_stock` (Receive from Supplier)

**Purpose:** Receive new inventory from supplier purchase.

**HTTP Method:** POST

**Input:**
```typescript
{
  productId: string,
  qty: number,           // positive number
  batchNumber?: string,
  expiryDate?: Date,     // ISO string
  unitCostCents?: number, // for reference/tracking
  invoiceItemId?: string, // link to supplier invoice if available
}
```

**Business Logic:**

1. Validate product exists
2. Insert new `inventoryBatch` with:
   - `qty: input.qty`
   - `remainingQty: input.qty` (full quantity available)
3. Insert `inventoryMovement` with:
   - `movementType: "PURCHASE"`
   - `qty: input.qty` (positive)
   - `batchId: newBatch.id`
   - `invoiceItemId: input.invoiceItemId` (if provided)

**Response:**
```typescript
{
  batch: { id, productId, qty, remainingQty, expiryDate, ... },
  movement: { id, movementType, qty, ... },
}
```

---

#### 3. `process_refund` (Customer Return)

**Purpose:** Process customer returns, adding stock back as new batch.

**HTTP Method:** POST

**Input:**
```typescript
{
  productId: string,
  qty: number,           // positive number
  reason: string,        // required - why refund was processed
  expiryDate?: Date,     // optional - if known
}
```

**Business Logic:**

1. Validate product exists
2. Validate `reason` is provided
3. Generate batch number: `REFUND-{YYYYMMDD}-{randomSuffix}` or leave null
4. Insert new `inventoryBatch` with:
   - `qty: input.qty`
   - `remainingQty: input.qty`
   - `batchNumber: generated or null`
   - `expiryDate: input.expiryDate`
5. Insert `inventoryMovement` with:
   - `movementType: "RETURN"`
   - `qty: input.qty` (positive)
   - `batchId: newBatch.id`
   - `reason: input.reason`

**Note:** Does NOT link to original order/batch. Creates entirely new batch.

**Response:**
```typescript
{
  batch: { id, productId, qty, remainingQty, ... },
  movement: { id, movementType, qty, reason, ... },
}
```

---

#### 4. `mark_expired` (Mark Batch as Wastage)

**Purpose:** Mark entire remaining batch as expired/wastage.

**HTTP Method:** POST

**Input:**
```typescript
{
  batchId: string,
  reason: string,  // required - why marked as expired
}
```

**Business Logic:**

1. Validate batch exists
2. Validate `remainingQty > 0`
3. Insert `inventoryMovement` with:
   - `movementType: "WASTAGE"`
   - `qty: batch.remainingQty` (positive - full remaining amount)
   - `batchId: input.batchId`
   - `reason: input.reason`
4. Update `inventoryBatch.remainingQty = 0`

**Response:**
```typescript
{
  batch: { id, productId, remainingQty: 0, ... },
  movement: { id, movementType, qty, reason, ... },
}
```

**Error Cases:**
- `BATCH_NOT_FOUND`: Invalid batchId
- `BATCH_ALREADY_EMPTY`: remainingQty is 0

---

#### 5. `adjust_stock` (Manual Stock Adjustment)

**Purpose:** Record manual adjustments for damage, theft, loss, etc.

**HTTP Method:** POST

**Input:**
```typescript
{
  batchId: string,
  qty: number,          // positive = add, negative = remove
  reason: string,       // required
}
```

**Business Logic:**

1. Validate batch exists
2. If `qty < 0` (removing):
   - Validate `abs(qty) <= batch.remainingQty` (can't remove more than available)
3. Insert `inventoryMovement` with:
   - `movementType: "ADJUSTMENT"`
   - `qty: input.qty` (can be positive or negative)
   - `batchId: input.batchId`
   - `reason: input.reason`
4. Update `inventoryBatch.remainingQty += qty`

**Note:** Positive adjustments are allowed but should be rare. Use `refill_stock` or `process_refund` for normal additions.

**Response:**
```typescript
{
  batch: { id, remainingQty: updatedValue, ... },
  movement: { id, movementType, qty, reason, ... },
}
```

**Error Cases:**
- `BATCH_NOT_FOUND`: Invalid batchId
- `INSUFFICIENT_STOCK`: Trying to remove more than remainingQty

---

### Query Operations

#### 6. `get_stock_status` (Product Stock Levels)

**Purpose:** Get current stock levels aggregated by product.

**HTTP Method:** GET

**Input:**
```typescript
{
  productIds?: string[],  // optional filter, returns all if not provided
}
```

**Business Logic:**

1. Query `inventoryBatch` grouped by `productId`
2. For each product, calculate:
   - `totalQty = sum(batch.remainingQty)` where remainingQty > 0
   - `availableBatches = count(batches where remainingQty > 0 AND (expiryDate IS NULL OR expiryDate > now()))`
   - `expiredBatches = count(batches where remainingQty > 0 AND expiryDate <= now())`
3. Join with `product` for product details

**Response:**
```typescript
{
  products: Array<{
    productId: string,
    productName: string,
    sku: string,
    totalAvailableQty: number,
    totalExpiredQty: number,
    batchCount: number,
    lowStockThreshold: number | null,
    isLowStock: boolean,  // totalAvailableQty < (threshold ?? globalDefault)
  }>,
}
```

---

#### 7. `get_batch_details` (Single Batch Info)

**Purpose:** Get detailed information about a single batch including movement history.

**HTTP Method:** GET

**Input:**
```typescript
{
  batchId: string,
}
```

**Business Logic:**

1. Query `inventoryBatch` by id
2. Query all `inventoryMovement` where `batchId = input.batchId`
3. Query `product` for product details

**Response:**
```typescript
{
  batch: {
    id: string,
    productId: string,
    product: { id, name, sku, ... },
    qty: number,
    remainingQty: number,
    batchNumber: string | null,
    expiryDate: Date | null,
    isExpired: boolean,
    createdAt: Date,
  },
  movements: Array<{
    id: string,
    movementType: MovementType,
    qty: number,
    reason: string | null,
    referenceType: string | null,
    referenceId: string | null,
    occurredAt: Date,
  }>,
}
```

---

#### 8. `get_alerts` (Stock and Expiry Alerts)

**Purpose:** Get alerts for low stock and expiring batches.

**HTTP Method:** GET

**Input:** None (or optional configuration overrides)

**Business Logic:**

1. **Low Stock Alerts:**
   - Query products with stock below threshold
   - Threshold priority: `product.lowStockThreshold ?? GLOBAL_DEFAULT`
   - Global default: configurable (e.g., 10 units)

2. **Expiring Soon Alerts:**
   - `expiringIn3Days`: batches where `expiryDate > now() AND expiryDate <= now() + 3 days`
   - `expiringIn1Day`: batches where `expiryDate > now() AND expiryDate <= now() + 1 day`
   - Exclude batches where `remainingQty = 0`

3. **Already Expired:**
   - Batches where `expiryDate <= now() AND remainingQty > 0`

**Response:**
```typescript
{
  lowStock: Array<{
    productId: string,
    productName: string,
    totalAvailableQty: number,
    threshold: number,
  }>,
  expiringIn3Days: Array<{
    batchId: string,
    productId: string,
    productName: string,
    remainingQty: number,
    expiryDate: Date,
  }>,
  expiringIn1Day: Array<{
    batchId: string,
    productId: string,
    productName: string,
    remainingQty: number,
    expiryDate: Date,
  }>,
  alreadyExpired: Array<{
    batchId: string,
    productId: string,
    productName: string,
    remainingQty: number,
    expiryDate: Date,
  }>,
}
```

---

## Retained Handlers

The following generic handlers will be kept for general querying:

| Handler | Method | Purpose |
|---------|--------|---------|
| `list_batches` | GET | List/search batches with pagination |
| `list_movements` | GET | List/search movements with pagination |

These complement the domain-specific operations for administrative queries.

---

## Removed Handlers

The following handlers will be replaced:

| Old Handler | Replaced By |
|-------------|-------------|
| `create_batch` | `refill_stock` |
| `create_movement` | `sell_stock`, `process_refund`, `mark_expired`, `adjust_stock` |

---

## Configuration

### Global Defaults

| Setting | Default Value | Location |
|---------|---------------|----------|
| `LOW_STOCK_THRESHOLD` | 10 | Environment variable or config |
| `EXPIRING_SOON_DAYS` | [1, 3] | Hardcoded |

### Environment Variables (Suggested)

```
INVENTORY_LOW_STOCK_THRESHOLD=10
```

---

## Error Handling

All errors should return structured error codes:

```typescript
{
  code: string,      // e.g., "INSUFFICIENT_STOCK"
  message: string,   // Human-readable message
  details?: object,  // Additional context (e.g., productId, available, requested)
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `INSUFFICIENT_STOCK` | Not enough stock for sale |
| `PRODUCT_NOT_FOUND` | Invalid productId |
| `BATCH_NOT_FOUND` | Invalid batchId |
| `BATCH_ALREADY_EMPTY` | Trying to mark empty batch as expired |
| `EXPIRED_BATCH_ONLY` | All batches for product are expired |
| `VALIDATION_ERROR` | Invalid input data |

---

## Transaction Safety

All mutation operations must be wrapped in database transactions:

1. **sell_stock**: Single transaction for order + orderItems + movements + batch updates
2. **refill_stock**: Single transaction for batch + movement
3. **process_refund**: Single transaction for batch + movement
4. **mark_expired**: Single transaction for movement + batch update
5. **adjust_stock**: Single transaction for movement + batch update

---

## Implementation Order

1. Add `lowStockThreshold` to product schema + migration
2. Remove old handlers (`create_batch`, `create_movement`)
3. Implement query operations first (simpler, no mutations):
   - `get_stock_status`
   - `get_batch_details`
   - `get_alerts`
4. Implement mutation operations:
   - `refill_stock` (simplest)
   - `process_refund`
   - `mark_expired`
   - `adjust_stock`
   - `sell_stock` (most complex)
5. Update router
6. Write tests

---

## Open Questions

None currently. All decisions documented above.
