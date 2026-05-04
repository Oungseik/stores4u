<script lang="ts">
  import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
  import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import ListIcon from "@lucide/svelte/icons/list";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import XCircleIcon from "@lucide/svelte/icons/x-circle";
  import { buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { ConfirmDeleteDialog, confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { Skeleton } from "@repo/ui/skeleton";
  import { ToggleGroup, ToggleGroupItem } from "@repo/ui/toggle-group";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";

  import StatsCard from "$lib/components/cards/stats-card.svelte";
  import DashboardHeader from "$lib/components/dashboard-header.svelte";
  import PaginationControls from "$lib/components/pagination-controls.svelte";
  import DataTable from "$lib/components/tables/data-table.svelte";
  import { createColumns } from "$lib/components/tables/products/columns";
  import { deleteProduct } from "$lib/remote/products/delete_product.remote";
  import { getProductStats } from "$lib/remote/products/get_product_stats.remote";
  import { listCategories } from "$lib/remote/products/list_categories.remote";
  import { listProducts } from "$lib/remote/products/list_products.remote";
  import { productsFilterSchema } from "$lib/search_param";
  import { formatPrice } from "$lib/utils/format-price";

  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const searchParams = useSearchParams(productsFilterSchema, { noScroll: true });
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);
  const categoriesKey = $derived(JSON.stringify(searchParams.categories ?? []));
  const debouncedCategories = new Debounced(() => categoriesKey, 1000);

  let refreshKey = $state(0);
  let cursorHistory: string[] = $state([]);

  const query = $derived({
    cursor: searchParams.cursor,
    refreshKey,
    search: debouncedSearch.current || undefined,
    categories: (() => {
      const c = JSON.parse(debouncedCategories.current) satisfies string[];
      return c.length > 0 ? c : undefined;
    })(),
  });

  // Reset cursor when filters change
  let prevSearch = debouncedSearch.current;
  let prevCategories = debouncedCategories.current;
  $effect(() => {
    const s = debouncedSearch.current;
    const c = debouncedCategories.current;
    if (s !== prevSearch || c !== prevCategories) {
      prevSearch = s;
      prevCategories = c;
      searchParams.update({ cursor: undefined });
      cursorHistory = [];
    }
  });

  // Delete handler
  function handleDeleteProduct(id: string) {
    confirmDelete({
      title: "Delete Product",
      description: "Are you sure you want to delete this product? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await deleteProduct({ id });
          refreshKey++;
        } catch {
          // TODO: show toast on error
        }
      },
    });
  }

  // Column definitions for table view
  const columns = $derived(
    createColumns(
      data.organization.shopInfo?.country ?? null,
      data.organization.slug,
      handleDeleteProduct
    )
  );

  const hasFilters = $derived(searchParams.search.length > 0 || searchParams.categories.length > 0);

  function resetFilters() {
    searchParams.update({ search: "", categories: [], cursor: undefined });
    cursorHistory = [];
  }

  function handleNext(nextCursor: string | undefined) {
    if (!nextCursor) return;
    cursorHistory.push(searchParams.cursor ?? "");
    searchParams.update({ cursor: nextCursor });
  }

  function handlePrev() {
    const prev = cursorHistory.pop() || undefined;
    searchParams.update({ cursor: prev });
  }
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <DashboardHeader
    breadcrumbs={[
      { label: "Shops", href: "/shops" },
      { label: data.organization.name, href: `/shops/${data.organization.slug}` },
      { label: "Products" },
    ]}
  >
    {#snippet actions()}
      <button class={buttonVariants()}>
        <PlusIcon class="size-4" /> Add Product
      </button>
    {/snippet}
  </DashboardHeader>

  <div class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold tracking-tight">Products</h1>
    <p class="text-sm text-muted-foreground">
      Manage your product catalog, track stock levels, and organize items
    </p>
  </div>

  <!-- Stats — inline await for remote query -->
  {#snippet statsPending()}
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
  {/snippet}

  {#snippet statsFailed()}
    <div class="flex items-center justify-center py-8 text-sm text-muted-foreground">
      Failed to load stats
    </div>
  {/snippet}

  <svelte:boundary pending={statsPending} failed={statsFailed}>
    {#if true}
      {@const stats = await getProductStats()}
      <div
        class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 xl:grid xl:grid-cols-4 xl:overflow-x-visible"
      >
        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
          <StatsCard
            title="Total Products"
            value={stats.total}
            description="In your catalog"
            icon={PackageIcon}
            iconBgClass="bg-primary/10"
            iconTextClass="text-primary"
          />
        </div>
        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
          <StatsCard
            title="Low Stock"
            value={stats.lowStock}
            description="Needs restocking"
            icon={AlertTriangleIcon}
            iconBgClass="bg-amber-500/10"
            iconTextClass="text-amber-600"
          />
        </div>
        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
          <StatsCard
            title="Out of Stock"
            value={stats.outOfStock}
            description="Unavailable"
            icon={XCircleIcon}
            iconBgClass="bg-red-500/10"
            iconTextClass="text-red-600"
          />
        </div>
        <div class="min-w-[300px] flex-shrink-0 snap-center xl:min-w-0">
          <StatsCard
            title="Inventory Value"
            description="Total retail value"
            icon={DollarSignIcon}
            iconBgClass="bg-emerald-500/10"
            iconTextClass="text-emerald-600"
            price={stats.inventoryValueRetailCents}
            country={data.organization.shopInfo?.country}
          />
        </div>
      </div>
    {/if}
  </svelte:boundary>

  {#snippet pending()}
    <div class="flex items-center justify-center py-12">
      <Loader2Icon class="size-6 animate-spin text-muted-foreground" />
    </div>
  {/snippet}

  {#snippet failed(_error: unknown, reset: () => void)}
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <XCircleIcon class="size-6 text-destructive" />
      </div>
      <p class="mb-4 text-muted-foreground">Failed to load products</p>
      <button onclick={reset} class={buttonVariants({ variant: "outline", size: "sm" })}>
        Try again
      </button>
    </div>
  {/snippet}

  <svelte:boundary {pending} {failed}>
    <!-- Filters -->
    <section class="space-y-6">
      <FilterBar.Root {hasFilters} onReset={resetFilters} class="justify-between">
        <div class="flex flex-1 flex-wrap items-center justify-start gap-2 md:gap-4">
          <FilterBar.Search
            placeholder="Search products, SKU..."
            value={searchParams.search}
            oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
          />
          {#if true}
            {@const catResult = await listCategories({})}
            <FilterBar.CheckboxGroup
              items={catResult.items.map((c) => ({
                value: c.name,
                label: c.name,
                count: c.productCount,
              }))}
              value={searchParams.categories}
              onValueChange={(value) => searchParams.update({ categories: value })}
              placeholder="All Categories"
            />
          {/if}
          <FilterBar.Reset />
        </div>
        <ToggleGroup
          type="single"
          value={searchParams.view}
          onValueChange={(value) => {
            if (value && (value === "card" || value === "table"))
              searchParams.update({ view: value });
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

      <!-- Product content -->
      {#if true}
        {@const products = await listProducts(query)}
        {#if products.items.length === 0}
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div class="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
              <PackageIcon class="size-6 text-muted-foreground" />
            </div>
            <p class="text-muted-foreground">No products found</p>
          </div>
        {:else if searchParams.view === "table"}
          <!-- Table view with TanStack DataTable -->
          <DataTable {columns} data={products.items} />

          <PaginationControls
            hasPrev={cursorHistory.length > 0}
            hasNext={!!products.nextCursor}
            onPrev={handlePrev}
            onNext={() => handleNext(products.nextCursor)}
            loading={$effect.pending() > 0}
          />
        {:else}
          <!-- Card view -->
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:gap-4">
            {#each products.items as product (product.id)}
              {@const stockStatus =
                product.stock === 0
                  ? "out"
                  : product.stock <= (product.lowStockThreshold ?? 10)
                    ? "low"
                    : "ok"}
              <Card.Root class="group overflow-hidden p-0">
                <a href={`/shops/${data.organization.slug}/products/${product.id}`} class="block">
                  <div class="relative aspect-[3/2] overflow-hidden bg-muted/40">
                    {#if product.image}
                      <img
                        src={product.image}
                        alt={product.name}
                        class="size-full object-cover transition-transform group-hover:scale-105"
                      />
                    {:else}
                      <div class="flex size-full items-center justify-center">
                        <PackageIcon class="size-10 text-muted-foreground/40" />
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
                          class="{buttonVariants({
                            variant: 'secondary',
                            size: 'icon',
                          })} size-7 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                          onclick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <MoreVerticalIcon class="size-3.5" />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end">
                          <DropdownMenu.Item>Edit</DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item
                            class="text-destructive"
                            onclick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1.5 p-3">
                    <div class="min-w-0">
                      <p class="truncate text-sm leading-tight font-medium">{product.name}</p>
                      <p class="truncate text-xs text-muted-foreground">
                        {product.sku ?? "No SKU"}
                      </p>
                    </div>
                    <div class="flex items-center justify-between gap-1">
                      <span class="text-sm font-semibold"
                        >{formatPrice(
                          product.priceCents,
                          data.organization.shopInfo?.country
                        )}</span
                      >
                      <span class="text-xs text-muted-foreground">{product.stock} left</span>
                    </div>
                  </div>
                </a>
              </Card.Root>
            {/each}
          </div>

          <PaginationControls
            hasPrev={cursorHistory.length > 0}
            hasNext={!!products.nextCursor}
            onPrev={handlePrev}
            onNext={() => handleNext(products.nextCursor)}
            loading={$effect.pending() > 0}
          />
        {/if}
      {/if}
    </section>
  </svelte:boundary>
</div>

<ConfirmDeleteDialog />
