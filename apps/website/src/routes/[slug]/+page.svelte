<script lang="ts">
  import FilterIcon from "@lucide/svelte/icons/filter";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MapPinIcon from "@lucide/svelte/icons/map-pin";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import SearchIcon from "@lucide/svelte/icons/search";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import StoreIcon from "@lucide/svelte/icons/store";
  import XIcon from "@lucide/svelte/icons/x";
  import { Badge } from "@repo/ui/badge";
  import { Button } from "@repo/ui/button";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { Separator } from "@repo/ui/separator";
  import * as Sheet from "@repo/ui/sheet";
  import { Switch } from "@repo/ui/switch";
  import { createInfiniteQuery, createQuery } from "@tanstack/svelte-query";

  import { page } from "$app/state";
  import Pricing from "$lib/components/Pricing.svelte";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();

  const PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f4f4f5' width='400' height='400'/%3E%3Ctext fill='%2371717a' font-family='system-ui' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EProduct Image%3C/text%3E%3C/svg%3E";

  const PLACEHOLDER_HERO =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='500' viewBox='0 0 1200 500'%3E%3Cdefs%3E%3ClinearGradient id='h' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2327133f'/%3E%3Cstop offset='100%25' stop-color='%235419d5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23h)' width='1200' height='500'/%3E%3C/svg%3E";

  // Filter state
  let searchQuery = $state("");
  let showInStockOnly = $state(false);
  let minPrice = $state("");
  let maxPrice = $state("");
  let isFilterSheetOpen = $state(false);

  const shop = createQuery(() =>
    orpc.shops.get.queryOptions({
      input: { slug: page.params.slug ?? "" },
      enabled: !!page.params.slug,
    })
  );

  const products = createInfiniteQuery(() =>
    orpc.products.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        cursor,
        slug: params.slug,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!params.slug,
    })
  );

  const allProducts = $derived(products.data?.pages.flatMap((page) => page.items) ?? []);

  // Filtered products
  const filteredProducts = $derived(() => {
    let result = allProducts;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.sku && p.sku.toLowerCase().includes(query))
      );
    }

    // Stock filter
    if (showInStockOnly) {
      result = result.filter((p) => p.stock > 0);
    }

    // Price filters
    const min = Number.parseInt(minPrice) * 100; // Convert to cents
    const max = Number.parseInt(maxPrice) * 100;

    if (!isNaN(min) && min > 0) {
      result = result.filter((p) => p.priceCents >= min);
    }
    if (!isNaN(max) && max > 0) {
      result = result.filter((p) => p.priceCents <= max);
    }

    return result;
  });

  // Count active filters
  const activeFilterCount = $derived(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (showInStockOnly) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    return count;
  });

  // Check if any filters are applied
  const hasActiveFilters = $derived(() => activeFilterCount() > 0);

  function clearFilters() {
    searchQuery = "";
    showInStockOnly = false;
    minPrice = "";
    maxPrice = "";
  }

  function applyFilters() {
    isFilterSheetOpen = false;
  }

  function getImageUrl(image: string | null | undefined): string {
    return image || PLACEHOLDER_IMAGE;
  }

  function getHeroUrl(heroImage: string | null | undefined): string {
    return heroImage || PLACEHOLDER_HERO;
  }
</script>

