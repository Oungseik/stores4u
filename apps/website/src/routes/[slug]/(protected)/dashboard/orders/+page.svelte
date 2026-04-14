<script lang="ts">
  import { CalendarDate, type DateValue } from "@internationalized/date";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Dialog from "@repo/ui/dialog";
  import type { FilterBarDateRange } from "@repo/ui/filter-bar";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import { Skeleton } from "@repo/ui/skeleton";
  import { createInfiniteQuery, createQuery } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";

  import Pricing from "$lib/components/Pricing.svelte";
  import StatsCard from "$lib/components/cards/StatsCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { ordersFilterSchema } from "$lib/search_param";
  import { formatDate } from "$lib/utils";

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

  const searchParams = useSearchParams(ordersFilterSchema, { noScroll: true });
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

  const orderStats = createQuery(() =>
    orpc.orders.stats.queryOptions({
      input: { slug: params.slug },
      enabled: !!params.slug,
    })
  );

  const isLoading = $derived(orderStats.isLoading);

  const hasFilters = $derived(
    searchParams.search.length > 0 ||
      searchParams.dateFrom.length > 0 ||
      searchParams.dateTo.length > 0
  );

  function resetFilters() {
    searchParams.update({ search: "", dateFrom: "", dateTo: "" });
  }

  function parseDate(dateStr: string): DateValue | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  const dateValue = $derived({
    start: parseDate(searchParams.dateFrom),
    end: parseDate(searchParams.dateTo),
  });

  function handleDateRangeChange(value: FilterBarDateRange) {
    searchParams.update({
      dateFrom: value.start ? value.start.toString() : "",
      dateTo: value.end ? value.end.toString() : "",
    });
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
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[{ label: "Dashboard", href: `/${shop.slug}/dashboard` }, { label: "Orders" }]}
  />

  <div class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold tracking-tight">Orders</h1>
    <p class="text-muted-foreground text-sm">View and manage customer orders</p>
  </div>

  <ScrollArea orientation="horizontal" class="w-full">
    <div class="flex snap-x gap-4 pb-4 xl:grid xl:grid-cols-4">
      {#if isLoading}
        {#each { length: 3 } as _}
          <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton class="h-4 w-24" />
                <Skeleton class="size-8 rounded-md" />
              </Card.Header>
              <Card.Content class="flex flex-col gap-2">
                <Skeleton class="h-7 w-28" />
                <Skeleton class="h-3 w-20" />
              </Card.Content>
            </Card.Root>
          </div>
        {/each}
      {:else if orderStats.data}
        {#each [{ title: "Today", stats: orderStats.data.today, description: "Today's revenue", icon: ReceiptIcon, iconBgClass: "bg-amber-500/10", iconTextClass: "text-amber-600", borderClass: "from-amber-500/20 to-amber-500/5" }, { title: "This Week", stats: orderStats.data.thisWeek, description: "This week's revenue", icon: PackageIcon, iconBgClass: "bg-blue-500/10", iconTextClass: "text-blue-600", borderClass: "from-blue-500/20 to-blue-500/5" }, { title: "This Month", stats: orderStats.data.thisMonth, description: "This month's revenue", icon: CalendarIcon, iconBgClass: "bg-emerald-500/10", iconTextClass: "text-emerald-600", borderClass: "from-emerald-500/20 to-emerald-500/5" }] as card}
          <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
            <StatsCard
              title={card.title}
              price={card.stats.totalCents}
              country={shop.country}
              priceClass="text-2xl font-bold"
              description={card.description}
              icon={card.icon}
              iconBgClass={card.iconBgClass}
              iconTextClass={card.iconTextClass}
              borderClass={card.borderClass}
            ></StatsCard>
          </div>
        {/each}
      {/if}
    </div>
  </ScrollArea>

  <section class="space-y-6">
    <FilterBar.Root {hasFilters} onReset={resetFilters}>
      <FilterBar.Search
        placeholder="Search orders, customers..."
        value={searchParams.search}
        oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
      />

      <FilterBar.DatePicker value={dateValue} onValueChange={handleDateRangeChange} />

      <FilterBar.Reset />
    </FilterBar.Root>

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
        <div class="space-y-2">
          {#each allOrders as order (order.id)}
            <Card.Root class="overflow-hidden p-0">
              <Card.Content class="p-0">
                <button
                  class="hover:bg-muted/50 flex w-full items-center gap-3 px-3 py-2.5"
                  onclick={() => openOrderDetails(order)}
                >
                  <div
                    class="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg"
                  >
                    <ReceiptIcon class="text-primary size-5" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="truncate text-left text-sm font-medium">
                      {order.customerName ?? "In-store Purchase"}
                    </p>
                    <div class="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
                      <span class="font-semibold">#{formatOrderId(order.id)}</span>
                      <span>•</span>
                      <span>{formatDate(order.createdAt, true)}</span>
                      <span class="hidden sm:inline">•</span>
                      <span class="hidden sm:inline">{order.itemsCount} items</span>
                    </div>
                  </div>

                  <div class="shrink-0 text-right">
                    <p class="text-sm font-semibold">
                      <Pricing cents={order.totalCents} country={shop.country} />
                    </p>
                    <p class="text-xs {getPaymentStatusStyles('paid')}">paid</p>
                  </div>
                </button>
              </Card.Content>
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
  </section>
</div>

<Dialog.Root bind:open={isDetailsOpen}>
  <Dialog.Content class="flex max-h-[90vh] max-w-xl flex-col">
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
          Placed on {formatDate(order.createdAt, true)}
        </Dialog.Description>
      </Dialog.Header>

      <div class="h-[66vh] overflow-hidden">
        <ScrollArea class="h-full pr-2.5">
          <div class="grid gap-6 py-4">
            <div>
              <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                Customer
              </h4>
              <div class="flex items-center gap-3 rounded-md border p-3 text-sm">
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
              <div class="rounded-md border text-sm">
                {#each order.items as item, i}
                  <div
                    class="flex items-center justify-between p-2.5 {i !== order.items.length - 1
                      ? 'border-b'
                      : ''}"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="bg-muted flex size-8 items-center justify-center rounded">
                        <PackageIcon class="text-muted-foreground size-4" />
                      </div>
                      <div>
                        <p>{item.product?.name}</p>
                        <p class="text-muted-foreground text-xs">{item.product?.sku ?? "—"}</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-muted-foreground text-xs">x {item.qty}</p>
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
              <div class="space-y-1.5 rounded-md border p-2.5 text-sm">
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
        <Button variant="outline" class="mr-2" onclick={() => (isDetailsOpen = false)}>Close</Button
        >
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
