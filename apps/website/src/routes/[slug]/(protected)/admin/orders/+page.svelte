<script lang="ts">
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
  import CreditCardIcon from "@lucide/svelte/icons/credit-card";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import FilterIcon from "@lucide/svelte/icons/filter";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PackageIcon from "@lucide/svelte/icons/package";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import SearchIcon from "@lucide/svelte/icons/search";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import TruckIcon from "@lucide/svelte/icons/truck";
  import * as Breadcrumb from "@repo/ui/breadcrumb";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Dialog from "@repo/ui/dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { Input } from "@repo/ui/input";
  import { Separator } from "@repo/ui/separator";
  import * as Sidebar from "@repo/ui/sidebar";
  import { cubicOut } from "svelte/easing";
  import { slide } from "svelte/transition";

  import Pricing from "$lib/components/Pricing.svelte";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  // Mock orders data
  const mockOrders = [
    {
      id: "ORD-2025-0001",
      customer: { name: "Sarah Mitchell", email: "sarah.m@example.com", avatar: null },
      date: "2025-01-15T09:30:00Z",
      status: "completed",
      paymentStatus: "paid",
      total: 15499,
      items: [
        { name: "Artisan Coffee Blend", sku: "COF-001", quantity: 2, price: 2499 },
        { name: "Ceramic Mug Set", sku: "MUG-002", quantity: 1, price: 10501 },
      ],
      shipping: { method: "Standard", cost: 799, tracking: "TRK123456789" },
      notes: "Leave at front door",
    },
    {
      id: "ORD-2025-0002",
      customer: { name: "James Rodriguez", email: "j.rodriguez@example.com", avatar: null },
      date: "2025-01-15T14:22:00Z",
      status: "processing",
      paymentStatus: "paid",
      total: 8999,
      items: [{ name: "Organic Tea Collection", sku: "TEA-003", quantity: 1, price: 8999 }],
      shipping: { method: "Express", cost: 1299, tracking: null },
      notes: "",
    },
    {
      id: "ORD-2025-0003",
      customer: { name: "Emma Thompson", email: "emma.t@example.com", avatar: null },
      date: "2025-01-14T16:45:00Z",
      status: "shipped",
      paymentStatus: "paid",
      total: 23497,
      items: [
        { name: "French Press", sku: "BREW-001", quantity: 1, price: 12999 },
        { name: "Coffee Filters (100pk)", sku: "FLT-001", quantity: 2, price: 899 },
      ],
      shipping: { method: "Standard", cost: 799, tracking: "TRK987654321" },
      notes: "Gift wrap requested",
    },
    {
      id: "ORD-2025-0004",
      customer: { name: "Michael Chen", email: "m.chen@example.com", avatar: null },
      date: "2025-01-14T11:20:00Z",
      status: "pending",
      paymentStatus: "pending",
      total: 5498,
      items: [{ name: "Pour Over Kettle", sku: "KTL-001", quantity: 1, price: 5498 }],
      shipping: { method: "Standard", cost: 799, tracking: null },
      notes: "",
    },
    {
      id: "ORD-2025-0005",
      customer: { name: "Lisa Anderson", email: "lisa.a@example.com", avatar: null },
      date: "2025-01-13T08:15:00Z",
      status: "cancelled",
      paymentStatus: "refunded",
      total: 3299,
      items: [{ name: "Espresso Cups (Set of 4)", sku: "CUP-002", quantity: 1, price: 3299 }],
      shipping: { method: "Standard", cost: 799, tracking: null },
      notes: "Customer requested cancellation",
    },
    {
      id: "ORD-2025-0006",
      customer: { name: "David Williams", email: "d.williams@example.com", avatar: null },
      date: "2025-01-13T19:30:00Z",
      status: "completed",
      paymentStatus: "paid",
      total: 18997,
      items: [{ name: "Coffee Grinder", sku: "GRD-001", quantity: 1, price: 18997 }],
      shipping: { method: "Express", cost: 1299, tracking: "TRK456789123" },
      notes: "",
    },
    {
      id: "ORD-2025-0007",
      customer: { name: "Jennifer Lee", email: "j.lee@example.com", avatar: null },
      date: "2025-01-12T13:45:00Z",
      status: "processing",
      paymentStatus: "paid",
      total: 12499,
      items: [{ name: "Cold Brew Maker", sku: "BRW-002", quantity: 1, price: 12499 }],
      shipping: { method: "Standard", cost: 799, tracking: null },
      notes: "",
    },
    {
      id: "ORD-2025-0008",
      customer: { name: "Robert Taylor", email: "r.taylor@example.com", avatar: null },
      date: "2025-01-12T10:00:00Z",
      status: "shipped",
      paymentStatus: "paid",
      total: 4596,
      items: [
        { name: "Coffee Scoop", sku: "SCC-001", quantity: 2, price: 1499 },
        { name: "Storage Canister", sku: "CNR-001", quantity: 1, price: 2998 },
      ],
      shipping: { method: "Standard", cost: 799, tracking: "TRK789123456" },
      notes: "",
    },
  ];

  // State
  let searchQuery = $state("");
  let selectedStatus = $state<string | null>(null);
  let expandedOrder = $state<string | null>(null);
  let selectedOrder = $state<(typeof mockOrders)[0] | null>(null);
  let isDetailsOpen = $state(false);

  // Filter orders
  const filteredOrders = $derived(() => {
    return mockOrders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus ? order.status === selectedStatus : true;

      return matchesSearch && matchesStatus;
    });
  });

  // Stats
  const stats = $derived(() => {
    const total = mockOrders.length;
    const pending = mockOrders.filter((o) => o.status === "pending").length;
    const processing = mockOrders.filter((o) => o.status === "processing").length;
    const completed = mockOrders.filter((o) => o.status === "completed").length;
    const revenue = mockOrders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.total, 0);

    return { total, pending, processing, completed, revenue };
  });

  // Format date
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  // Status styles
  function getStatusStyles(status: string) {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "shipped":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  }

  function getPaymentStatusStyles(status: string) {
    switch (status) {
      case "paid":
        return "text-emerald-600";
      case "pending":
        return "text-amber-600";
      case "refunded":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  }

  function toggleOrderDetails(orderId: string) {
    expandedOrder = expandedOrder === orderId ? null : orderId;
  }

  function openOrderDetails(order: (typeof mockOrders)[0]) {
    selectedOrder = order;
    isDetailsOpen = true;
  }

  const statusFilters = [
    { value: null, label: "All Orders", count: mockOrders.length },
    {
      value: "pending",
      label: "Pending",
      count: mockOrders.filter((o) => o.status === "pending").length,
    },
    {
      value: "processing",
      label: "Processing",
      count: mockOrders.filter((o) => o.status === "processing").length,
    },
    {
      value: "shipped",
      label: "Shipped",
      count: mockOrders.filter((o) => o.status === "shipped").length,
    },
    {
      value: "completed",
      label: "Completed",
      count: mockOrders.filter((o) => o.status === "completed").length,
    },
    {
      value: "cancelled",
      label: "Cancelled",
      count: mockOrders.filter((o) => o.status === "cancelled").length,
    },
  ];
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <!-- Header with Breadcrumb -->
  <div class="flex flex-col gap-4">
    <div class="flex h-9 items-center justify-between">
      <div class="flex items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <Sidebar.Trigger class="-ms-1" />
        <Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link href={`/${shop.slug}/admin`}>Dashboard</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.Page>Orders</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>
      <Button variant="outline" size="sm" class="gap-2">
        <DownloadIcon class="size-4" />
        Export
      </Button>
    </div>
  </div>

  <!-- Page Title & Description -->
  <div class="px-4 lg:px-6">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">Orders</h1>
      <p class="text-muted-foreground text-sm">Manage and track all your shop orders</p>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
    <Card.Root class="relative overflow-hidden">
      <div
        class="from-primary/20 to-primary/5 absolute top-0 right-0 h-full w-1 bg-gradient-to-b"
      ></div>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Total Orders</Card.Title>
        <div class="bg-primary/10 rounded-md p-2">
          <ShoppingBagIcon class="text-primary size-4" />
        </div>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{stats().total}</div>
        <p class="text-muted-foreground text-xs">All time orders</p>
      </Card.Content>
    </Card.Root>

    <Card.Root class="relative overflow-hidden">
      <div
        class="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-amber-500/20 to-amber-500/5"
      ></div>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Pending</Card.Title>
        <div class="rounded-md bg-amber-500/10 p-2">
          <ReceiptIcon class="size-4 text-amber-600" />
        </div>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{stats().pending}</div>
        <p class="text-muted-foreground text-xs">Awaiting action</p>
      </Card.Content>
    </Card.Root>

    <Card.Root class="relative overflow-hidden">
      <div
        class="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-blue-500/20 to-blue-500/5"
      ></div>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Processing</Card.Title>
        <div class="rounded-md bg-blue-500/10 p-2">
          <PackageIcon class="size-4 text-blue-600" />
        </div>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{stats().processing}</div>
        <p class="text-muted-foreground text-xs">In progress</p>
      </Card.Content>
    </Card.Root>

    <Card.Root class="relative overflow-hidden">
      <div
        class="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-emerald-500/20 to-emerald-500/5"
      ></div>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Revenue</Card.Title>
        <div class="rounded-md bg-emerald-500/10 p-2">
          <CreditCardIcon class="size-4 text-emerald-600" />
        </div>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">
          <Pricing cents={stats().revenue} country={shop.country} priceClass="text-2xl font-bold" />
        </div>
        <p class="text-muted-foreground text-xs">Total revenue</p>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Filters and Search -->
  <div class="flex flex-col gap-4 px-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
    <div class="flex flex-1 items-center gap-2">
      <div class="relative max-w-md flex-1">
        <SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input placeholder="Search orders, customers..." class="pl-9" bind:value={searchQuery} />
      </div>
    </div>

    <div class="flex items-center gap-2">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger class={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}>
          <FilterIcon class="size-4" />
          {selectedStatus
            ? statusFilters.find((s) => s.value === selectedStatus)?.label
            : "Filter Status"}
          <ChevronDownIcon class="size-3 opacity-50" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-48">
          <DropdownMenu.Label>Filter by Status</DropdownMenu.Label>
          <DropdownMenu.Separator />
          {#each statusFilters as filter}
            <DropdownMenu.Item
              onclick={() => (selectedStatus = filter.value)}
              class="justify-between"
            >
              {filter.label}
              <span class="text-muted-foreground text-xs">{filter.count}</span>
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      {#if selectedStatus}
        <Button variant="ghost" size="sm" onclick={() => (selectedStatus = null)}>
          Clear filter
        </Button>
      {/if}
    </div>
  </div>

  <!-- Status Filter Pills -->
  <div class="flex flex-wrap gap-2 px-4 lg:px-6">
    {#each statusFilters as filter}
      <button
        type="button"
        class={[
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
          selectedStatus === filter.value
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
        ]}
        onclick={() => (selectedStatus = filter.value)}
      >
        {filter.label}
        <span
          class={[
            "rounded-full px-1.5 py-0.5 text-[10px]",
            selectedStatus === filter.value ? "bg-primary-foreground/20" : "bg-background",
          ]}
        >
          {filter.count}
        </span>
      </button>
    {/each}
  </div>

  <!-- Orders List -->
  <div class="flex flex-col gap-3 px-4 lg:px-6">
    {#if filteredOrders().length === 0}
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <ShoppingBagIcon class="text-muted-foreground size-8" />
        </div>
        <h3 class="text-lg font-semibold">No orders found</h3>
        <p class="text-muted-foreground max-w-sm text-sm">
          {searchQuery || selectedStatus
            ? "Try adjusting your search or filters"
            : "Orders will appear here when customers make purchases"}
        </p>
      </div>
    {:else}
      <div class="flex flex-col gap-3">
        {#each filteredOrders() as order (order.id)}
          <Card.Root class="group overflow-hidden transition-all duration-200 hover:shadow-md">
            <div class="flex flex-col">
              <!-- Main Order Row -->
              <div class="flex items-center gap-4 p-4">
                <!-- Order ID & Date -->
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="hover:text-primary text-sm font-semibold hover:underline"
                      onclick={() => openOrderDetails(order)}
                    >
                      {order.id}
                    </button>
                    <span
                      class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase {getStatusStyles(
                        order.status
                      )}"
                    >
                      {order.status}
                    </span>
                  </div>
                  <div class="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                    <CalendarIcon class="size-3" />
                    {formatDate(order.date)}
                  </div>
                </div>

                <!-- Customer -->
                <div class="hidden min-w-0 flex-1 md:block">
                  <p class="truncate text-sm font-medium">{order.customer.name}</p>
                  <p class="text-muted-foreground truncate text-xs">{order.customer.email}</p>
                </div>

                <!-- Items Count -->
                <div class="hidden text-center md:block">
                  <p class="text-sm font-medium">{order.items.length}</p>
                  <p class="text-muted-foreground text-xs">items</p>
                </div>

                <!-- Total -->
                <div class="text-right">
                  <p class="text-sm font-semibold">
                    <Pricing cents={order.total} country={shop.country} />
                  </p>
                  <p class="text-xs {getPaymentStatusStyles(order.paymentStatus)}">
                    {order.paymentStatus}
                  </p>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="text-muted-foreground hover:bg-muted rounded-md p-2 transition-colors"
                    onclick={() => toggleOrderDetails(order.id)}
                    aria-label={expandedOrder === order.id ? "Collapse details" : "Expand details"}
                  >
                    {#if expandedOrder === order.id}
                      <ChevronUpIcon class="size-4" />
                    {:else}
                      <ChevronDownIcon class="size-4" />
                    {/if}
                  </button>

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger
                      class={buttonVariants({ variant: "ghost", size: "icon" }) + " size-8"}
                    >
                      <MoreVerticalIcon class="size-4" />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item onclick={() => openOrderDetails(order)}>
                        <ReceiptIcon class="mr-2 size-4" />
                        View Details
                      </DropdownMenu.Item>
                      <DropdownMenu.Item>
                        <TruckIcon class="mr-2 size-4" />
                        Update Status
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item class="text-red-600">Cancel Order</DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
              </div>

              <!-- Expanded Details -->
              {#if expandedOrder === order.id}
                <div
                  class="bg-muted/30 border-t px-4 py-4"
                  transition:slide={{ duration: 200, easing: cubicOut }}
                >
                  <div class="grid gap-6 md:grid-cols-2">
                    <!-- Items -->
                    <div>
                      <h4
                        class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase"
                      >
                        Items
                      </h4>
                      <div class="space-y-2">
                        {#each order.items as item}
                          <div
                            class="bg-background flex items-center justify-between rounded-md p-2 text-sm"
                          >
                            <div class="flex items-center gap-3">
                              <div class="bg-muted flex size-8 items-center justify-center rounded">
                                <PackageIcon class="text-muted-foreground size-4" />
                              </div>
                              <div>
                                <p class="font-medium">{item.name}</p>
                                <p class="text-muted-foreground text-xs">
                                  {item.sku} × {item.quantity}
                                </p>
                              </div>
                            </div>
                            <Pricing cents={item.price * item.quantity} country={shop.country} />
                          </div>
                        {/each}
                      </div>
                    </div>

                    <!-- Shipping & Notes -->
                    <div class="space-y-4">
                      <div>
                        <h4
                          class="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase"
                        >
                          Shipping
                        </h4>
                        <div class="bg-background rounded-md p-3 text-sm">
                          <div class="flex items-center justify-between">
                            <span class="text-muted-foreground">Method</span>
                            <span class="font-medium">{order.shipping.method}</span>
                          </div>
                          <div class="mt-1 flex items-center justify-between">
                            <span class="text-muted-foreground">Cost</span>
                            <Pricing cents={order.shipping.cost} country={shop.country} />
                          </div>
                          {#if order.shipping.tracking}
                            <div class="mt-1 flex items-center justify-between">
                              <span class="text-muted-foreground">Tracking</span>
                              <span class="font-mono text-xs">{order.shipping.tracking}</span>
                            </div>
                          {/if}
                        </div>
                      </div>

                      {#if order.notes}
                        <div>
                          <h4
                            class="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase"
                          >
                            Customer Notes
                          </h4>
                          <p class="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                            {order.notes}
                          </p>
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </Card.Root>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Order Details Dialog -->
<Dialog.Root bind:open={isDetailsOpen}>
  <Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
    {#if selectedOrder}
      <Dialog.Header>
        <div class="flex items-center gap-3">
          <Dialog.Title class="text-xl">{selectedOrder.id}</Dialog.Title>
          <span
            class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase {getStatusStyles(
              selectedOrder.status
            )}"
          >
            {selectedOrder.status}
          </span>
        </div>
        <Dialog.Description>
          Placed on {formatDate(selectedOrder.date)}
        </Dialog.Description>
      </Dialog.Header>

      <div class="grid gap-6 py-4">
        <!-- Customer Info -->
        <div>
          <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            Customer
          </h4>
          <div class="flex items-center gap-3 rounded-md border p-3">
            <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
              <span class="text-primary text-sm font-semibold">
                {selectedOrder.customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p class="font-medium">{selectedOrder.customer.name}</p>
              <p class="text-muted-foreground text-sm">{selectedOrder.customer.email}</p>
            </div>
          </div>
        </div>

        <!-- Order Items -->
        <div>
          <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            Order Items
          </h4>
          <div class="rounded-md border">
            {#each selectedOrder.items as item, i}
              <div
                class="flex items-center justify-between p-3 {i !== selectedOrder.items.length - 1
                  ? 'border-b'
                  : ''}"
              >
                <div class="flex items-center gap-3">
                  <div class="bg-muted flex size-10 items-center justify-center rounded">
                    <PackageIcon class="text-muted-foreground size-5" />
                  </div>
                  <div>
                    <p class="font-medium">{item.name}</p>
                    <p class="text-muted-foreground text-sm">{item.sku}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-muted-foreground text-sm">× {item.quantity}</p>
                  <Pricing cents={item.price} country={shop.country} priceClass="font-medium" />
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Order Summary -->
        <div>
          <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            Order Summary
          </h4>
          <div class="space-y-2 rounded-md border p-3 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Subtotal</span>
              <Pricing
                cents={selectedOrder.total - selectedOrder.shipping.cost}
                country={shop.country}
              />
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Shipping ({selectedOrder.shipping.method})</span>
              <Pricing cents={selectedOrder.shipping.cost} country={shop.country} />
            </div>
            <div class="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <Pricing cents={selectedOrder.total} country={shop.country} />
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-muted-foreground">Payment Status</span>
              <span class="{getPaymentStatusStyles(selectedOrder.paymentStatus)} capitalize"
                >{selectedOrder.paymentStatus}</span
              >
            </div>
          </div>
        </div>

        <!-- Shipping Details -->
        <div>
          <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            Shipping Details
          </h4>
          <div class="space-y-2 rounded-md border p-3 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Shipping Method</span>
              <span class="font-medium">{selectedOrder.shipping.method}</span>
            </div>
            {#if selectedOrder.shipping.tracking}
              <div class="flex justify-between">
                <span class="text-muted-foreground">Tracking Number</span>
                <span class="font-mono text-xs">{selectedOrder.shipping.tracking}</span>
              </div>
            {:else}
              <div class="flex justify-between">
                <span class="text-muted-foreground">Tracking Number</span>
                <span class="text-muted-foreground italic">Not available yet</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Notes -->
        {#if selectedOrder.notes}
          <div>
            <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Customer Notes
            </h4>
            <div class="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              {selectedOrder.notes}
            </div>
          </div>
        {/if}
      </div>

      <Dialog.Footer class="gap-2">
        <Button variant="outline" onclick={() => (isDetailsOpen = false)}>Close</Button>
        <Button class="gap-2">
          <TruckIcon class="size-4" />
          Update Status
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
