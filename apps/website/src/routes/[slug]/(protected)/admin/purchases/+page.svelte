<script lang="ts">
  import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
  import BoxIcon from "@lucide/svelte/icons/box";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import PackageIcon from "@lucide/svelte/icons/package";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import { buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";

  import Pricing from "$lib/components/Pricing.svelte";
  import StatsCard from "$lib/components/cards/StatsCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();

  // Mock data for recent invoices
  const recentInvoices = [
    {
      id: "INV-2025-001",
      supplier: "Tech Supplies Co.",
      date: "2025-01-15",
      total: 154990,
      status: "validated",
      items: 12,
    },
    {
      id: "INV-2025-002",
      supplier: "Office Depot",
      date: "2025-01-14",
      total: 45990,
      status: "pending",
      items: 5,
    },
    {
      id: "INV-2025-003",
      supplier: "Global Electronics",
      date: "2025-01-12",
      total: 289900,
      status: "auto_accepted",
      items: 8,
    },
    {
      id: "INV-2025-004",
      supplier: "Stationery Plus",
      date: "2025-01-10",
      total: 12350,
      status: "rejected",
      items: 3,
    },
    {
      id: "INV-2025-005",
      supplier: "Tech Supplies Co.",
      date: "2025-01-08",
      total: 67800,
      status: "validated",
      items: 6,
    },
  ];

  // Mock data for low stock alerts
  const lowStockItems = [
    { id: "1", name: "Wireless Mouse", sku: "MOU-001", stock: 3, threshold: 10 },
    { id: "2", name: "USB-C Cable", sku: "USB-003", stock: 5, threshold: 20 },
    { id: "3", name: "Mechanical Keyboard", sku: "KEY-002", stock: 2, threshold: 5 },
    { id: "4", name: "Laptop Stand", sku: "STD-001", stock: 4, threshold: 15 },
    { id: "5", name: "Webcam HD", sku: "CAM-001", stock: 1, threshold: 8 },
  ];

  // Stats
  const stats = {
    totalInventoryValue: 1245890,
    pendingInvoices: 3,
    lowStockCount: lowStockItems.length,
    monthlyPurchaseVolume: 567890,
  };

  function getStatusStyles(status: string) {
    switch (status) {
      case "validated":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "auto_accepted":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }
</script>

<div class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[{ label: "Dashboard", href: `/${shop.slug}/admin` }, { label: "Purchases" }]}
  >
    {#snippet actions()}
      <a href={`/${shop.slug}/admin/purchases/upload`} class={buttonVariants()}>
        <UploadIcon class="size-4" />
        Upload Invoice
      </a>
    {/snippet}
  </AdminDashboardHeader>

  <!-- Page Title -->
  <div>
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">Purchases</h1>
      <p class="text-muted-foreground text-sm">
        Manage supplier invoices, inventory, and stock levels
      </p>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatsCard
      title="Inventory Value"
      value=""
      description="Total stock value"
      icon={PackageIcon}
      iconBgClass="bg-primary/10"
      iconTextClass="text-primary"
      borderClass="from-primary/20 to-primary/5"
      price={stats.totalInventoryValue}
      country={shop.country}
    />
    <StatsCard
      title="Pending Invoices"
      value={stats.pendingInvoices}
      description="Awaiting review"
      icon={ClockIcon}
      iconBgClass="bg-amber-500/10"
      iconTextClass="text-amber-600"
      borderClass="from-amber-500/20 to-amber-500/5"
    />
    <StatsCard
      title="Low Stock"
      value={stats.lowStockCount}
      description="Items below threshold"
      icon={AlertTriangleIcon}
      iconBgClass="bg-red-500/10"
      iconTextClass="text-red-600"
      borderClass="from-red-500/20 to-red-500/5"
    />
    <StatsCard
      title="Monthly Purchases"
      value=""
      description="This month"
      icon={TrendingUpIcon}
      iconBgClass="bg-emerald-500/10"
      iconTextClass="text-emerald-600"
      borderClass="from-emerald-500/20 to-emerald-500/5"
      price={stats.monthlyPurchaseVolume}
      country={shop.country}
    />
  </div>

  <!-- Two Column Layout -->
  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Recent Invoices -->
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between">
        <div>
          <Card.Title>Recent Invoices</Card.Title>
          <Card.Description>Latest supplier invoices</Card.Description>
        </div>
        <a
          href={`/${shop.slug}/admin/purchases/invoices`}
          class={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          View All
          <ArrowRightIcon class="ml-1 size-4" />
        </a>
      </Card.Header>
      <Card.Content class="p-0">
        <div class="flex flex-col">
          {#each recentInvoices as invoice}
            <div
              class="hover:bg-muted/50 flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
            >
              <div class="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
                <ReceiptIcon class="text-muted-foreground size-4" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm font-medium">{invoice.supplier}</p>
                  <span
                    class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase {getStatusStyles(
                      invoice.status
                    )}"
                  >
                    {invoice.status.replace("_", " ")}
                  </span>
                </div>
                <div class="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                  <span>{invoice.id}</span>
                  <span>•</span>
                  <span class="flex items-center gap-1">
                    <CalendarIcon class="size-3" />
                    {formatDate(invoice.date)}
                  </span>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold">
                  <Pricing cents={invoice.total} country={shop.country} />
                </p>
                <p class="text-muted-foreground text-xs">{invoice.items} items</p>
              </div>
            </div>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Low Stock Alerts -->
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between">
        <div>
          <Card.Title class="flex items-center gap-2">
            <AlertTriangleIcon class="size-4 text-red-500" />
            Low Stock Alerts
          </Card.Title>
          <Card.Description>Items requiring restocking</Card.Description>
        </div>
        <a
          href={`/${shop.slug}/admin/products`}
          class={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Manage Products
          <ArrowRightIcon class="ml-1 size-4" />
        </a>
      </Card.Header>
      <Card.Content class="p-0">
        <div class="flex flex-col">
          {#each lowStockItems as item}
            <div
              class="hover:bg-muted/50 flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
            >
              <div class="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
                <BoxIcon class="text-muted-foreground size-4" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{item.name}</p>
                <p class="text-muted-foreground text-xs">{item.sku}</p>
              </div>
              <div class="text-right">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold">{item.stock}</span>
                  <span class="text-muted-foreground text-xs">/ {item.threshold}</span>
                </div>
                <div class="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                  <div
                    class="h-full rounded-full bg-red-500"
                    style="width: {(item.stock / item.threshold) * 100}%"
                  ></div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Quick Actions -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <a href={`/${shop.slug}/admin/purchases/upload`} class="group">
      <Card.Root class="h-full transition-all duration-200 hover:shadow-md">
        <Card.Content
          class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <div
            class="bg-primary/10 group-hover:bg-primary/20 flex size-12 items-center justify-center rounded-full transition-colors"
          >
            <UploadIcon class="text-primary size-6" />
          </div>
          <div>
            <p class="font-semibold">Upload Invoice</p>
            <p class="text-muted-foreground text-sm">Scan and process supplier invoices</p>
          </div>
        </Card.Content>
      </Card.Root>
    </a>

    <a href={`/${shop.slug}/admin/purchases/suppliers`} class="group">
      <Card.Root class="h-full transition-all duration-200 hover:shadow-md">
        <Card.Content
          class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <div
            class="flex size-12 items-center justify-center rounded-full bg-blue-500/10 transition-colors group-hover:bg-blue-500/20"
          >
            <DollarSignIcon class="size-6 text-blue-600" />
          </div>
          <div>
            <p class="font-semibold">Manage Suppliers</p>
            <p class="text-muted-foreground text-sm">View and edit supplier information</p>
          </div>
        </Card.Content>
      </Card.Root>
    </a>

    <a href={`/${shop.slug}/admin/purchases/invoices`} class="group">
      <Card.Root class="h-full transition-all duration-200 hover:shadow-md">
        <Card.Content
          class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <div
            class="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20"
          >
            <FileTextIcon class="size-6 text-emerald-600" />
          </div>
          <div>
            <p class="font-semibold">View All Invoices</p>
            <p class="text-muted-foreground text-sm">Browse and search invoice history</p>
          </div>
        </Card.Content>
      </Card.Root>
    </a>
  </div>
</div>
