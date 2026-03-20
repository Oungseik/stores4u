# Purchases Management System - Implementation Plan

## Overview
A document-centric workflow for managing supplier invoices with OCR scanning, supplier management, and inventory updates.

## Pages to Create

### 1. Purchases Dashboard
**Path:** `/admin/purchases/+page.svelte`

**Features:**
- Stats cards: Total Inventory Value, Pending Invoices, Low Stock Items, Monthly Purchase Volume
- Quick action button: "Upload Invoice"
- Recent Invoices section (last 5 invoices with status badges)
- Low Stock Alerts table (products below threshold)
- Empty state for first-time users with onboarding CTA

**Mock Data:**
- 3-4 recent invoices with various statuses
- 5 low stock products
- Stats calculated from mock data

### 2. Invoice Upload Page
**Path:** `/admin/purchases/upload/+page.svelte`

**Features:**
- Large drag-and-drop zone with visual feedback
- File type validation (PDF, JPG, PNG)
- Upload progress indicator
- OCR Processing simulation:
  - Step 1: Uploading (0-30%)
  - Step 2: Scanning document (30-70%)
  - Step 3: Extracting data (70-90%)
  - Step 4: Analyzing (90-100%)
- Preview thumbnail of uploaded invoice
- "Cancel" and "Continue to Review" buttons
- Error state for failed uploads

**Mock Data:**
- Simulated OCR processing with setTimeout
- Sample invoice image placeholder

### 3. Invoice Review Page
**Path:** `/admin/purchases/review/+page.svelte`

**Layout:** Two-column layout
- Left (40%): Invoice image preview (zoomable)
- Right (60%): Extracted data form

**Features:**

**Supplier Section:**
- Detected supplier name (inline editable)
- "Create New Supplier" / "Link Existing" toggle
- If existing: Search dropdown with supplier list
- Supplier details form (contact, phone, email, address)

**Invoice Details Section:**
- Invoice number (inline editable)
- Invoice date (date picker)
- Subtotal, Tax, Discount, Freight, Total (inline editable)
- Notes textarea

**Items Table:**
- Columns: Product (search-as-you-type), Qty, Unit Cost, Line Total
- Search-as-you-type product mapping:
  - Type to search existing products
  - Show product name + SKU in dropdown
  - "Create New Product" option if not found
- Inline editable quantity and cost
- Add/remove item rows
- Batch number and expiry date fields (optional)

**Actions:**
- "Save as Draft" button
- "Validate & Update Inventory" primary button
- Cancel button

**Mock Data:**
- Pre-populated extracted data from OCR
- 10 sample products for search-as-you-type
- 3-4 invoice items

### 4. Invoice List Page
**Path:** `/admin/purchases/invoices/+page.svelte`

**Features:**
- Search bar (invoice number, supplier name)
- Status filter dropdown: All, Pending, Validated, Rejected, Auto-Accepted
- Date range filter
- Table columns:
  - Invoice Number
  - Supplier
  - Date
  - Items Count
  - Total Amount
  - Status (badge)
  - Actions (view, edit, delete)
- Expandable row view showing invoice items
- Pagination or infinite scroll
- Empty state illustration

**Mock Data:**
- 15-20 invoices with various statuses
- Mix of suppliers

### 5. Suppliers Management Page
**Path:** `/admin/purchases/suppliers/+page.svelte`

**Features:**
- Search bar for suppliers
- "Add Supplier" button (opens modal)
- Supplier cards or table view:
  - Name
  - Contact person
  - Phone/Email
  - Address
  - Number of invoices
  - Total purchased amount
  - Actions (edit, view invoices, delete)
- Supplier detail modal:
  - Edit form
  - Recent invoices list
  - Products supplied

**Mock Data:**
- 8-10 suppliers
- Associated invoice counts

## Additional Changes

### Update Admin Sidebar
Add "Purchases" navigation item between "Products" and "Orders" in `admin-sidebar.svelte`:
- Icon: `ReceiptIcon` or `FileTextIcon`
- Label: "Purchases"
- Href: `/{shop.slug}/admin/purchases`

## Technical Implementation Notes

**State Management:**
- Use Svelte 5 runes ($state, $derived)
- Mock data stored in page components
- Form state managed locally

**Components to Use:**
- @repo/ui components (Button, Card, Dialog, Input, etc.)
- @lucide/svelte icons
- Custom components for OCR workflow

**File Structure:**
```
apps/website/src/routes/[slug]/(protected)/admin/purchases/
├── +page.svelte                    # Dashboard
├── upload/
│   └── +page.svelte               # Upload & OCR
├── review/
│   └── +page.svelte               # Review extracted data
├── invoices/
│   └── +page.svelte               # List all invoices
├── suppliers/
│   └── +page.svelte               # Manage suppliers
└── components/                     # Shared components
    ├── InvoicePreview.svelte
    ├── SupplierSearch.svelte
    ├── ProductSearch.svelte
    └── OcrProgress.svelte
```

## Design Direction

**Aesthetic:** Professional, industrial/utilitarian with a focus on efficiency and clarity. Clean lines, functional design.

**Color Palette:**
- Primary: Slate/gray base with amber/gold accents for actions
- Status colors:
  - Pending: Amber
  - Validated: Emerald
  - Rejected: Red
  - Auto-accepted: Blue

**Typography:** System fonts for performance, clear hierarchy with font weights

**Key Interactions:**
- Smooth transitions between OCR steps
- Inline editing with clear focus states
- Search-as-you-type with debouncing
- Expandable sections for detailed views
