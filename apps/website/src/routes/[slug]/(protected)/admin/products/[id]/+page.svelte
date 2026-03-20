<script lang="ts">
  import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import BarcodeIcon from "@lucide/svelte/icons/barcode";
  import BoxIcon from "@lucide/svelte/icons/box";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import StoreIcon from "@lucide/svelte/icons/store";
  import TagIcon from "@lucide/svelte/icons/tag";
  import TrendingDownIcon from "@lucide/svelte/icons/trending-down";
  import TruckIcon from "@lucide/svelte/icons/truck";
  import UserIcon from "@lucide/svelte/icons/user";
  import * as Alert from "@repo/ui/alert";
  import { Badge } from "@repo/ui/badge";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Separator from "@repo/ui/separator";
  import * as Tabs from "@repo/ui/tabs";

  import Pricing from "$lib/components/Pricing.svelte";

  import type { PageProps } from "./$types";

  const { params, data }: PageProps = $props();

  // ============================================
  // MOCK DATA
  // ============================================
  
  const mockProduct = {
    id: "prod-001",
    name: "Premium Wireless Headphones",
    sku: "AUDIO-WH-001",
    description: "High-quality wireless headphones with active noise cancellation, 30-hour battery life, and premium sound quality. Features Bluetooth 5.0 connectivity and comfortable over-ear design.",
    priceCents: 29999, // $299.99
    stock: 8, // Low stock (below threshold of 10)
    lowStockThreshold: 10,
    uom: "piece",
    barcode: "1234567890123",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-03-15"),
  };

  const mockCategories = [
    { id: "cat-001", name: "Electronics" },
    { id: "cat-002", name: "Audio Equipment" },
  ];

  const mockSuppliers = [
    {
      id: "sup-001",
      name: "TechSource Distribution",
      contactName: "John Smith",
      phone: "+1 (555) 123-4567",
      email: "orders@techsource.com",
      isPreferred: true,
    },
    {
      id: "sup-002",
      name: "Global Audio Supply",
      contactName: "Sarah Chen",
      phone: "+1 (555) 987-6543",
      email: "sales@globalaudio.com",
      isPreferred: false,
    },
  ];

  // Invoice items showing purchase history - most recent has unitCostCents of 32000 ($320)
  // This triggers price warning since selling price (29999) < cost (32000)
  const mockInvoices = [
    {
      id: "inv-001",
      invoiceNumber: "INV-2024-0034",
      supplierId: "sup-001",
      supplierName: "TechSource Distribution",
      invoiceDate: "2024-03-10",
      items: [
        {
          id: "ii-001",
          qty: 20,
          unitCostCents: 32000, // $320.00 - This is higher than selling price!
          lineTotalCents: 640000,
        },
      ],
      status: "VALIDATED" as const,
      createdAt: new Date("2024-03-10"),
    },
    {
      id: "inv-002",
      invoiceNumber: "INV-2024-0021",
      supplierId: "sup-002",
      supplierName: "Global Audio Supply",
      invoiceDate: "2024-02-15",
      items: [
        {
          id: "ii-002",
          qty: 15,
          unitCostCents: 28000, // $280.00
          lineTotalCents: 420000,
        },
      ],
      status: "VALIDATED" as const,
      createdAt: new Date("2024-02-15"),
    },
  ];

  const mockInventoryMovements = [
    {
      id: "im-001",
      movementType: "PURCHASE" as const,
      qty: 20,
      unitCostCents: 32000,
      referenceType: "invoice",
      referenceId: "inv-001",
      reason: "Stock replenishment",
      occurredAt: new Date("2024-03-10T10:30:00"),
    },
    {
      id: "im-002",
      movementType: "SALE" as const,
      qty: -5,
      referenceType: "order",
      referenceId: "ord-001",
      reason: null,
      occurredAt: new Date("2024-03-12T14:20:00"),
    },
    {
      id: "im-003",
      movementType: "SALE" as const,
      qty: -3,
      referenceType: "order",
      referenceId: "ord-002",
      reason: null,
      occurredAt: new Date("2024-03-13T09:15:00"),
    },
    {
      id: "im-004",
      movementType: "ADJUSTMENT" as const,
      qty: -2,
      referenceType: null,
      referenceId: null,
      reason: "Damaged goods",
      occurredAt: new Date("2024-03-14T16:45:00"),
    },
    {
      id: "im-005",
      movementType: "SALE" as const,
      qty: -2,
      referenceType: "order",
      referenceId: "ord-003",
      reason: null,
      occurredAt: new Date("2024-03-15T11:30:00"),
    },
    {
      id: "im-006",
      movementType: "RETURN" as const,
      qty: 1,
      referenceType: "order",
      referenceId: "ord-002",
      reason: "Customer return - defective",
      occurredAt: new Date("2024-03-16T13:00:00"),
    },
  ];

  const mockOrders = [
    {
      id: "ord-001",
      customerName: "Alice Johnson",
      customerPhone: "+1 (555) 111-2222",
      qty: 5,
      unitPriceCents: 29999,
      lineTotalCents: 149995,
      createdAt: new Date("2024-03-12T14:20:00"),
    },
    {
      id: "ord-002",
      customerName: "Bob Williams",
      customerPhone: "+1 (555) 333-4444",
      qty: 3,
      unitPriceCents: 29999,
      lineTotalCents: 89997,
      createdAt: new Date("2024-03-13T09:15:00"),
    },
    {
      id: "ord-003",
      customerName: "Carol Davis",
      customerPhone: null,
      qty: 2,
      unitPriceCents: 29999,
      lineTotalCents: 59998,
      createdAt: new Date("2024-03-15T11:30:00"),
    },
  ];

  // ============================================
  // COMPUTED STATE
  // ============================================

  const hasLowStock = $derived(mockProduct.stock < 10);
  
  const mostRecentUnitCost = $derived(() => {
    // Sort invoices by date descending and get the first one
    const sortedInvoices = [...mockInvoices].sort(
      (a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
    );
    const mostRecent = sortedInvoices[0];
    if (!mostRecent) return null;
    return mostRecent.items[0]?.unitCostCents ?? null;
  });

  const hasPricingWarning = $derived(() => {
    const cost = mostRecentUnitCost();
    if (!cost) return false;
    return mockProduct.priceCents < cost;
  });

  const totalRevenue = $derived(
    mockOrders.reduce((sum, order) => sum + order.lineTotalCents, 0)
  );

  const totalUnitsSold = $derived(
    mockOrders.reduce((sum, order) => sum + order.qty, 0)
  );

  // ============================================
  // HELPERS
  // ============================================

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  type MovementType = "PURCHASE" | "SALE" | "RETURN" | "ADJUSTMENT" | "WASTAGE" | "CORRECTION";

  function getMovementBadgeVariant(type: MovementType): "default" | "secondary" | "destructive" | "outline" {
    switch (type) {
      case "PURCHASE":
        return "secondary";
      case "SALE":
        return "secondary";
      case "RETURN":
        return "outline";
      case "ADJUSTMENT":
        return "outline";
      case "WASTAGE":
        return "destructive";
      default:
        return "outline";
    }
  }
</script>

<div class="flex min-h-screen flex-col bg-muted">
  <header class="sticky top-0 z-10 border-b bg-card px-4 py-3 shadow-sm">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <a
          href="/{params.slug}/admin/products"
          class={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeftIcon data-icon class="size-5" />
        </a>
        <h1 class="text-lg font-semibold text-foreground">Product Details</h1>
      </div>
      <a
        href="/{params.slug}/admin/products/{params.id}/edit"
        class={buttonVariants({ size: "sm" })}
      >
        <PencilIcon data-icon="inline-start" />
        Edit
      </a>
    </div>
  </header>

  <div class="relative aspect-[4/3] w-full overflow-hidden bg-muted">
    {#if mockProduct.image}
      <img
        src={mockProduct.image}
        alt={mockProduct.name}
        class="h-full w-full object-cover"
      />
    {:else}
      <div class="flex h-full items-center justify-center">
        <PackageIcon class="size-20 text-muted-foreground/50" />
      </div>
    {/if}
  </div>

  {#if hasLowStock}
    <div class="mx-4 mt-4">
      <Alert.Root class="border-amber-500/50 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-100 [&>svg]:text-amber-600">
        <AlertTriangleIcon />
        <Alert.Title>Low Stock Warning</Alert.Title>
        <Alert.Description>
          Only {mockProduct.stock} units remaining (below threshold of 10).
        </Alert.Description>
      </Alert.Root>
    </div>
  {/if}

  {#if hasPricingWarning()}
    <div class="mx-4 mt-3">
      <Alert.Root variant="destructive">
        <AlertTriangleIcon />
        <Alert.Title>Pricing Warning</Alert.Title>
        <Alert.Description>
          Selling price ({(mockProduct.priceCents / 100).toFixed(2)}) is below the most recent supplier cost
          ({(mostRecentUnitCost()! / 100).toFixed(2)}).
        </Alert.Description>
      </Alert.Root>
    </div>
  {/if}

  <div class="border-b bg-card px-4 py-5">
    <h2 class="text-xl font-semibold text-foreground">{mockProduct.name}</h2>
    
    <div class="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
      <span class="font-medium text-foreground">
        <Pricing cents={mockProduct.priceCents} priceClass="text-lg font-semibold" />
      </span>
      <span>•</span>
      <span class={mockProduct.stock < 10 ? "font-medium text-destructive" : "text-muted-foreground"}>
        {mockProduct.stock} in stock
      </span>
    </div>

    <div class="mt-3 flex flex-wrap gap-2">
      {#each mockCategories as category}
        <Badge variant="secondary">
          {category.name}
        </Badge>
      {/each}
    </div>

    <div class="mt-4 flex flex-col gap-1 text-sm text-muted-foreground">
      <div class="flex items-center gap-2">
        <TagIcon class="size-4" />
        <span>SKU: {mockProduct.sku}</span>
      </div>
      {#if mockProduct.barcode}
        <div class="flex items-center gap-2">
          <BarcodeIcon class="size-4" />
          <span>Barcode: {mockProduct.barcode}</span>
        </div>
      {/if}
    </div>
  </div>

  <Tabs.Root value="overview" class="flex-1">
    <div class="sticky top-[57px] z-10 bg-card">
      <Tabs.List>
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="inventory">Inventory</Tabs.Trigger>
        <Tabs.Trigger value="history">History</Tabs.Trigger>
      </Tabs.List>
    </div>

    <Tabs.Content value="overview" class="mt-0">
      <div class="flex flex-col gap-4 p-4">
        {#if mockProduct.description}
          <Card.Root class="border-0 bg-card shadow-sm">
            <Card.Header class="pb-3">
              <Card.Title class="text-sm font-medium text-muted-foreground">Description</Card.Title>
            </Card.Header>
            <Card.Content>
              <p class="text-sm leading-relaxed text-foreground">{mockProduct.description}</p>
            </Card.Content>
          </Card.Root>
        {/if}

        <div class="grid grid-cols-2 gap-3">
          <Card.Root class="border-0 bg-card shadow-sm">
            <Card.Content class="p-4">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSignIcon class="size-5 text-primary" />
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Total Revenue</p>
                    <p class="text-lg font-semibold text-foreground">
                      <Pricing cents={totalRevenue} />
                    </p>
                </div>
              </div>
            </Card.Content>
          </Card.Root>

          <Card.Root class="border-0 bg-card shadow-sm">
            <Card.Content class="p-4">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <ShoppingCartIcon class="size-5 text-primary" />
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Units Sold</p>
                  <p class="text-lg font-semibold text-foreground">{totalUnitsSold}</p>
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        </div>

        <Card.Root class="border-0 bg-card shadow-sm">
          <Card.Header class="pb-3">
            <Card.Title class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <StoreIcon class="size-4" />
              Suppliers
            </Card.Title>
          </Card.Header>
          <Card.Content class="flex flex-col gap-3">
            {#each mockSuppliers as supplier}
              <div class="flex items-start justify-between rounded-lg border p-3">
                <div>
                  <div class="flex items-center gap-2">
                    <p class="font-medium text-foreground">{supplier.name}</p>
                    {#if supplier.isPreferred}
                      <Badge>Preferred</Badge>
                    {/if}
                  </div>
                  <p class="mt-1 text-sm text-muted-foreground">{supplier.contactName}</p>
                  <p class="text-xs text-muted-foreground">{supplier.phone}</p>
                </div>
              </div>
            {/each}
          </Card.Content>
        </Card.Root>

        <Card.Root class="border-0 bg-card shadow-sm">
          <Card.Header class="pb-3">
            <Card.Title class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileTextIcon class="size-4" />
              Recent Invoices
            </Card.Title>
          </Card.Header>
          <Card.Content class="flex flex-col gap-3">
            {#each mockInvoices.slice(0, 5) as invoice}
              <div class="flex items-center justify-between rounded-lg border p-3">
                <div class="flex items-center gap-3">
                  <div class="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <FileTextIcon class="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p class="font-medium text-foreground">{invoice.invoiceNumber}</p>
                    <p class="text-sm text-muted-foreground">{invoice.supplierName}</p>
                    <p class="text-xs text-muted-foreground">{formatDate(new Date(invoice.invoiceDate))}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-medium text-foreground">
                    <Pricing cents={invoice.items[0]?.lineTotalCents ?? 0} />
                  </p>
                  <p class="text-xs text-muted-foreground">{invoice.items[0]?.qty} units</p>
                </div>
              </div>
            {/each}
          </Card.Content>
        </Card.Root>
      </div>
    </Tabs.Content>

    <Tabs.Content value="inventory" class="mt-0">
      <div class="flex flex-col gap-3 p-4">
        {#each mockInventoryMovements as movement}
          <Card.Root class="border-0 bg-card shadow-sm">
            <Card.Content class="p-4">
              <div class="flex items-start gap-3">
                <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {#if movement.movementType === 'PURCHASE'}
                    <TruckIcon class="size-5 text-primary" />
                  {:else if movement.movementType === 'SALE'}
                    <ShoppingCartIcon class="size-5 text-primary" />
                  {:else if movement.movementType === 'RETURN'}
                    <TrendingDownIcon class="size-5 text-muted-foreground" />
                  {:else}
                    <BoxIcon class="size-5 text-muted-foreground" />
                  {/if}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between">
                    <Badge variant={getMovementBadgeVariant(movement.movementType)}>
                      {movement.movementType}
                    </Badge>
                    <Badge variant={movement.qty > 0 ? "secondary" : "destructive"}>
                      {movement.qty > 0 ? '+' : ''}{movement.qty}
                    </Badge>
                  </div>
                  {#if movement.reason}
                    <p class="mt-1 text-sm text-muted-foreground">{movement.reason}</p>
                  {/if}
                  <div class="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarIcon class="size-3" />
                    <span>{formatDateTime(movement.occurredAt)}</span>
                  </div>
                  {#if movement.unitCostCents}
                    <p class="mt-1 text-xs text-muted-foreground">
                      Cost: <Pricing cents={movement.unitCostCents} />
                    </p>
                  {/if}
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    </Tabs.Content>

    <Tabs.Content value="history" class="mt-0">
      <div class="flex flex-col gap-3 p-4">
        {#each mockOrders as order}
          <Card.Root class="border-0 bg-card shadow-sm">
            <Card.Content class="p-4">
              <div class="flex items-start gap-3">
                <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <UserIcon class="size-5 text-primary" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between">
                    <p class="font-medium text-foreground">{order.customerName}</p>
                    <Badge variant="secondary">
                      {order.qty} units
                    </Badge>
                  </div>
                  {#if order.customerPhone}
                    <p class="mt-1 text-sm text-muted-foreground">{order.customerPhone}</p>
                  {/if}
                  <div class="mt-2 flex items-center justify-between">
                    <div class="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarIcon class="size-3" />
                      <span>{formatDateTime(order.createdAt)}</span>
                    </div>
                    <p class="font-semibold text-foreground">
                      <Pricing cents={order.lineTotalCents} />
                    </p>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        {/each}

        <Card.Root class="border bg-muted shadow-none">
          <Card.Content class="p-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Total Orders</span>
              <span class="font-semibold text-foreground">{mockOrders.length}</span>
            </div>
            <Separator.Root class="my-3" />
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Total Revenue</span>
              <span class="font-semibold text-foreground">
                <Pricing cents={totalRevenue} priceClass="text-lg" />
              </span>
            </div>
          </Card.Content>
        </Card.Root>
      </div>
    </Tabs.Content>
  </Tabs.Root>
</div>
