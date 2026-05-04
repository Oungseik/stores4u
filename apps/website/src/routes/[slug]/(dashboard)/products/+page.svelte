<script lang="ts">
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
  import ProductDialog from "$lib/components/ProductDialog.svelte";
  import StockAdjustmentDialog from "$lib/components/StockAdjustmentDialog.svelte";
  import StatsCard from "$lib/components/cards/StatsCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import DataTable from "$lib/components/tables/DataTable.svelte";
  import { createColumns } from "$lib/components/tables/products/columns";
  import { orpc } from "$lib/orpc_client";
  import { type ProductsView, productsFilterSchema } from "$lib/search_param";
  import { formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();
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
        toast.success("Product deleted successfully");
        queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete product");
      },
    })
  );

  function handleDeleteProduct(id: string) {
    confirmDelete({
      title: "Delete Product",
      description: "Are you sure you want to delete this product? This action cannot be undone.",
      onConfirm: async () => {
        await deleteMutation.mutateAsync({ slug: params.slug, id });
      },
    });
  }

  const products = createInfiniteQuery(() =>
    orpc.products.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        cursor,
        slug: params.slug,
        search: debouncedSearch.current || undefined,
        categories: (() => {
          const c = JSON.parse(debouncedCategories.current) as string[];
          return c.length > 0 ? c : undefined;
        })(),
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!params.slug,
    })
  );

  const allProducts = $derived(products.data?.pages.flatMap((page) => page.items) ?? []);
  const categories = createQuery(() =>
    orpc.categories.list.queryOptions({
      input: { slug: params.slug, pageSize: 100 },
      enabled: !!params.slug,
    })
  );

  const productStats = createQuery(() =>
    orpc.products.stats.queryOptions({
      input: { slug: params.slug },
      enabled: !!params.slug,
    })
  );

  const columns = $derived(
    createColumns(
      shop.country,
      params.slug,
      handleDeleteProduct,
      handleAdjustProduct,
      handleEditProduct
    )
  );
  const hasFilters = $derived(searchParams.search.length > 0 || searchParams.categories.length > 0);

  function resetFilters() {
    searchParams.update({ search: "", categories: [] });
  }

  let adjustProduct = $state<{ id: string; name: string; stock: number } | null>(null);
  let productDialog = $state<{ productId?: string } | null>(null);

  function handleAdjustProduct(id: string, name: string, stock: number) {
    adjustProduct = { id, name, stock };
  }

  function handleEditProduct(id: string) {
    productDialog = { productId: id };
  }
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[{ label: "Dashboard", href: `/${shop.slug}` }, { label: "Products" }]}
  >
    {#snippet actions()}
      <Button onclick={() => (productDialog = {})}>
        <PlusIcon class="size-4" /> Add Product
      </Button>
    {/snippet}
  </AdminDashboardHeader>

  <div class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold tracking-tight">Products</h1>
    <p class="text-muted-foreground text-sm">
      Manage your product catalog, track stock levels, and organize items
    </p>
  </div>

  {#if productStats.isLoading}
    <div
      class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 xl:grid xl:grid-cols-4 xl:overflow-x-visible"
    >
      {#each { length: 4 } as _}
        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
          <Card.Root class="h-[170px]">
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
    </div>
  {:else if productStats.data}
    <div
      class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 xl:grid xl:grid-cols-4 xl:overflow-x-visible"
    >
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title="Total Products"
          value={productStats.data.total}
          description="In your catalog"
          icon={PackageIcon}
          iconBgClass="bg-primary/10"
          iconTextClass="text-primary"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title="Low Stock"
          value={productStats.data.lowStock}
          description="Needs restocking"
          icon={AlertTriangleIcon}
          iconBgClass="bg-amber-500/10"
          iconTextClass="text-amber-600"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title="Out of Stock"
          value={productStats.data.outOfStock}
          description="Unavailable"
          icon={XCircleIcon}
          iconBgClass="bg-red-500/10"
          iconTextClass="text-red-600"
        />
      </div>
      <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
        <StatsCard
          title="Inventory Value"
          value=""
          description="Total retail value"
          icon={DollarSignIcon}
          iconBgClass="bg-emerald-500/10"
          iconTextClass="text-emerald-600"
          price={productStats.data.inventoryValueRetailCents}
          country={shop.country}
        />
      </div>
    </div>
  {/if}

  <section class="space-y-6">
    <!-- Filters and Search -->
    <FilterBar.Root {hasFilters} onReset={resetFilters} class="justify-between">
      <div class="flex flex-1 flex-wrap items-center justify-start gap-2 md:gap-4">
        <FilterBar.Search
          placeholder="Search products, SKU..."
          value={searchParams.search}
          oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
        />

        <FilterBar.CheckboxGroup
          items={(categories.data?.items ?? []).map((c) => ({
            value: c.name,
            label: c.name,
            count: c.productCount,
          }))}
          value={searchParams.categories}
          onValueChange={(value) => searchParams.update({ categories: value })}
          placeholder="All Categories"
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
        <ToggleGroupItem value="card" aria-label="Card view">
          <LayoutGridIcon class="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label="Table view">
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
        <p class="text-red-500">Failed to load products</p>
      </div>
    {:else if allProducts.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="bg-muted mb-3 flex size-12 items-center justify-center rounded-full">
          <PackageIcon class="text-muted-foreground size-6" />
        </div>
        <p class="text-muted-foreground">No products found</p>
      </div>
    {:else if searchParams.view === "table"}
      <DataTable
        {columns}
        data={allProducts}
        loading={false}
        onRowClick={(product) => goto(`/${params.slug}/products/${product.id}`)}
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
              Loading...
            {:else}
              Load More
            {/if}
          </Button>
        </div>
      {/if}
    {:else}
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:gap-4">
        {#each allProducts as product (product.id)}
          {@const marginPercent =
            product.lastCostCents && product.lastCostCents > 0
              ? Math.round(
                  ((product.priceCents - product.lastCostCents) / product.lastCostCents) * 100
                )
              : null}
          {@const stockStatus =
            product.stock === 0
              ? "out"
              : product.stock <= (product.lowStockThreshold ?? 10)
                ? "low"
                : "ok"}

          <Card.Root class="group overflow-hidden p-0">
            <a href={`/${params.slug}/products/${product.id}`} class="block">
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
                    {stockStatus === "out" ? "Out of stock" : "Low stock"}
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
                      <DropdownMenu.Item onclick={() => handleEditProduct(product.id)}>
                        <PencilIcon class="size-4" />
                        Edit
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onclick={() => handleAdjustProduct(product.id, product.name, product.stock)}
                      >
                        <ArrowUpDownIcon class="size-4" />
                        Adjust Stock
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        class="text-destructive"
                        onclick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2Icon class="size-4" />
                        Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
              </div>

              <div class="flex flex-col gap-1.5 p-3">
                <div class="min-w-0">
                  <p class="truncate text-sm leading-tight font-medium">{product.name}</p>
                  <p class="text-muted-foreground truncate text-xs">
                    {product.sku ?? "No SKU"}
                    {#if product.categories?.length > 0}
                      <span> · {product.categories[0]}</span>
                    {/if}
                  </p>
                </div>

                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-sm font-semibold">
                      {formatPrice(product.priceCents, shop.country)}
                    </span>
                    <span class="text-muted-foreground text-xs">{product.stock} left</span>
                  </div>
                  {#if product.lastCostCents != null && marginPercent != null}
                    <div class="flex items-center gap-1.5">
                      <span class="text-muted-foreground text-xs">
                        Cost {formatPrice(product.lastCostCents, shop.country)}
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
              Loading...
            {:else}
              Load More
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
      slug={params.slug}
      productId={adjustProduct.id}
      productName={adjustProduct.name}
      currentStock={adjustProduct.stock}
    />
  {/if}

  {#if productDialog}
    <ProductDialog
      open={true}
      onClose={() => (productDialog = null)}
      slug={params.slug}
      productId={productDialog.productId}
    />
  {/if}
</div>
