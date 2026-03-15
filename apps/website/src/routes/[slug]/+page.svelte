<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MapPinIcon from "@lucide/svelte/icons/map-pin";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import StoreIcon from "@lucide/svelte/icons/store";
  import { Badge } from "@repo/ui/badge";
  import { Button } from "@repo/ui/button";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
  import { createInfiniteQuery, createQuery } from "@tanstack/svelte-query";

  import { page } from "$app/state";
  import { orpc } from "$lib/orpc_client";
  import { formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();

  const PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f4f4f5' width='400' height='400'/%3E%3Ctext fill='%2371717a' font-family='system-ui' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EProduct Image%3C/text%3E%3C/svg%3E";

  const PLACEHOLDER_HERO =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='500' viewBox='0 0 1200 500'%3E%3Cdefs%3E%3ClinearGradient id='h' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2327133f'/%3E%3Cstop offset='100%25' stop-color='%235419d5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23h)' width='1200' height='500'/%3E%3C/svg%3E";

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

  function getImageUrl(image: string | null | undefined): string {
    return image || PLACEHOLDER_IMAGE;
  }

  function getHeroUrl(heroImage: string | null | undefined): string {
    return heroImage || PLACEHOLDER_HERO;
  }
</script>

<div class="bg-background min-h-svh">
  {#if shop.isLoading}
    <!-- Loading State with Skeleton -->
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
          <div class="mx-auto max-w-6xl">
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
        <div class="mx-auto max-w-6xl">
          <p class="text-muted-foreground max-w-2xl text-base leading-relaxed">
            {shop.data.description}
          </p>
        </div>
      </section>
    {/if}

    <!-- Products Section -->
    <main class="px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div class="mx-auto max-w-6xl">
        <!-- Section Header -->
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-foreground text-lg font-semibold">Products</h2>
          <span class="text-muted-foreground text-sm">{shop.data.productCount} items</span>
        </div>

        {#if allProducts.length === 0}
          <!-- Empty State -->
          <Card class="py-16">
            <CardContent class="flex flex-col items-center justify-center text-center">
              <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
                <ShoppingCartIcon class="text-muted-foreground size-7" />
              </div>
              <CardTitle class="mb-1 text-base">No products yet</CardTitle>
              <CardDescription>This shop hasn't added any products</CardDescription>
            </CardContent>
          </Card>
        {:else}
          <!-- Products Grid -->
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {#each allProducts as product, index (product.id)}
              <Card
                class="group transition-[translate shadow] overflow-hidden p-0 duration-300 hover:-translate-y-1 hover:shadow-md"
                style="animation: fadeInUp 0.4s ease-out {index * 0.03}s both;"
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
                <CardContent class="p-4">
                  <h3 class="text-foreground mb-2 line-clamp-2 text-sm leading-snug font-medium">
                    {product.name}
                  </h3>

                  <div class="flex items-center justify-between">
                    <span class="text-foreground text-base font-semibold">
                      {formatPrice(product.priceCents, shop.data?.country)}
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
    </main>

    <!-- Simple Footer -->
    <footer class="bg-card border-t px-4 py-6 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl text-center">
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
