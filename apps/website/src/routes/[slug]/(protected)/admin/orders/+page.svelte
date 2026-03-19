<script lang="ts">
  import { CalendarDate, type DateValue } from "@internationalized/date";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import CreditCardIcon from "@lucide/svelte/icons/credit-card";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import SearchIcon from "@lucide/svelte/icons/search";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Dialog from "@repo/ui/dialog";
  import { Input } from "@repo/ui/input";
  import * as Popover from "@repo/ui/popover";
  import { RangeCalendar } from "@repo/ui/range-calendar";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import { createInfiniteQuery, createQuery } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";

  import Pricing from "$lib/components/Pricing.svelte";
  import StatsCard from "$lib/components/cards/StatsCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { ordersFilterSchema } from "$lib/search_param";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  type ApiOrder = {
    id: string;
    customerName: string | null;
    customerPhone: string | null;
    subtotalCents: number;
    discountCents: number;
    totalCents: number;
    itemsCount: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  const searchParams = useSearchParams(ordersFilterSchema);
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);
  const debouncedDateFrom = new Debounced(() => searchParams.dateFrom, 300);
  const debouncedDateTo = new Debounced(() => searchParams.dateTo, 300);

  const orders = createInfiniteQuery(() =>
    orpc.orders.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        cursor,
        slug: params.slug,
        search: debouncedSearch.current || undefined,
        dateFrom: debouncedDateFrom.current || undefined,
        dateTo: debouncedDateTo.current || undefined,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!params.slug,
    })
  );

  const allOrders = $derived(orders.data?.pages.flatMap((page) => page.items) ?? []);

  let selectedOrderId = $state<string | null>(null);
  let isDetailsOpen = $state(false);

  const orderDetails = createQuery(() =>
    orpc.orders.get.queryOptions({
      input: { slug: params.slug, orderId: selectedOrderId! },
      enabled: !!selectedOrderId,
    })
  );

  const stats = $derived(() => {
    const total = allOrders.length;
    const revenue = allOrders.reduce((sum, o) => sum + o.totalCents, 0);

    return { total, revenue };
  });

  const hasFilters = $derived(
    searchParams.search.length > 0 ||
      searchParams.dateFrom.length > 0 ||
      searchParams.dateTo.length > 0
  );

  function resetFilters() {
    searchParams.update({ search: "", dateFrom: "", dateTo: "" });
    dateRange = { start: null, end: null };
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
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

  function formatOrderId(id: string) {
    return id.slice(-8).toUpperCase();
  }

  function openOrderDetails(order: ApiOrder) {
    selectedOrderId = order.id;
    isDetailsOpen = true;
  }

  function formatDateRange(): string {
    if (searchParams.dateFrom && searchParams.dateTo) {
      const from = new Date(searchParams.dateFrom);
      const to = new Date(searchParams.dateTo);
      const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
      return `${fmt.format(from)} - ${fmt.format(to)}`;
    }
    return "All Dates";
  }

  function parseDateValue(dateStr: string): DateValue | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  let dateRange = $state<{ start: DateValue | null; end: DateValue | null }>({
    start: parseDateValue(searchParams.dateFrom),
    end: parseDateValue(searchParams.dateTo),
  });

  function handleDateRangeChange(
    value: { start: DateValue | undefined; end: DateValue | undefined } | undefined
  ) {
    if (value?.start && value?.end) {
      dateRange = { start: value.start as DateValue, end: value.end as DateValue };
      searchParams.update({
        dateFrom: (value.start as CalendarDate).toString(),
        dateTo: (value.end as CalendarDate).toString(),
      });
    } else if (value?.start && !value?.end) {
      dateRange = { start: value.start as DateValue, end: null };
    } else {
      dateRange = { start: null, end: null };
    }
  }
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[{ label: "Dashboard", href: `/${shop.slug}/admin` }, { label: "Orders" }]}
  >
    {#snippet actions()}
      <Button variant="outline" size="sm" class="gap-2">
        <DownloadIcon class="size-4" />
        Export
      </Button>
    {/snippet}
  </AdminDashboardHeader>

  <div>
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">Orders</h1>
      <p class="text-muted-foreground text-sm">Manage and track all your shop orders</p>
    </div>
  </div>

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatsCard
      title="Total Orders"
      value={stats().total}
      description="All time orders"
      icon={ShoppingBagIcon}
      iconBgClass="bg-primary/10"
      iconTextClass="text-primary"
      borderClass="from-primary/20 to-primary/5"
    />
    <StatsCard
      title="Today"
      value={0}
      description="Orders today"
      icon={ReceiptIcon}
      iconBgClass="bg-amber-500/10"
      iconTextClass="text-amber-600"
      borderClass="from-amber-500/20 to-amber-500/5"
    />
    <StatsCard
      title="This Week"
      value={0}
      description="Orders this week"
      icon={PackageIcon}
      iconBgClass="bg-blue-500/10"
      iconTextClass="text-blue-600"
      borderClass="from-blue-500/20 to-blue-500/5"
    />
    <StatsCard
      title="Revenue"
      value=""
      description="Total revenue"
      icon={CreditCardIcon}
      iconBgClass="bg-emerald-500/10"
      iconTextClass="text-emerald-600"
      borderClass="from-emerald-500/20 to-emerald-500/5"
      price={stats().revenue}
      country={shop.country}
    />
  </div>

  <div class="flex flex-col items-center justify-start gap-2 lg:flex-row">
    <div class="flex w-full items-center gap-2 lg:max-w-md">
      <div class="relative w-full">
        <SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search orders, customers..."
          class="pl-9"
          value={searchParams.search}
          oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
        />
      </div>
    </div>

    <div class="flex items-center gap-2">
      <Popover.Root>
        <Popover.Trigger class={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}>
          <CalendarIcon class="size-4" />
          {formatDateRange()}
          <ChevronDownIcon class="size-3 opacity-50" />
        </Popover.Trigger>
        <Popover.Content class="w-auto p-0" align="start">
          {#key dateRange}
            <RangeCalendar
              value={dateRange.start && dateRange.end
                ? { start: dateRange.start, end: dateRange.end }
                : dateRange.start
                  ? { start: dateRange.start, end: null as unknown as CalendarDate }
                  : undefined}
              onValueChange={handleDateRangeChange}
              numberOfMonths={2}
            />
          {/key}
        </Popover.Content>
      </Popover.Root>

      {#if hasFilters}
        <Button variant="ghost" size="sm" onclick={resetFilters}>
          <XIcon class="size-4" />
          Reset
        </Button>
      {/if}
    </div>
  </div>

  <div class="flex flex-col gap-3">
    {#if orders.isLoading}
      <div class="flex items-center justify-center py-12">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if orders.isError}
      <div class="flex items-center justify-center py-12">
        <p class="text-red-500">Failed to load orders</p>
      </div>
    {:else if allOrders.length === 0}
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <ShoppingBagIcon class="text-muted-foreground size-8" />
        </div>
        <h3 class="text-lg font-semibold">No orders found</h3>
        <p class="text-muted-foreground max-w-sm text-sm">
          {hasFilters
            ? "Try adjusting your search or date filters"
            : "Orders will appear here when customers make purchases"}
        </p>
      </div>
    {:else}
      <div class="flex flex-col gap-3">
        {#each allOrders as order (order.id)}
          <Card.Root
            class="group hover:border-primary/30 cursor-pointer overflow-hidden py-0 transition-all duration-200 hover:shadow-md"
            onclick={() => openOrderDetails(order)}
          >
            <div class="flex items-center gap-4 p-4">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold">
                    {formatOrderId(order.id)}
                  </span>
                </div>
                <div class="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                  <CalendarIcon class="size-3" />
                  {formatDate(order.createdAt)}
                </div>
              </div>

              <div class="hidden min-w-0 flex-1 md:block">
                <p class="truncate text-sm font-medium">
                  {order.customerName ?? "In-store Purchase"}
                </p>
                <p class="text-muted-foreground truncate text-xs">{order.customerPhone ?? "—"}</p>
              </div>

              <div class="hidden text-center md:block">
                <p class="text-sm font-medium">{order.itemsCount}</p>
                <p class="text-muted-foreground text-xs">items</p>
              </div>

              <div class="text-right">
                <p class="text-sm font-semibold">
                  <Pricing cents={order.totalCents} country={shop.country} />
                </p>
                <p class="text-xs {getPaymentStatusStyles('paid')}">paid</p>
              </div>
            </div>
          </Card.Root>
        {/each}
      </div>

      {#if orders.hasNextPage}
        <div class="mt-4 flex justify-center">
          <Button
            variant="outline"
            onclick={() => orders.fetchNextPage()}
            disabled={orders.isFetchingNextPage}
          >
            {#if orders.isFetchingNextPage}
              <Loader2Icon class="mr-2 size-4 animate-spin" />
              Loading...
            {:else}
              Load More
            {/if}
          </Button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<Dialog.Root bind:open={isDetailsOpen}>
  <Dialog.Content class="flex max-h-[90vh] flex-col">
    {#if orderDetails.isLoading}
      <div class="flex items-center justify-center py-16">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if orderDetails.data}
      {@const order = orderDetails.data}
      <Dialog.Header class="flex-shrink-0">
        <div class="flex items-center gap-3">
          <Dialog.Title class="text-xl">Order #{formatOrderId(order.id)}</Dialog.Title>
        </div>
        <Dialog.Description>
          Placed on {formatDate(order.createdAt)}
        </Dialog.Description>
      </Dialog.Header>

      <div class="h-[66vh] overflow-hidden">
        <ScrollArea class="h-full">
          <div class="grid gap-6 py-4">
            <div>
              <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                Customer
              </h4>
              <div class="flex items-center gap-3 rounded-md border p-3">
                <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
                  <span class="text-primary text-sm font-semibold">
                    {order.customerName?.charAt(0).toUpperCase() ?? "I"}
                  </span>
                </div>
                <div>
                  <p class="font-medium">{order.customerName ?? "In-store Purchase"}</p>
                  <p class="text-muted-foreground text-sm">{order.customerPhone ?? "—"}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                Order Items
              </h4>
              <div class="rounded-md border">
                {#each order.items as item, i}
                  <div
                    class="flex items-center justify-between p-3 {i !== order.items.length - 1
                      ? 'border-b'
                      : ''}"
                  >
                    <div class="flex items-center gap-3">
                      <div class="bg-muted flex size-10 items-center justify-center rounded">
                        <PackageIcon class="text-muted-foreground size-5" />
                      </div>
                      <div>
                        <p>{item.product?.name}</p>
                        <p class="text-muted-foreground text-sm">{item.product?.sku ?? "—"}</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-muted-foreground text-sm">x {item.qty}</p>
                      <Pricing cents={item.lineTotalCents} country={shop.country} />
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <div>
              <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                Order Summary
              </h4>
              <div class="space-y-2 rounded-md border p-3">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Subtotal</span>
                  <Pricing cents={order.subtotalCents} country={shop.country} />
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Discount</span>
                  <Pricing cents={order.discountCents} country={shop.country} />
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Shipping (Local pickup)</span>
                  <Pricing cents={0} country={shop.country} />
                </div>
                <div class="flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <Pricing cents={order.totalCents} country={shop.country} />
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-muted-foreground">Payment Status</span>
                  <span class="{getPaymentStatusStyles('paid')} capitalize">paid</span>
                </div>
              </div>
            </div>

            {#if order.notes}
              <div>
                <h4
                  class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase"
                >
                  Customer Notes
                </h4>
                <div class="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  {order.notes}
                </div>
              </div>
            {/if}
          </div>
        </ScrollArea>
      </div>

      <Dialog.Footer class="flex-shrink-0 gap-2">
        <Button variant="outline" onclick={() => (isDetailsOpen = false)}>Close</Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
