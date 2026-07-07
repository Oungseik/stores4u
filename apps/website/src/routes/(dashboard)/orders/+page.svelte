<script lang="ts">
  import { parseDate } from "@internationalized/date";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import type { FilterBarDateRange } from "@repo/ui/filter-bar";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import { Skeleton } from "@repo/ui/skeleton";
  import { createInfiniteQuery, createQuery } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";
  import StatsCard from "$lib/components/cards/StatsCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { ordersFilterSchema } from "$lib/search_param";
  import { formatDate, formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();

  const searchParams = useSearchParams(ordersFilterSchema, { noScroll: true });
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);
  const debouncedDateFrom = new Debounced(() => searchParams.dateFrom, 300);
  const debouncedDateTo = new Debounced(() => searchParams.dateTo, 300);

  const orders = createInfiniteQuery(() =>
    orpc.orders.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        cursor,
        search: debouncedSearch.current || undefined,
        dateFrom: debouncedDateFrom.current || undefined,
        dateTo: debouncedDateTo.current || undefined,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: true,
    }),
  );

  const allOrders = $derived(orders.data?.pages.flatMap((page) => page.items) ?? []);

  const orderStats = createQuery(() =>
    orpc.orders.stats.queryOptions({
      input: {},
      enabled: true,
    }),
  );

  const isLoading = $derived(orderStats.isLoading);

  const hasFilters = $derived(
    searchParams.search.length > 0 ||
      searchParams.dateFrom.length > 0 ||
      searchParams.dateTo.length > 0,
  );

  function resetFilters() {
    searchParams.update({ search: "", dateFrom: "", dateTo: "" });
  }

  const dateValue = $derived({
    start: searchParams.dateFrom ? parseDate(searchParams.dateFrom) : null,
    end: searchParams.dateTo ? parseDate(searchParams.dateTo) : null,
  });

  function handleDateRangeChange(value: FilterBarDateRange) {
    searchParams.update({
      dateFrom: value.start ? value.start.toString() : "",
      dateTo: value.end ? value.end.toString() : "",
    });
  }

  function formatOrderId(id: string) {
    return id.slice(-8).toUpperCase();
  }
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader breadcrumbs={[{ label: "Dashboard", href: `/` }, { label: "Orders" }]}>
    {#snippet actions()}
      <a href="/cart" class={buttonVariants()}>
        <PlusIcon class="size-4" />
        New Sale
      </a>
    {/snippet}
  </AdminDashboardHeader>

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
              <Card.Header class="flex flex-row items-center justify-between space-y-0">
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
        {@const stats = [
          {
            title: "Today",
            stats: orderStats.data.today,
            description: "Today's revenue",
            icon: ReceiptIcon,
            iconBgClass: "bg-amber-500/10",
            iconTextClass: "text-amber-600",
          },
          {
            title: "This Week",
            stats: orderStats.data.thisWeek,
            description: "This week's revenue",
            icon: PackageIcon,
            iconBgClass: "bg-blue-500/10",
            iconTextClass: "text-blue-600",
          },
          {
            title: "This Month",
            stats: orderStats.data.thisMonth,
            description: "This month's revenue",
            icon: CalendarIcon,
            iconBgClass: "bg-emerald-500/10",
            iconTextClass: "text-emerald-600",
          },
        ]}
        {#each stats as card}
          <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
            <StatsCard
              title={card.title}
              price={card.stats.totalCents}
              currency={shop.currency}
              priceClass="text-2xl font-bold"
              description={card.description}
              icon={card.icon}
              iconBgClass={card.iconBgClass}
              iconTextClass={card.iconTextClass}
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
                <a
                  href={`/orders/${order.id}`}
                  class="hover:bg-muted/50 flex w-full items-center gap-3 px-3 py-2.5"
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
                      {formatPrice(order.totalCents, shop.currency)}
                    </p>
                    <p class="text-xs text-emerald-600">paid</p>
                  </div>
                </a>
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