<div class="bg-background min-h-svh">
  {#if shop.isLoading}
    <!-- Loading State -->
    <div class="flex h-svh items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <Loader2Icon class="text-primary size-8 animate-spin" />
        <p class="text-muted-foreground text-sm">Loading store...</p>
      </div>
    </div>
  {:else if shop.error}
    <!-- Error State -->
    <div class="flex h-svh items-center justify-center px-4">
      <Card class="w-full max-w-sm text-center">
        <CardHeader>
          <div class="bg-muted mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
            <StoreIcon class="text-muted-foreground size-6" />
          </div>
          <CardTitle>Store Unavailable</CardTitle>
          <CardDescription
            >We couldn't load this shop. Please try refreshing the page.</CardDescription
          >
        </CardHeader>
      </Card>
    </div>
  {:else if shop.data}
    <!-- Hero Section -->
    <header class="relative overflow-hidden">
      <!-- Hero Background -->
      <div class="relative h-[45vh] max-h-[500px] min-h-[320px]">
        <img src={getHeroUrl(shop.data.heroImage)} alt="" class="h-full w-full object-cover" />
        <div
          class="from-background/90 via-background/50 to-background/20 absolute inset-0 bg-gradient-to-t"
        ></div>
      </div>

      <!-- Hero Content -->
      <div class="absolute inset-0 flex items-end">
        <div class="w-full px-4 pt-32 pb-8 sm:px-6 lg:px-8 lg:pb-12">
          <div class="mx-auto max-w-7xl">
            <!-- Shop Badge -->
            <Badge variant="secondary" class="mb-3 gap-1.5">
              <StoreIcon class="size-3" />
              Shop
            </Badge>

            <!-- Shop Name -->
            <h1
              class="text-foreground mb-3 max-w-3xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
            >
              {shop.data.name}
            </h1>

            <!-- Shop Meta -->
            <div class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {#if shop.data.address}
                <span class="flex items-center gap-1.5">
                  <MapPinIcon class="size-3.5" />
                  {shop.data.address}
                </span>
              {/if}
              {#if shop.data.phone}
                <span class="flex items-center gap-1.5">
                  <PhoneIcon class="size-3.5" />
                  {shop.data.phone}
                </span>
              {/if}
              <span class="flex items-center gap-1.5">
                <PackageIcon class="size-3.5" />
                {shop.data.productCount} products
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Description Section -->
    {#if shop.data.description}
      <section class="bg-card border-b px-4 py-8 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
          <p class="text-muted-foreground max-w-2xl text-base leading-relaxed">
            {shop.data.description}
          </p>
        </div>
      </section>
    {/if}

    <!-- Products Section -->
    <main class="px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div class="mx-auto max-w-7xl">
        <div class="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <!-- Desktop Sidebar Filters -->
          <aside class="hidden w-64 shrink-0 lg:block">
            <div class="sticky top-6 space-y-6">
              <!-- Filter Header -->
              <div class="flex items-center gap-2">
                <FilterIcon class="text-primary size-4" />
                <h3 class="text-foreground text-sm font-semibold tracking-wide uppercase">
                  Filters
                </h3>
                {#if activeFilterCount() > 0}
                  <Badge variant="default" class="ml-auto text-xs">
                    {activeFilterCount()}
                  </Badge>
                {/if}
              </div>

              <Separator />

              <!-- Search Filter -->
              <div class="space-y-3">
                <Label
                  for="desktop-search"
                  class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
                >
                  Search
                </Label>
                <div class="relative">
                  <SearchIcon
                    class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  />
                  <Input
                    id="desktop-search"
                    type="text"
                    placeholder="Find products..."
                    bind:value={searchQuery}
                    class="h-10 pl-10"
                  />
                </div>
              </div>

              <Separator />

              <!-- Stock Filter -->
              <div class="space-y-3">
                <Label class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Availability
                </Label>
                <div class="flex items-center justify-between">
                  <Label for="desktop-stock" class="cursor-pointer text-sm font-medium"
                    >In Stock Only</Label
                  >
                  <Switch id="desktop-stock" bind:checked={showInStockOnly} />
                </div>
              </div>

              <Separator />

              <!-- Price Filter -->
              <div class="space-y-3">
                <Label class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Price Range
                </Label>
                <div class="grid grid-cols-2 gap-2">
                  <div class="relative">
                    <span
                      class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm"
                      >$</span
                    >
                    <Input
                      type="number"
                      placeholder="Min"
                      bind:value={minPrice}
                      min="0"
                      class="h-10 pl-7"
                    />
                  </div>
                  <div class="relative">
                    <span
                      class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm"
                      >$</span
                    >
                    <Input
                      type="number"
                      placeholder="Max"
                      bind:value={maxPrice}
                      min="0"
                      class="h-10 pl-7"
                    />
                  </div>
                </div>
              </div>

              <!-- Clear Filters -->
              {#if hasActiveFilters()}
                <Button variant="ghost" size="sm" onclick={clearFilters} class="w-full text-xs">
                  <XIcon class="mr-1 size-3" />
                  Clear all filters
                </Button>
              {/if}
            </div>
          </aside>

          <!-- Main Content -->
          <div class="min-w-0 flex-1">
            <!-- Section Header with Mobile Filter -->
            <div class="mb-6 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <h2 class="text-foreground text-lg font-semibold">Products</h2>
                <!-- Mobile Filter Sheet -->
                <Sheet.Root bind:open={isFilterSheetOpen}>
                  <Sheet.Trigger>
                    <Button variant="outline" size="sm" class="gap-2 lg:hidden">
                      <FilterIcon class="size-4" />
                      Filters
                      {#if activeFilterCount() > 0}
                        <Badge variant="default" class="ml-1 size-5 justify-center p-0 text-xs">
                          {activeFilterCount()}
                        </Badge>
                      {/if}
                    </Button>
                  </Sheet.Trigger>
                  <Sheet.Content side="right" class="w-full sm:max-w-md [&>div]:px-6">
                    <Sheet.Header>
                      <Sheet.Title class="flex items-center gap-2">
                        <FilterIcon class="size-5" />
                        Filter Products
                      </Sheet.Title>
                      <Sheet.Description>
                        Narrow down products by search, availability, and price
                      </Sheet.Description>
                    </Sheet.Header>

                    <div class="flex flex-col gap-6 py-6">
                      <!-- Search -->
                      <div class="flex flex-col gap-2">
                        <Label for="mobile-search">Search</Label>
                        <div class="relative">
                          <SearchIcon
                            class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                          />
                          <Input
                            id="mobile-search"
                            type="text"
                            placeholder="Search products..."
                            bind:value={searchQuery}
                            class="pl-10"
                          />
                        </div>
                      </div>

                      <!-- Stock Filter -->
                      <div class="flex items-center justify-between">
                        <div class="flex flex-col gap-0.5">
                          <Label for="mobile-stock" class="text-sm font-medium">In Stock Only</Label
                          >
                          <span class="text-muted-foreground text-xs">Hide out of stock items</span>
                        </div>
                        <Switch id="mobile-stock" bind:checked={showInStockOnly} />
                      </div>

                      <!-- Price Range -->
                      <div class="flex flex-col gap-3">
                        <Label>Price Range</Label>
                        <div class="flex items-center gap-3">
                          <div class="relative flex-1">
                            <span
                              class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
                              >$</span
                            >
                            <Input
                              type="number"
                              placeholder="Min"
                              bind:value={minPrice}
                              min="0"
                              class="pl-7"
                            />
                          </div>
                          <span class="text-muted-foreground">-</span>
                          <div class="relative flex-1">
                            <span
                              class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
                              >$</span
                            >
                            <Input
                              type="number"
                              placeholder="Max"
                              bind:value={maxPrice}
                              min="0"
                              class="pl-7"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Sheet.Footer class="gap-2 py-6 sm:justify-between">
                      <Button
                        variant="ghost"
                        onclick={clearFilters}
                        disabled={!hasActiveFilters()}
                        class="gap-2"
                      >
                        <XIcon class="size-4" />
                        Clear All
                      </Button>
                      <Button onclick={applyFilters} class="gap-2">
                        Apply Filters
                        {#if activeFilterCount() > 0}
                          <Badge
                            variant="secondary"
                            class="bg-primary-foreground text-primary justify-center p-0 text-xs"
                          >
                            {filteredProducts().length} results
                          </Badge>
                        {/if}
                      </Button>
                    </Sheet.Footer>
                  </Sheet.Content>
                </Sheet.Root>
              </div>
              <span class="text-muted-foreground text-sm">{filteredProducts().length} items</span>
            </div>

            <!-- Active Filters Display -->
            {#if hasActiveFilters()}
              <div class="mb-4 flex flex-wrap items-center gap-2">
                {#if searchQuery.trim()}
                  <Badge variant="secondary" class="gap-1">
                    Search: {searchQuery}
                    <button
                      type="button"
                      onclick={() => (searchQuery = "")}
                      class="hover:text-primary ml-1"
                    >
                      <XIcon class="size-3" />
                    </button>
                  </Badge>
                {/if}
                {#if showInStockOnly}
                  <Badge variant="secondary" class="gap-1">
                    In Stock
                    <button
                      type="button"
                      onclick={() => (showInStockOnly = false)}
                      class="hover:text-primary ml-1"
                    >
                      <XIcon class="size-3" />
                    </button>
                  </Badge>
                {/if}
                {#if minPrice || maxPrice}
                  <Badge variant="secondary" class="gap-1">
                    Price: {minPrice ? `$${minPrice}` : "$0"} - {maxPrice ? `$${maxPrice}` : "∞"}
                    <button
                      type="button"
                      onclick={() => {
                        minPrice = "";
                        maxPrice = "";
                      }}
                      class="hover:text-primary ml-1"
                    >
                      <XIcon class="size-3" />
                    </button>
                  </Badge>
                {/if}
                <Button
                  variant="ghost"
                  size="sm"
                  onclick={clearFilters}
                  class="h-auto px-2 py-1 text-xs"
                >
                  Clear all
                </Button>
              </div>
            {/if}

            {#if filteredProducts().length === 0}
              <!-- Empty State -->
              <Card class="py-16">
                <CardContent class="flex flex-col items-center justify-center text-center">
                  <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
                    <ShoppingCartIcon class="text-muted-foreground size-7" />
                  </div>
                  <CardTitle class="mb-1 text-base">
                    {hasActiveFilters() ? "No products match" : "No products yet"}
                  </CardTitle>
                  <CardDescription>
                    {hasActiveFilters()
                      ? "Try adjusting your filters to see more results"
                      : "This shop hasn't added any products"}
                  </CardDescription>
                  {#if hasActiveFilters()}
                    <Button variant="outline" onclick={clearFilters} class="mt-4"
                      >Clear Filters</Button
                    >
                  {/if}
                </CardContent>
              </Card>
            {:else}
              <!-- Products Grid -->
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {#each filteredProducts() as product, index (product.id)}
                  <Card
                    class="group transition-[translate shadow] overflow-hidden p-0 duration-300 hover:-translate-y-1 hover:shadow-md"
                    style="animation: fadeInUp 0.4s ease-out {index * 0.03}s both;"
                  >
                    <!-- Image Container -->
                    <div class="bg-muted relative aspect-3/2 overflow-hidden">
                      <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        loading="lazy"
                      />

                      <!-- Out of Stock Badge -->
                      {#if !product.stock}
                        <div class="absolute top-3 left-3">
                          <Badge variant="destructive">Out of Stock</Badge>
                        </div>
                      {/if}
                    </div>

                    <!-- Content -->
                    <CardContent class="p-4 pt-0">
                      <h3
                        class="text-foreground mb-2 line-clamp-2 text-sm leading-snug font-medium"
                      >
                        {product.name}
                      </h3>

                      <div class="flex items-center justify-between">
                        <span class="text-foreground text-base font-semibold">
                          <Pricing cents={product.priceCents} country={shop.data.country} />
                        </span>

                        {#if product.stock}
                          <Badge variant="secondary" class="text-xs">In Stock</Badge>
                        {:else}
                          <span class="text-muted-foreground text-xs">Unavailable</span>
                        {/if}
                      </div>
                    </CardContent>
                  </Card>
                {/each}
              </div>
            {/if}

            <!-- Load More -->
            {#if products.hasNextPage && !hasActiveFilters()}
              <div class="mt-8 flex justify-center">
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
          </div>
        </div>
      </div>
    </main>

    <!-- Simple Footer -->
    <footer class="bg-card border-t px-4 py-6 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl text-center">
        <p class="text-muted-foreground text-xs">
          {shop.data.name} — Powered by POS Platform
        </p>
      </div>
    </footer>
  {/if}
</div>

<style>
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
