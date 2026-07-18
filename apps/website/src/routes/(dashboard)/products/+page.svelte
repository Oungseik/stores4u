<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
  import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
  import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import ListIcon from "@lucide/svelte/icons/list";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import XCircleIcon from "@lucide/svelte/icons/x-circle";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { Skeleton } from "@repo/ui/skeleton";
  import { ToggleGroup, ToggleGroupItem } from "@repo/ui/toggle-group";
  import {
    createInfiniteQuery,
    createMutation,
    createQuery,
    useQueryClient,
  } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";
  import { toast } from "svelte-sonner";

  import { goto } from "$app/navigation";

  import StockAdjustmentDialog from "$lib/components/StockAdjustmentDialog.svelte";
  import StatsCard from "$lib/components/cards/StatsCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import DataTable from "$lib/components/tables/DataTable.svelte";
  import { createColumns } from "$lib/components/tables/products/columns";
  import { orpc } from "$lib/orpc_client";
  import { type ProductsView, productsFilterSchema } from "$lib/search_param";
  import { formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();
  const queryClient = useQueryClient();

  const searchParams = useSearchParams(productsFilterSchema, { noScroll: true });
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);
  // JSON.stringify via $derived prevents false reactive triggers:
  // useSearchParams re-parses arrays from URL on every read (new reference each time),
  // and update() writes #localCache twice (direct + URL sync). $derived with string
  // comparison deduplicates these, so Debounced only fires when the value actually changes.
  const categoriesKey = $derived(JSON.stringify(searchParams.categories ?? []));
  const debouncedCategories = new Debounced(() => categoriesKey, 1000);

  const deleteMutation = createMutation(() =>
    orpc.products.delete.mutationOptions({
      onSuccess: () => {
        toast.success(msg.ui_product_deleted_successfully());
        queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
      },
      onError: (error) => {
        toast.error(localizeError(error, "ui_failed_to_delete_product"));
      },
    }),
  );

  function handleDeleteProduct(id: string) {
    confirmDelete({
      title: msg.ui_delete_product(),
      description: msg.ui_are_you_sure_you_want_to_delete_this_product_this_actio(),
      onConfirm: async () => {
        await deleteMutation.mutateAsync({ id });
      },
    });
  }

  const products = createInfiniteQuery(() =>
    orpc.products.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        cursor,
        search: debouncedSearch.current || undefined,
        categories: (() => {
          const c = JSON.parse(debouncedCategories.current) as string[];
          return c.length > 0 ? c : undefined;
        })(),
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: true,
    }),
  );

  const allProducts = $derived(products.data?.pages.flatMap((page) => page.items) ?? []);
  const categories = createQuery(() =>
    orpc.categories.list.queryOptions({
      input: { pageSize: 100 },
      enabled: true,
    }),
  );

  const productStats = createQuery(() =>
    orpc.products.stats.queryOptions({
      input: {},
      enabled: true,
    }),
  );

  const columns = $derived(createColumns(shop.currency, handleDeleteProduct, handleAdjustProduct));
  const hasFilters = $derived(searchParams.search.length > 0 || searchParams.categories.length > 0);

  function resetFilters() {
    searchParams.update({ search: "", categories: [] });
  }

  let adjustProduct = $state<{
    id: string;
    name: string;
    stock: number;
    lastCostCents: number | null;
  } | null>(null);
  function handleAdjustProduct(
    id: string,
    name: string,
    stock: number,
    lastCostCents: number | null,
  ) {
    adjustProduct = { id, name, stock, lastCostCents };
  }
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[{ label: msg.ui_dashboard(), href: `/` }, { label: msg.ui_products() }]}
  >
    {#snippet actions()}
      <a href={localizePath("/products/add")} class={buttonVariants()}>
        <PlusIcon class="size-4" />
        {msg.ui_add_product()}
      </a>
    {/snippet}
  </AdminDashboardHeader>

  {#if productStats.isLoading}
    <div
      class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 xl:grid xl:grid-cols-4 xl:overflow-x-visible"
    >
      {#each { length: 4 } as _}
        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
          <Card.Root class="h-[170px]">
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
    </div>
  {:else if productStats.data}
    <div
      class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 xl:grid xl:grid-cols-4 xl:overflow-x-visible"
    >
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title={msg.ui_total_products()}
          value={productStats.data.total}
          description={msg.ui_in_your_catalog()}
          icon={PackageIcon}
          iconBgClass="bg-primary/10"
          iconTextClass="text-primary"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title={msg.ui_low_stock()}
          value={productStats.data.lowStock}
          description={msg.ui_needs_restocking()}
          icon={AlertTriangleIcon}
          iconBgClass="bg-amber-500/10"
          iconTextClass="text-amber-600"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title={msg.ui_out_of_stock()}
          value={productStats.data.outOfStock}
          description={msg.ui_unavailable()}
          icon={XCircleIcon}
          iconBgClass="bg-red-500/10"
          iconTextClass="text-red-600"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title={msg.ui_inventory_value()}
          value=""
          description={msg.ui_total_retail_value()}
          icon={DollarSignIcon}
          iconBgClass="bg-emerald-500/10"
          iconTextClass="text-emerald-600"
          price={productStats.data.inventoryValueRetailCents}
          currency={shop.currency}
        />
      </div>
    </div>
  {/if}

  <section class="@container/main space-y-6">
    <!-- Filters and Search -->
    <FilterBar.Root {hasFilters} onReset={resetFilters} class="justify-between">
      <div class="flex flex-1 flex-wrap items-center justify-start gap-2 md:gap-4">
        <FilterBar.Search
          placeholder={msg.ui_search_products_sku()}
          value={searchParams.search}
          oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
        />

        <FilterBar.CheckboxGroup
          items={(categories.data?.items ?? []).map((c) => ({
            value: c.name,
            label: c.name,
          }))}
          value={searchParams.categories}
          onValueChange={(value) => searchParams.update({ categories: value })}
          placeholder={msg.ui_all_categories()}
        />

        <FilterBar.Reset />
      </div>

      <ToggleGroup
        type="single"
        value={searchParams.view}
        onValueChange={(value) => {
          if (value && (value === "card" || value === "table")) {
            searchParams.update({ view: value as ProductsView });
          }
        }}
        variant="outline"
        size="sm"
        class="shrink-0"
      >
        <ToggleGroupItem value="card" aria-label={msg.ui_card_view()}>
          <LayoutGridIcon class="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label={msg.ui_table_view()}>
          <ListIcon class="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </FilterBar.Root>

    {#if products.isLoading}
      <div class="flex items-center justify-center py-12">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if products.isError}
      <div class="flex items-center justify-center py-12">
        <p class="text-red-500">{msg.ui_failed_to_load_products()}</p>
      </div>
    {:else if allProducts.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <PackageIcon class="text-muted-foreground size-8" />
        </div>
        <h3 class="text-lg font-semibold">{msg.ui_no_products_found()}</h3>
        <p class="text-muted-foreground max-w-sm text-sm">
          {hasFilters
            ? msg.ui_try_clearing_filters()
            : msg.ui_add_your_first_product_to_get_started()}
        </p>
      </div>
    {:else if searchParams.view === "table"}
      <DataTable
        {columns}
        data={allProducts}
        loading={false}
        onRowClick={(product) => goto(localizePath(`/products/${product.id}`))}
      />

      {#if products.hasNextPage}
        <div class="mt-4 flex justify-center">
          <Button
            variant="outline"
            onclick={() => products.fetchNextPage()}
            disabled={products.isFetchingNextPage}
          >
            {#if products.isFetchingNextPage}
              <Loader2Icon class="mr-2 size-4 animate-spin" />
              {msg.ui_loading_b04ba49()}
            {:else}
              {msg.ui_load_more()}
            {/if}
          </Button>
        </div>
      {/if}
    {:else}
      <div
        class="grid grid-cols-2 gap-3 xl:gap-4 @[520px]/main:grid-cols-3 @[720px]/main:grid-cols-4"
      >
        {#each allProducts as product (product.id)}
          {@const marginPercent =
            product.lastCostCents && product.lastCostCents > 0
              ? Math.round(
                  ((product.priceCents - product.lastCostCents) / product.lastCostCents) * 100,
                )
              : null}
          {@const stockStatus =
            product.stock === 0
              ? "out"
              : product.stock <= (product.lowStockThreshold ?? 10)
                ? "low"
                : "ok"}

          <Card.Root class="group overflow-hidden p-0">
            <a href={localizePath(`/products/${product.id}`)} class="block">
              <div class="bg-muted/40 relative aspect-[3/2] overflow-hidden">
                {#if product.image}
                  <img
                    src={product.image}
                    alt={product.name}
                    class="size-full object-cover transition-transform group-hover:scale-105"
                  />
                {:else}
                  <div class="flex size-full items-center justify-center">
                    <PackageIcon class="text-muted-foreground/40 size-10" />
                  </div>
                {/if}
                {#if stockStatus !== "ok"}
                  <span
                    class={[
                      "absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      stockStatus === "out"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    ]}
                  >
                    {stockStatus === "out"
                      ? msg.ui_out_of_stock_8b78c7a()
                      : msg.ui_low_stock_a6e1fef()}
                  </span>
                {/if}
                <div class="absolute top-2 right-2">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger
                      class={buttonVariants({ variant: "secondary", size: "icon" }) +
                        " size-7 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"}
                      onclick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <MoreVerticalIcon class="size-3.5" />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item>
                        <a
                          href={localizePath(`/products/${product.id}/edit`)}
                          class="flex w-full items-center gap-2"
                        >
                          <PencilIcon class="size-4" />
                          {msg.ui_edit()}
                        </a>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onclick={() =>
                          handleAdjustProduct(
                            product.id,
                            product.name,
                            product.stock,
                            product.lastCostCents,
                          )}
                      >
                        <ArrowUpDownIcon class="size-4" />
                        {msg.ui_adjust_stock()}
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        class="text-destructive"
                        onclick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2Icon class="size-4" />
                        {msg.ui_delete()}
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
              </div>

              <div class="flex flex-col gap-1.5 p-3">
                <div class="flex items-center justify-between gap-1">
                  <p class="truncate text-sm leading-tight font-medium">{product.name}</p>
                  <span class="text-muted-foreground text-xs">{product.stock} left</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm">
                    {formatPrice(product.priceCents, shop.currency)}
                  </span>
                  {#if product.lastCostCents != null && marginPercent != null}
                    <div class="flex items-center gap-1.5">
                      <span class="text-muted-foreground text-xs">
                        Cost {formatPrice(product.lastCostCents, shop.currency)}
                      </span>
                      <span
                        class={[
                          "inline-flex rounded px-1 py-px text-[10px] leading-none font-semibold",
                          marginPercent > 0
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : marginPercent === 0
                              ? "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                        ]}
                      >
                        {marginPercent > 0 ? "+" : ""}{marginPercent}%
                      </span>
                    </div>
                  {/if}
                </div>
              </div>
            </a>
          </Card.Root>
        {/each}
      </div>

      {#if products.hasNextPage}
        <div class="mt-4 flex justify-center">
          <Button
            variant="outline"
            onclick={() => products.fetchNextPage()}
            disabled={products.isFetchingNextPage}
          >
            {#if products.isFetchingNextPage}
              <Loader2Icon class="mr-2 size-4 animate-spin" />
              {msg.ui_loading_b04ba49()}
            {:else}
              {msg.ui_load_more()}
            {/if}
          </Button>
        </div>
      {/if}
    {/if}
  </section>

  {#if adjustProduct}
    <StockAdjustmentDialog
      open={true}
      onClose={() => (adjustProduct = null)}
      productId={adjustProduct.id}
      productName={adjustProduct.name}
      currentStock={adjustProduct.stock}
      lastCostCents={adjustProduct.lastCostCents}
    />
  {/if}
</div>
