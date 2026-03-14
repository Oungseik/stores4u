# Store Management System - Schema Design Summary

## Project Overview
A **single-store convenience store management system** using **SQLite** (Turso). The system tracks products, suppliers, OCR invoice ingestion, validated purchasing invoices, and batch-based inventory with expiry.

**IMPORTANT: One store = one SQLite/Turso database. Do not add `store_id` to transactional tables.**

---

## Requirements Summary

### 1. Products & Categories
- Products have: SKU, name, barcode, description, unit of measure (UOM)
- Multi-category support: one product can belong to multiple categories
- Products with no movement history are treated as not inventory-tracked in practice

### 2. Suppliers
- One product can be purchased from multiple suppliers
- One supplier can supply multiple products
- Many-to-many relationship via junction table

### 3. Invoices & OCR Workflow
1. Upload invoice image (one invoice = one image)
2. Run OCR and store raw OCR payload in `invoice_ocr_results`
3. Human validates OCR data
4. Create finalized `invoices` and `invoice_items`
5. Link invoice to OCR result for audit trail

### 4. Inventory & Expiry
- Inventory is tracked per batch/lot in `inventory_batches`
- Stock movement source of truth is `inventory_movements`
- Outbound stock uses FIFO batch consumption (expiry-first)

### 5. Money Handling
- All monetary fields are `INTEGER` cents (int64)
- Example: `$1.00` stored as `100`

### 6. Enum Convention
- All enum values are uppercase (e.g., `PENDING`, `VALIDATED`, `REJECTED`, `AUTO_ACCEPTED`)

---

## Core Business Rules (Must Enforce)

1. **Single source of truth for stock**: remove `products.stock_qty`; derive stock from batches/movements.
2. **Invoice uniqueness**: `UNIQUE(supplier_id, invoice_number)`.
3. **Movement sign rules**:
- `PURCHASE`, `RETURN` => `qty > 0`
- `SALE`, `WASTAGE` => `qty < 0`
- `ADJUSTMENT`, `CORRECTION` => `qty != 0`
4. **Batch integrity**:
- `inventory_batches.remaining_qty` must stay between `0` and `qty`
- Outbound movements must never drive remaining stock below `0`
5. **Status integrity**:
- `invoices.status` in (`PENDING`, `VALIDATED`, `REJECTED`, `AUTO_ACCEPTED`)
- `validated_by` and `validated_at` are required when status is not `PENDING`
- `AUTO_ACCEPTED` means accepted without detailed review; keep it traceable in reports/audits
6. **Money integrity**:
- Non-negative cents fields unless explicitly designed otherwise
- `total_cents = subtotal_cents + tax_cents + freight_cents - discount_cents`

---

## Table Definitions

### 1. categories
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | Unique ID |
| name | TEXT | NOT NULL, UNIQUE | Category name |
| description | TEXT | | Optional description |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

### 2. products
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | Unique ID |
| sku | TEXT | NOT NULL, UNIQUE | Stock Keeping Unit |
| name | TEXT | NOT NULL | Product name |
| barcode | TEXT | UNIQUE | Barcode (UPC/EAN) |
| description | TEXT | | Product description |
| uom | TEXT | NOT NULL | Unit of measure (pcs, box, carton, etc.) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

### 3. product_categories
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| product_id | INTEGER | FK -> products.id | Product reference |
| category_id | INTEGER | FK -> categories.id | Category reference |
| PRIMARY KEY | (product_id, category_id) | | Composite PK |

### 4. suppliers
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | Unique ID |
| name | TEXT | NOT NULL | Supplier name |
| contact_name | TEXT | | Contact person |
| phone | TEXT | | Phone number |
| email | TEXT | | Email address |
| address | TEXT | | Full address |
| payment_terms | TEXT | | Payment terms (e.g., Net 30) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

### 5. product_suppliers
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| product_id | INTEGER | FK -> products.id | Product reference |
| supplier_id | INTEGER | FK -> suppliers.id | Supplier reference |
| is_preferred | INTEGER | NOT NULL, DEFAULT 0 | Preferred supplier flag |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| PRIMARY KEY | (product_id, supplier_id) | | Composite PK |

### 6. invoice_ocr_results
Raw OCR results saved before validation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | Unique ID |
| photo_url | TEXT | NOT NULL | Invoice image path/URL |
| raw_json | TEXT | NOT NULL | Raw OCR JSON response |
| extracted_text | TEXT | | OCR text |
| extracted_data | TEXT | | Parsed structured JSON |
| confidence_score | REAL | CHECK (confidence_score >= 0 AND confidence_score <= 1) | OCR confidence |
| status | TEXT | NOT NULL, DEFAULT 'PENDING' | `PENDING`, `PROCESSED`, `FAILED`, `LINKED` |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | OCR timestamp |

### 7. invoices
Validated invoices after OCR + human review.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | Unique ID |
| invoice_number | TEXT | NOT NULL | Supplier invoice number |
| supplier_id | INTEGER | NOT NULL, FK -> suppliers.id | Supplier reference |
| ocr_result_id | INTEGER | UNIQUE, FK -> invoice_ocr_results.id | OCR source link |
| invoice_date | DATE | NOT NULL | Invoice date |
| photo_url | TEXT | NOT NULL | Final invoice image path/URL |
| subtotal_cents | INTEGER | NOT NULL, DEFAULT 0 | Subtotal in cents |
| tax_cents | INTEGER | NOT NULL, DEFAULT 0 | Tax in cents |
| discount_cents | INTEGER | NOT NULL, DEFAULT 0 | Discount in cents |
| freight_cents | INTEGER | NOT NULL, DEFAULT 0 | Freight in cents |
| total_cents | INTEGER | NOT NULL, DEFAULT 0 | Final total in cents |
| status | TEXT | NOT NULL, DEFAULT 'PENDING' | `PENDING`, `VALIDATED`, `REJECTED`, `AUTO_ACCEPTED` |
| validated_by | TEXT | | Validator username/approver |
| validated_at | DATETIME | | Validation/approval timestamp |
| notes | TEXT | | Additional notes |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

