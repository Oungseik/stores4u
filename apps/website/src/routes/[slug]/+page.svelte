<script lang="ts">
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import FilterIcon from "@lucide/svelte/icons/filter";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MapPinIcon from "@lucide/svelte/icons/map-pin";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import SearchIcon from "@lucide/svelte/icons/search";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import StoreIcon from "@lucide/svelte/icons/store";
  import XIcon from "@lucide/svelte/icons/x";
  import { Badge } from "@repo/ui/badge";
  import { Button, buttonVariants } from "@repo/ui/button";
  import { Card, CardContent, CardDescription, CardTitle } from "@repo/ui/card";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { Separator } from "@repo/ui/separator";
  import * as Sheet from "@repo/ui/sheet";
  import { Switch } from "@repo/ui/switch";
  import { createInfiniteQuery, createQuery } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";

  import Pricing from "$lib/components/Pricing.svelte";
  import { orpc } from "$lib/orpc_client";
  import { shopProductsFilterSchema } from "$lib/search_param";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  const PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f4f4f5' width='400' height='400'/%3E%3Ctext fill='%2371717a' font-family='system-ui' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EProduct Image%3C/text%3E%3C/svg%3E";

  const PLACEHOLDER_HERO =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='500' viewBox='0 0 1200 500'%3E%3Cdefs%3E%3ClinearGradient id='h' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2327133f'/%3E%3Cstop offset='100%25' stop-color='%235419d5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23h)' width='1200' height='500'/%3E%3C/svg%3E";

  const searchParams = useSearchParams(shopProductsFilterSchema);
  const debouncedSearch = new Debounced(() => searchParams.search, 500);
  const debouncedCategories = new Debounced(() => searchParams.categories, 500);

  let isFilterSheetOpen = $state(false);

  const categories = createQuery(() =>
    orpc.categories.list.queryOptions({
      input: { slug: params.slug, pageSize: 100 },
      enabled: !!params.slug,
    })
  );

  const products = createInfiniteQuery(() =>
    orpc.products.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        cursor,
        slug: params.slug,
        search: debouncedSearch.current || undefined,
        categories:
          debouncedCategories.current.length > 0 ? debouncedCategories.current : undefined,
        inStockOnly: searchParams.inStockOnly || undefined,
        minPriceCents: searchParams.minPrice ? searchParams.minPrice * 100 : undefined,
        maxPriceCents: searchParams.maxPrice ? searchParams.maxPrice * 100 : undefined,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!params.slug,
    })
  );

  const allProducts = $derived(products.data?.pages.flatMap((page) => page.items) ?? []);

  const hasActiveFilters = $derived(
    (searchParams.search?.length ?? 0) > 0 ||
      searchParams.categories.length > 0 ||
      searchParams.inStockOnly ||
      (searchParams.minPrice ?? 0) > 0 ||
      (searchParams.maxPrice ?? 0) > 0
  );

  const activeFilterCount = $derived(
    ((searchParams.search?.length ?? 0) > 0 ? 1 : 0) +
      (searchParams.categories.length > 0 ? 1 : 0) +
      (searchParams.inStockOnly ? 1 : 0) +
      ((searchParams.minPrice ?? 0) > 0 ? 1 : 0) +
      ((searchParams.maxPrice ?? 0) > 0 ? 1 : 0)
  );

  function clearFilters() {
    searchParams.update({
      search: undefined,
      categories: [],
      inStockOnly: false,
      minPrice: undefined,
      maxPrice: undefined,
    });
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
  {#if !hasActiveFilters}
    <!-- Hero Section -->
    <header class="relative overflow-hidden">
      <!-- Hero Background -->
      <div class="relative h-[45vh] max-h-[500px] min-h-[320px]">
        <img src={getHeroUrl(shop.heroImage)} alt="" class="h-full w-full object-cover" />
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
              {shop.name}
            </h1>

            <!-- Shop Meta -->
            <div class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span class="flex items-center gap-1.5">
                <MapPinIcon class="size-3.5" />
                {shop.address}
              </span>
              <span class="flex items-center gap-1.5">
                <PhoneIcon class="size-3.5" />
                {shop.phone}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Description Section -->
    <section class="bg-card border-b px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <p class="text-muted-foreground max-w-2xl text-base leading-relaxed">
          {shop.description}
        </p>
      </div>
    </section>
  {/if}

  <!-- Products Section -->
  <main class="min-h-[calc(100dvh-66px)] px-4 py-4 sm:px-6 lg:px-8 lg:py-12">
    <div class="mx-auto max-w-7xl">
      <div class="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <!-- Desktop Sidebar Filters -->
        <aside class="hidden w-64 shrink-0 lg:block">
          <div class="sticky top-4 space-y-6 lg:top-12">
            <!-- Filter Header -->
            <div class="flex items-center gap-2 lg:pt-4">
              <FilterIcon class="text-primary size-4" />
              <h3 class="text-foreground text-sm font-semibold tracking-wide uppercase">Filters</h3>
              {#if activeFilterCount > 0}
                <div class="text-primary ml-auto text-xs">
                  {activeFilterCount}
                </div>
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
                  value={searchParams.search}
                  oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
                  class="h-10 pl-10"
                />
              </div>
            </div>

            <Separator />

            <!-- Category Filter -->
            <div class="space-y-3">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger
                  class={buttonVariants({ variant: "outline", size: "sm" }) +
                    " w-full justify-between"}
                >
                  <span class="flex items-center gap-2">
                    <FilterIcon class="size-4" />
                    {searchParams.categories.length > 0
                      ? `${searchParams.categories.length} categories`
                      : "All Categories"}
                  </span>
                  <ChevronDownIcon class="size-3 opacity-50" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="start" class="w-56">
                  <DropdownMenu.Label>Filter by Category</DropdownMenu.Label>
                  <DropdownMenu.Separator />
                  {#if categories.data?.items}
                    <DropdownMenu.CheckboxGroup
                      value={searchParams.categories}
                      onValueChange={(value: string[]) =>
                        searchParams.update({ categories: value })}
                    >
                      {#each categories.data.items as category (category.id)}
                        <DropdownMenu.CheckboxItem value={category.name}>
                          <span class="flex-1">{category.name}</span>
                          <span class="text-muted-foreground text-xs">{category.productCount}</span>
                        </DropdownMenu.CheckboxItem>
                      {/each}
                    </DropdownMenu.CheckboxGroup>
                  {/if}
                </DropdownMenu.Content>
              </DropdownMenu.Root>
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
                <Switch
                  id="desktop-stock"
                  checked={searchParams.inStockOnly}
                  onCheckedChange={(checked) => searchParams.update({ inStockOnly: checked })}
                />
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
                    value={searchParams.minPrice}
                    oninput={(e) =>
                      searchParams.update({ minPrice: e.currentTarget.valueAsNumber })}
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
                    value={searchParams.maxPrice}
                    oninput={(e) =>
                      searchParams.update({ maxPrice: e.currentTarget.valueAsNumber })}
                    min="0"
                    class="h-10 pl-7"
                  />
                </div>
              </div>
            </div>

            <!-- Clear Filters -->
            {#if hasActiveFilters}
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
          <div class="mb-3 flex items-center justify-between gap-3 py-3">
            <h2 class="text-foreground text-lg font-semibold">Products</h2>
            <!-- Mobile Filter Sheet -->
            <Sheet.Root bind:open={isFilterSheetOpen}>
              <Sheet.Trigger
                class={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  class: "gap-2 lg:hidden",
                })}
              >
                <FilterIcon class="size-4" />
                Filters
                {#if activeFilterCount > 0}
                  <Badge variant="default" class="ml-1 size-5 justify-center p-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                {/if}
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
                        value={searchParams.search}
                        oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
                        class="pl-10"
                      />
                    </div>
                  </div>

                  <!-- Categories -->
                  {#if categories.data?.items && categories.data.items.length > 0}
                    <div class="flex flex-col gap-3">
                      <Label>Categories</Label>
                      <div class="flex flex-col gap-2">
                        {#each categories.data.items as category (category.id)}
                          <label
                            class="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2"
                          >
                            <span class="text-sm">{category.name}</span>
                            <div class="flex items-center gap-2">
                              <span class="text-muted-foreground text-xs"
                                >{category.productCount}</span
                              >
                              <input
                                type="checkbox"
                                checked={searchParams.categories.includes(category.name)}
                                onchange={() => {
                                  const current = searchParams.categories;
                                  if (current.includes(category.name)) {
                                    searchParams.update({
                                      categories: current.filter(
                                        (name: string) => name !== category.name
                                      ),
                                    });
                                  } else {
                                    searchParams.update({
                                      categories: [...current, category.name],
                                    });
                                  }
                                }}
                                class="size-4"
                              />
                            </div>
                          </label>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  <!-- Stock Filter -->
                  <div class="flex items-center justify-between">
                    <div class="flex flex-col gap-0.5">
                      <Label for="mobile-stock" class="text-sm font-medium">In Stock Only</Label>
                      <span class="text-muted-foreground text-xs">Hide out of stock items</span>
                    </div>
                    <Switch
                      id="mobile-stock"
                      checked={searchParams.inStockOnly}
                      onCheckedChange={(checked) => searchParams.update({ inStockOnly: checked })}
                    />
                  </div>

                  <!-- Price Range -->
                  <div class="flex flex-col gap-3">
                    <Label>Price Range</Label>
                    <div class="flex items-center gap-3">
                      <div class="relative flex-1">
                        <span class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
                          >$</span
                        >
                        <Input
                          type="number"
                          placeholder="Min"
                          value={searchParams.minPrice}
                          oninput={(e) =>
                            searchParams.update({ minPrice: e.currentTarget.valueAsNumber })}
                          min="0"
                          class="pl-7"
                        />
                      </div>
                      <span class="text-muted-foreground">-</span>
                      <div class="relative flex-1">
                        <span class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
                          >$</span
                        >
                        <Input
                          type="number"
                          placeholder="Max"
                          value={searchParams.maxPrice}
                          oninput={(e) =>
                            searchParams.update({ maxPrice: e.currentTarget.valueAsNumber })}
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
                    disabled={!hasActiveFilters}
                    class="gap-2"
                  >
                    <XIcon class="size-4" />
                    Clear All
                  </Button>
                  <Button onclick={applyFilters} class="gap-2">
                    Apply Filters
                    {#if activeFilterCount > 0}
                      <Badge
                        variant="secondary"
                        class="bg-primary-foreground text-primary justify-center text-xs"
                      >
                        {allProducts.length} results
                      </Badge>
                    {/if}
                  </Button>
                </Sheet.Footer>
              </Sheet.Content>
            </Sheet.Root>
          </div>

          <!-- Active Filters Display -->
          {#if hasActiveFilters}
            <div class="mb-4 flex flex-wrap items-center gap-2">
              {#if (searchParams.search?.length ?? 0) > 0}
                <Badge variant="secondary" class="gap-1">
                  Search: {searchParams.search}
                  <button
                    type="button"
                    onclick={() => searchParams.update({ search: "" })}
                    class="hover:text-primary ml-1"
                  >
                    <XIcon class="size-3" />
                  </button>
                </Badge>
              {/if}
              {#if searchParams.categories.length > 0}
                <Badge variant="secondary" class="gap-1">
                  {searchParams.categories.length} categories
                  <button
                    type="button"
                    onclick={() => searchParams.update({ categories: [] })}
                    class="hover:text-primary ml-1"
                  >
                    <XIcon class="size-3" />
                  </button>
                </Badge>
              {/if}
              {#if searchParams.inStockOnly}
                <Badge variant="secondary" class="gap-1">
                  In Stock
                  <button
                    type="button"
                    onclick={() => searchParams.update({ inStockOnly: false })}
                    class="hover:text-primary ml-1"
                  >
                    <XIcon class="size-3" />
                  </button>
                </Badge>
              {/if}
              {#if searchParams.minPrice || searchParams.maxPrice}
                <Badge variant="secondary" class="gap-1">
                  Price: {searchParams.minPrice ? `$${searchParams.minPrice}` : "$0"} - {searchParams.maxPrice
                    ? `$${searchParams.maxPrice}`
                    : "∞"}
                  <button
                    type="button"
                    onclick={() =>
                      searchParams.update({ minPrice: undefined, maxPrice: undefined })}
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

          {#if products.isLoading}
            <div class="flex flex-col items-center justify-center py-16">
              <Loader2Icon class="text-muted-foreground size-8 animate-spin" />
              <p class="text-muted-foreground mt-3 text-sm">Loading products...</p>
            </div>
          {:else if allProducts.length === 0}
            <!-- Empty State -->
            <Card class="py-16">
              <CardContent class="flex flex-col items-center justify-center text-center">
                <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
                  <ShoppingCartIcon class="text-muted-foreground size-7" />
                </div>
                <CardTitle class="mb-1 text-base">
                  {hasActiveFilters ? "No products match" : "No products yet"}
                </CardTitle>
                <CardDescription>
                  {hasActiveFilters
                    ? "Try adjusting your filters to see more results"
                    : "This shop hasn't added any products"}
                </CardDescription>
                {#if hasActiveFilters}
                  <Button variant="outline" onclick={clearFilters} class="mt-4"
                    >Clear Filters</Button
                  >
                {/if}
              </CardContent>
            </Card>
          {:else}
            <!-- Products Grid -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {#each allProducts as product (product.id)}
                <Card
                  class="group transition-[translate shadow] overflow-hidden p-0 duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <!-- Image Container -->
                  <div class="bg-muted relative aspect-square overflow-hidden">
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
                    <h3 class="text-foreground mb-2 line-clamp-2 text-sm leading-snug font-medium">
                      {product.name}
                    </h3>

                    <div class="flex items-center justify-between">
                      <span class="text-foreground text-base font-semibold">
                        <Pricing cents={product.priceCents} country={shop.country} />
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
          {#if products.hasNextPage}
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
        {shop.name} — Powered by POS Platform
      </p>
    </div>
  </footer>
</div>
