<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MapPinIcon from "@lucide/svelte/icons/map-pin";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import { Badge } from "@repo/ui/badge";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { createInfiniteQuery, createQuery } from "@tanstack/svelte-query";

  import { page } from "$app/state";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();

  const PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f1f5f9' width='400' height='400'/%3E%3Ctext fill='%2394a3b8' font-family='system-ui' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

  const PLACEHOLDER_HERO =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='600' viewBox='0 0 1200 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%236366f1'/%3E%3Cstop offset='100%25' stop-color='%238b5cf6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='1200' height='600'/%3E%3C/svg%3E";

  const shop = createQuery(() =>
    orpc.shops.getShop.queryOptions({
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

  function formatPrice(cents: number): string {
    return `${(cents / 100).toFixed(2)}`;
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
    <div class="flex h-svh items-center justify-center">
      <Loader2Icon class="size-8 animate-spin" />
    </div>
  {:else if shop.error}
    <div class="flex h-svh items-center justify-center">
      <p class="text-lg text-red-500">Failed to load shop</p>
    </div>
  {:else if shop.data}
    <!-- Hero Section -->
    <section class="relative h-72 w-full overflow-hidden sm:h-80 md:h-96 lg:h-[500px]">
      <img
        src={getHeroUrl(shop.data.heroImage)}
        alt={shop.data.name}
        class="h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70"></div>

      <div
        class="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white"
      >
        <h1 class="mb-2 text-3xl font-bold sm:text-4xl md:text-5xl">{shop.data.name}</h1>

        {#if shop.data.description}
          <p class="mb-5 max-w-lg text-sm text-white/80 sm:text-base md:mb-7 md:text-lg">
            {shop.data.description}
          </p>
        {/if}

        <div class="flex flex-wrap items-center justify-center gap-3 text-sm text-white/70">
          {#if shop.data.address}
            <span class="flex items-center gap-1">
              <MapPinIcon class="size-4" />
              {shop.data.address}
            </span>
          {/if}
          {#if shop.data.phone}
            <span class="hidden sm:inline">•</span>
            <span class="flex items-center gap-1">
              <PhoneIcon class="size-4" />
              {shop.data.phone}
            </span>
          {/if}
        </div>

        <div class="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-7 md:mt-8">
          <Badge class="bg-white/20 text-white backdrop-blur-sm">
            {shop.data.productCount}+ Products
          </Badge>
        </div>
      </div>
    </section>

    <!-- Products Section -->
    <main class="p-4 sm:p-6 md:p-8">
      <!-- Section Header -->
      <div class="mb-6 sm:mb-8">
        <div>
          <h2 class="text-lg font-semibold sm:text-xl">All Products</h2>
          <p class="text-muted-foreground text-sm">
            {shop.data.productCount} products available
          </p>
        </div>
      </div>

      {#if allProducts.length === 0}
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <div class="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <ShoppingCartIcon class="text-muted-foreground size-8" />
          </div>
          <p class="text-lg font-medium">No products found</p>
          <p class="text-muted-foreground mt-1 text-sm">Try adjusting your category filter</p>
        </div>
      {:else}
        <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {#each allProducts as product (product.id)}
            <Card.Root class="gap-0 overflow-hidden p-0">
              <!-- Image Container -->
              <div class="bg-muted relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <!-- Out of Stock Overlay -->
                {#if !product.stock}
                  <div class="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span
                      class="bg-background text-foreground rounded-full px-3 py-1 text-sm font-medium"
                    >
                      Out of Stock
                    </span>
                  </div>
                {/if}
              </div>

              <Card.Content class=" p-4 ">
                <h3 class="line-clamp-2 text-sm leading-tight font-semibold sm:text-base">
                  {product.name}
                </h3>

                <div class="mt-auto flex flex-col gap-2 pt-2">
                  <div class="flex items-baseline gap-2">
                    <span class="text-lg font-bold sm:text-xl">
                      {formatPrice(product.priceCents)}
                    </span>
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      {/if}

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
    </main>
  {/if}
</div>