Additional constraints:
- `UNIQUE(supplier_id, invoice_number)`
- `CHECK (total_cents = subtotal_cents + tax_cents + freight_cents - discount_cents)`
- `CHECK (status IN ('PENDING', 'VALIDATED', 'REJECTED', 'AUTO_ACCEPTED'))`
- `CHECK ((status = 'PENDING' AND validated_by IS NULL AND validated_at IS NULL) OR (status <> 'PENDING' AND validated_by IS NOT NULL AND validated_at IS NOT NULL))`

### 8. invoice_items
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | Unique ID |
| invoice_id | INTEGER | NOT NULL, FK -> invoices.id | Invoice reference |
| product_id | INTEGER | NOT NULL, FK -> products.id | Product reference |
| qty | REAL | NOT NULL, CHECK (qty > 0) | Purchased quantity |
| unit_cost_cents | INTEGER | NOT NULL, CHECK (unit_cost_cents >= 0) | Unit cost in cents |
| line_subtotal_cents | INTEGER | NOT NULL, CHECK (line_subtotal_cents >= 0) | Line subtotal in cents |
| tax_cents | INTEGER | NOT NULL, DEFAULT 0, CHECK (tax_cents >= 0) | Line tax in cents |
| discount_cents | INTEGER | NOT NULL, DEFAULT 0, CHECK (discount_cents >= 0) | Line discount in cents |
| freight_cents | INTEGER | NOT NULL, DEFAULT 0, CHECK (freight_cents >= 0) | Allocated line freight in cents |
| line_total_cents | INTEGER | NOT NULL, CHECK (line_total_cents >= 0) | Line total in cents |
| expiry_date | DATE | | Expiry date for this batch |
| batch_number | TEXT | | Batch/lot number |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

Additional constraint:
- `CHECK (line_total_cents = line_subtotal_cents + tax_cents + freight_cents - discount_cents)`

### 9. inventory_batches
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | Unique ID |
| product_id | INTEGER | NOT NULL, FK -> products.id | Product reference |
| invoice_item_id | INTEGER | FK -> invoice_items.id | Source purchase line |
| qty | REAL | NOT NULL, CHECK (qty > 0) | Initial quantity in this batch |
| remaining_qty | REAL | NOT NULL, CHECK (remaining_qty >= 0 AND remaining_qty <= qty) | Remaining quantity |
| expiry_date | DATE | | Expiry date |
| batch_number | TEXT | | Batch/lot number |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

### 10. inventory_movements
Inventory ledger for all stock changes. This is the authoritative movement history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | Unique ID |
| product_id | INTEGER | NOT NULL, FK -> products.id | Product reference |
| batch_id | INTEGER | FK -> inventory_batches.id | Affected batch (required for strict FIFO outbound) |
| invoice_item_id | INTEGER | FK -> invoice_items.id | Optional source line |
| movement_type | TEXT | NOT NULL | `PURCHASE`, `SALE`, `RETURN`, `WASTAGE`, `ADJUSTMENT`, `CORRECTION` |
| qty | REAL | NOT NULL, CHECK (qty != 0) | Signed quantity change |
| unit_cost_cents | INTEGER | | Optional valuation in cents |
| reference_type | TEXT | | Domain ref (e.g., `INVOICE`, `POS_SALE`, `MANUAL`) |
| reference_id | INTEGER | | ID in referenced domain |
| reason | TEXT | | Optional reason/details |
| occurred_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Business event time |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Record creation time |

Recommended CHECK rules:
- `movement_type IN ('PURCHASE', 'SALE', 'RETURN', 'WASTAGE', 'ADJUSTMENT', 'CORRECTION')`
- `PURCHASE/RETURN => qty > 0`
- `SALE/WASTAGE => qty < 0`

---

## FIFO Policy (Correct + Fast)

Recommended approach:
1. Keep `inventory_batches.remaining_qty` for fast reads.
2. On outbound stock (`SALE`, `WASTAGE`), allocate from earliest expiry first (`expiry_date ASC`, then `created_at ASC`).
3. Insert one `inventory_movements` row per consumed batch.
4. Update each consumed batch `remaining_qty` in the same transaction.
5. Reject transaction when stock is insufficient.

This gives correct batch-level traceability and fast query performance.

---

## Indexes to Add

- `products(sku)` unique
- `products(barcode)` unique
- `categories(name)` unique
- `invoices(supplier_id, invoice_number)` unique
- `invoice_items(invoice_id)`
- `invoice_items(product_id)`
- `inventory_batches(product_id, expiry_date, created_at)`
- `inventory_batches(product_id, remaining_qty)`
- `inventory_movements(product_id, occurred_at)`
- `inventory_movements(reference_type, reference_id)`

---

## Next Steps

1. Convert this summary into SQLite DDL with explicit CHECK/UNIQUE/FK constraints.
2. Add transaction-safe service logic for FIFO movement allocation.
3. Add test cases for:
- invoice duplicate prevention
- status transition correctness
- money total integrity
- FIFO depletion correctness
- negative stock prevention
4. Generate Drizzle schema + migration files.

---

*Document updated: March 2026*
*Purpose: Business-logic-strengthened schema plan for implementation*
