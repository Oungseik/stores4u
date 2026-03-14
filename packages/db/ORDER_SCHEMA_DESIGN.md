# Order Schema Design Document

## Overview

This document captures the design decisions for the customer order system, which tracks sales when customers come to the store and purchase products.

**Created:** March 2026

## Business Context

The existing `invoice` and `invoiceItem` tables are used exclusively for **supplier purchase invoices** (restocking inventory). The new `order` and `orderItem` tables handle **customer sales orders** (point-of-sale transactions).

## Design Decisions

### 1. Customer Information

**Decision:** Optional customer fields stored directly on the order table.

**Rationale:**
- Most sales are anonymous walk-in customers
- Avoiding a separate `customer` table keeps the schema simple
- Customer name and phone can be captured when provided (for loyalty, receipts, etc.)

**Fields:**
- `customerName` (optional)
- `customerPhone` (optional)

### 2. Payment Method

**Decision:** Cash-only payments for now.

**Rationale:**
- Simple implementation for initial launch
- Can add payment method tracking later as needed

**Future consideration:**
- A `paymentMethod` enum field (CASH, CARD, QR, etc.)
- A separate `payment` table for split payments if needed

### 3. Order Status

**Decision:** Simple status - orders are always completed immediately.

**Rationale:**
- No hold/layaway functionality needed initially
- No draft/pending states required
- All orders are final sale transactions

**Future consideration:**
- Add `status` field if workflow complexity is needed (DRAFT, PENDING, COMPLETED, CANCELLED)
- Add `cancelledAt`, `cancelledReason` fields for cancellation tracking

### 4. Inventory Integration

**Decision:** Automatic stock deduction via inventory movements.

**Implementation:**
- When an order is created, each `orderItem` should create a corresponding `inventoryMovement` record with:
  - `movementType: "SALE"`
  - `qty: -<orderItem.qty>` (negative for outbound)
  - `referenceType: "ORDER"`
  - `referenceId: <orderItem.id>`
- Stock deduction follows FIFO (first-in, first-out) based on batch expiry dates

### 5. Tax Handling

**Decision:** No separate tax tracking - prices are tax-inclusive.

**Rationale:**
- Simpler calculation for store staff
- Tax-inclusive pricing is common in many markets
- Can be added later if required by regulation

### 6. Order Identification

**Decision:** UUID v7 for primary key, with unique `orderNumber`.

**Rationale:**
- Consistent with existing schema patterns (uses `randomUUIDv7()` from Bun)
- UUID v7 provides time-sortable IDs
- `orderNumber` provides human-readable reference (can be formatted as needed)

### 7. Money Handling

**Decision:** All monetary values stored as INTEGER cents (consistent with existing schema).

**Fields:**
- `subtotalCents` - sum of all line totals
- `discountCents` - order-level discount
- `totalCents` - final amount: `subtotalCents - discountCents`

---

## Schema Reference

### `order` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, UUID v7 | Primary key |
| orderNumber | TEXT | NOT NULL, UNIQUE | Human-readable order reference |
| customerName | TEXT | | Optional customer name |
| customerPhone | TEXT | | Optional customer phone |
| subtotalCents | INTEGER | NOT NULL, DEFAULT 0 | Sum of line item totals |
| discountCents | INTEGER | NOT NULL, DEFAULT 0 | Order-level discount |
| totalCents | INTEGER | NOT NULL | Final amount (subtotal - discount) |
| notes | TEXT | | Optional notes |
| createdAt | INTEGER | NOT NULL | Timestamp (mode: timestamp) |
| updatedAt | INTEGER | NOT NULL | Timestamp (mode: timestamp) |

**Indexes:**
- `order_created_at_idx` on `createdAt`

### `orderItem` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, UUID v7 | Primary key |
| orderId | TEXT | NOT NULL, FK → order.id | Order reference (cascade delete) |
| productId | TEXT | NOT NULL, FK → product.id | Product reference |
| qty | REAL | NOT NULL | Quantity sold |
| unitPriceCents | INTEGER | NOT NULL | Price per unit in cents |
| lineTotalCents | INTEGER | NOT NULL | qty × unitPriceCents |
| createdAt | INTEGER | NOT NULL | Timestamp (mode: timestamp) |

**Indexes:**
- `order_item_order_id_idx` on `orderId`
- `order_item_product_id_idx` on `productId`

---

## Relationships

```
order (1) ──────< (N) orderItem >─────── (1) product
                        │
                        │ (via inventoryMovement)
                        │
                        ▼
                inventoryMovement (SALE type)
                        │
                        ▼
                inventoryBatch (FIFO deduction)
```

---

## Files Modified

1. **`src/schema/order.ts`** - New file containing `order` and `orderItem` table definitions
2. **`src/schema/index.ts`** - Added export for order schema
3. **`src/schema/relations.ts`** - Added relations for order and orderItem

---

## Business Rules

1. **Order creation flow:**
   1. Create `order` record with totals
   2. Create `orderItem` records for each product
   3. For each `orderItem`, create `inventoryMovement` with type `SALE`
   4. Deduct from `inventoryBatch` following FIFO (earliest expiry first)

2. **Money integrity:**
   - `totalCents = subtotalCents - discountCents`
   - `lineTotalCents = qty × unitPriceCents`
   - All values in cents (INTEGER) to avoid floating-point precision issues

3. **Inventory integrity:**
   - Sale transactions must never drive inventory below zero
   - Reject order creation if insufficient stock

---

## Future Considerations

1. **Payment tracking:** Add `payment` table for multiple payment methods and split payments
2. **Order status:** Add status workflow if hold/layaway functionality is needed
3. **Tax tracking:** Add tax fields if separate tax reporting becomes required
4. **Customer accounts:** Create separate `customer` table if customer loyalty/tracking is needed
5. **Returns/refunds:** Add `orderReturn` and `orderReturnItem` tables for return processing